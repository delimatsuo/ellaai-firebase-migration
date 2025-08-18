import * as admin from 'firebase-admin';

/**
 * Transaction helpers for company lifecycle operations
 */
export class TransactionHelpers {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Execute a transaction with automatic retry and error handling
   */
  async executeTransaction<T>(
    operation: (transaction: admin.firestore.Transaction) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.db.runTransaction(operation);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry certain types of errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        console.log(`Transaction attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Execute a batch operation with validation
   */
  async executeBatch(
    operations: (batch: admin.firestore.WriteBatch) => void,
    validateOperation?: () => Promise<void>
  ): Promise<void> {
    if (validateOperation) {
      await validateOperation();
    }

    const batch = this.db.batch();
    operations(batch);
    await batch.commit();
  }

  /**
   * Create a distributed lock for critical operations
   */
  async acquireLock(
    lockName: string,
    ttlSeconds: number = 300,
    maxWaitSeconds: number = 30
  ): Promise<string> {
    const lockId = this.generateLockId();
    const lockRef = this.db.collection('locks').doc(lockName);
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + ttlSeconds * 1000)
    );

    const startTime = Date.now();
    const maxWaitTime = maxWaitSeconds * 1000;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        await this.db.runTransaction(async (transaction) => {
          const lockDoc = await transaction.get(lockRef);

          if (lockDoc.exists) {
            const lockData = lockDoc.data();
            const now = admin.firestore.Timestamp.now();
            
            // Check if lock has expired
            if (lockData?.expiresAt && lockData.expiresAt.toMillis() > now.toMillis()) {
              throw new Error('Lock is currently held by another process');
            }
          }

          // Acquire or renew the lock
          transaction.set(lockRef, {
            lockId,
            expiresAt,
            acquiredAt: admin.firestore.Timestamp.now(),
            process: 'company-lifecycle-service'
          });
        });

        return lockId;

      } catch (error: any) {
        if (error.message.includes('Lock is currently held')) {
          // Wait and retry
          await this.sleep(Math.random() * 1000 + 500); // Random delay 500-1500ms
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Failed to acquire lock '${lockName}' within ${maxWaitSeconds} seconds`);
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lockName: string, lockId: string): Promise<void> {
    const lockRef = this.db.collection('locks').doc(lockName);

    await this.db.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (!lockDoc.exists) {
        return; // Lock doesn't exist, nothing to release
      }

      const lockData = lockDoc.data();
      
      // Verify we own this lock
      if (lockData?.lockId !== lockId) {
        throw new Error('Cannot release lock: lock ID mismatch');
      }

      transaction.delete(lockRef);
    });
  }

  /**
   * Create a checkpoint for long-running operations
   */
  async createCheckpoint(
    operationId: string,
    checkpoint: {
      step: string;
      completedSteps: string[];
      data: Record<string, any>;
      timestamp: admin.firestore.Timestamp;
    }
  ): Promise<void> {
    const checkpointRef = this.db.collection('operation-checkpoints').doc(operationId);
    
    await checkpointRef.set({
      ...checkpoint,
      lastUpdated: admin.firestore.Timestamp.now()
    }, { merge: true });
  }

  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(operationId: string): Promise<{
    step: string;
    completedSteps: string[];
    data: Record<string, any>;
    timestamp: admin.firestore.Timestamp;
  } | null> {
    const checkpointDoc = await this.db
      .collection('operation-checkpoints')
      .doc(operationId)
      .get();

    if (!checkpointDoc.exists) {
      return null;
    }

    return checkpointDoc.data() as {
      step: string;
      completedSteps: string[];
      data: Record<string, any>;
      timestamp: admin.firestore.Timestamp;
    };
  }

  /**
   * Clean up old checkpoints
   */
  async cleanupCheckpoints(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    );

    const oldCheckpoints = await this.db
      .collection('operation-checkpoints')
      .where('timestamp', '<', cutoffDate)
      .get();

    if (oldCheckpoints.empty) {
      return 0;
    }

    const batch = this.db.batch();
    oldCheckpoints.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return oldCheckpoints.size;
  }

  /**
   * Validate data consistency across related documents
   */
  async validateConsistency(validations: {
    collection: string;
    documentId: string;
    field: string;
    expectedValue: any;
  }[]): Promise<{ isConsistent: boolean; errors: string[] }> {
    const errors: string[] = [];

    await this.db.runTransaction(async (transaction) => {
      for (const validation of validations) {
        const docRef = this.db.collection(validation.collection).doc(validation.documentId);
        const doc = await transaction.get(docRef);

        if (!doc.exists) {
          errors.push(`Document ${validation.collection}/${validation.documentId} does not exist`);
          continue;
        }

        const data = doc.data();
        const actualValue = this.getNestedValue(data, validation.field);

        if (actualValue !== validation.expectedValue) {
          errors.push(
            `Consistency error in ${validation.collection}/${validation.documentId}.${validation.field}: ` +
            `expected ${validation.expectedValue}, got ${actualValue}`
          );
        }
      }
    });

    return {
      isConsistent: errors.length === 0,
      errors
    };
  }

  /**
   * Create rollback point for operations
   */
  async createRollbackPoint(
    operationId: string,
    documentsToTrack: { collection: string; documentId: string }[]
  ): Promise<void> {
    const rollbackData: Record<string, any> = {};

    await this.db.runTransaction(async (transaction) => {
      for (const docInfo of documentsToTrack) {
        const docRef = this.db.collection(docInfo.collection).doc(docInfo.documentId);
        const doc = await transaction.get(docRef);

        rollbackData[`${docInfo.collection}/${docInfo.documentId}`] = {
          exists: doc.exists,
          data: doc.exists ? doc.data() : null
        };
      }
    });

    const rollbackRef = this.db.collection('rollback-points').doc(operationId);
    await rollbackRef.set({
      operationId,
      createdAt: admin.firestore.Timestamp.now(),
      documents: rollbackData
    });
  }

  /**
   * Execute rollback to previous state
   */
  async executeRollback(operationId: string): Promise<void> {
    const rollbackDoc = await this.db
      .collection('rollback-points')
      .doc(operationId)
      .get();

    if (!rollbackDoc.exists) {
      throw new Error(`No rollback point found for operation ${operationId}`);
    }

    const rollbackData = rollbackDoc.data();
    if (!rollbackData || !rollbackData.documents) {
      throw new Error('Invalid rollback data');
    }
    
    const batch = this.db.batch();

    for (const [docPath, docInfo] of Object.entries(rollbackData.documents)) {
      const [collection, documentId] = docPath.split('/');
      const docRef = this.db.collection(collection).doc(documentId);

      const rollbackInfo = docInfo as { exists: boolean; data: any };
      if (rollbackInfo.exists) {
        batch.set(docRef, rollbackInfo.data);
      } else {
        batch.delete(docRef);
      }
    }

    await batch.commit();

    // Mark rollback as used
    await rollbackDoc.ref.update({
      rolledBackAt: admin.firestore.Timestamp.now(),
      used: true
    });
  }

  /**
   * Utility methods
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'failed-precondition'
    ];

    return nonRetryableCodes.includes(error.code) || 
           error.message.includes('Document not found') ||
           error.message.includes('Permission denied');
  }

  private generateLockId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key];
    }, obj);
  }
}

export const transactionHelpers = new TransactionHelpers();