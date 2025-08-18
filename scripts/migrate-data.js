/**
 * Data Migration Script for EllaAI Firebase Migration
 * 
 * This script helps migrate data from the existing Next.js/Supabase setup
 * to the new Firebase/Firestore structure.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(__dirname, '../serviceAccountKey.json');
    
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Migration functions
 */

async function migrateUsers(userData) {
  console.log('📋 Migrating users...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const user of userData) {
    const userRef = db.collection('users').doc(user.uid);
    batch.set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.full_name,
      photoURL: user.photoURL || user.avatar_url,
      role: user.role || 'candidate',
      companyId: user.company_id,
      companyAccess: user.company_access || [],
      emailVerified: user.email_verified || false,
      createdAt: user.created_at ? admin.firestore.Timestamp.fromDate(new Date(user.created_at)) : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    count++;
    
    // Commit in batches of 500 (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} users`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully migrated ${count} users`);
}

async function migrateAssessments(assessmentData) {
  console.log('📋 Migrating assessments...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const assessment of assessmentData) {
    const assessmentRef = db.collection('assessments').doc();
    batch.set(assessmentRef, {
      title: assessment.title,
      description: assessment.description,
      positionId: assessment.position_id,
      companyId: assessment.company_id,
      candidateId: assessment.candidate_id,
      questions: assessment.questions || [],
      timeLimit: assessment.time_limit || 60,
      difficulty: assessment.difficulty || 'medium',
      skills: assessment.skills || [],
      status: assessment.status || 'draft',
      createdBy: assessment.created_by,
      createdAt: assessment.created_at ? admin.firestore.Timestamp.fromDate(new Date(assessment.created_at)) : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    count++;
    
    // Commit in batches of 500
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} assessments`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully migrated ${count} assessments`);
}

async function migrateAssessmentAttempts(attemptData) {
  console.log('📋 Migrating assessment attempts...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const attempt of attemptData) {
    const attemptRef = db.collection('assessment-attempts').doc();
    batch.set(attemptRef, {
      assessmentId: attempt.assessment_id,
      candidateId: attempt.candidate_id,
      startedAt: attempt.started_at ? admin.firestore.Timestamp.fromDate(new Date(attempt.started_at)) : admin.firestore.FieldValue.serverTimestamp(),
      completedAt: attempt.completed_at ? admin.firestore.Timestamp.fromDate(new Date(attempt.completed_at)) : null,
      status: attempt.status || 'in_progress',
      answers: attempt.answers || [],
      timeRemaining: attempt.time_remaining || 0,
      score: attempt.score,
      evaluation: attempt.evaluation,
    });
    
    count++;
    
    // Commit in batches of 500
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} assessment attempts`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully migrated ${count} assessment attempts`);
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting EllaAI data migration...\n');
  
  try {
    // Load your existing data from JSON files or database exports
    // You'll need to export your data from Supabase/existing database first
    
    // Example data loading (replace with your actual data sources)
    const userData = require('../data/users.json') || [];
    const assessmentData = require('../data/assessments.json') || [];
    const attemptData = require('../data/assessment-attempts.json') || [];
    
    console.log(`Found ${userData.length} users to migrate`);
    console.log(`Found ${assessmentData.length} assessments to migrate`);
    console.log(`Found ${attemptData.length} assessment attempts to migrate\n`);
    
    // Run migrations
    if (userData.length > 0) {
      await migrateUsers(userData);
    }
    
    if (assessmentData.length > 0) {
      await migrateAssessments(assessmentData);
    }
    
    if (attemptData.length > 0) {
      await migrateAssessmentAttempts(attemptData);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   Users: ${userData.length}`);
    console.log(`   Assessments: ${assessmentData.length}`);
    console.log(`   Assessment Attempts: ${attemptData.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Cleanup function to remove test data
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  const collections = ['users', 'assessments', 'assessment-attempts'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      continue;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Cleaned up ${snapshot.size} documents from ${collectionName}`);
  }
  
  console.log('🎉 Cleanup completed!');
}

// CLI handling
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestData();
} else if (command === 'migrate' || !command) {
  runMigration();
} else {
  console.log('Usage:');
  console.log('  node migrate-data.js migrate   # Run the migration');
  console.log('  node migrate-data.js cleanup   # Clean up test data');
  process.exit(1);
}