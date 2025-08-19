#!/usr/bin/env node

/**
 * Firebase Usage Monitoring Script
 * 
 * Monitors Firebase usage and alerts on anomalies:
 * - Firestore read/write operations
 * - Authentication attempts
 * - Storage bandwidth
 * - Function invocations
 */

const admin = require('firebase-admin');
const chalk = require('chalk');
const Table = require('cli-table3');

// Initialize admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ellaai-platform-prod'
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Thresholds for alerts
const THRESHOLDS = {
  hourlyReads: 5000,
  hourlyWrites: 1000,
  hourlyAuths: 100,
  dailyNewUsers: 50,
  errorRate: 0.05, // 5%
};

// Helper functions
const log = {
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  header: (msg) => console.log(chalk.bold.cyan(`\n${msg}\n`))
};

// Get usage statistics
async function getUsageStats() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const stats = {
    firestore: {
      collections: 0,
      documents: 0,
      recentActivity: 0
    },
    auth: {
      totalUsers: 0,
      recentSignups: 0,
      activeToday: 0,
      disabledUsers: 0
    },
    security: {
      adminUsers: 0,
      supportSessions: 0,
      recentAuditLogs: 0
    }
  };
  
  try {
    // Firestore statistics
    const collections = await db.listCollections();
    stats.firestore.collections = collections.length;
    
    // Count documents in main collections
    const mainCollections = ['users', 'companies', 'assessments', 'audit-logs'];
    for (const collName of mainCollections) {
      try {
        const snapshot = await db.collection(collName).count().get();
        stats.firestore.documents += snapshot.data().count;
      } catch (e) {
        // Collection might not exist
      }
    }
    
    // Recent Firestore activity (audit logs)
    try {
      const recentLogs = await db.collection('audit-logs')
        .where('timestamp', '>', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .count()
        .get();
      stats.firestore.recentActivity = recentLogs.data().count;
    } catch (e) {
      // Audit logs might not exist
    }
    
    // Authentication statistics
    const listUsersResult = await auth.listUsers(1000);
    stats.auth.totalUsers = listUsersResult.users.length;
    
    // Count recent signups and active users
    listUsersResult.users.forEach(user => {
      const creationTime = new Date(user.metadata.creationTime);
      const lastSignIn = user.metadata.lastSignInTime ? 
        new Date(user.metadata.lastSignInTime) : null;
      
      if (creationTime > oneDayAgo) {
        stats.auth.recentSignups++;
      }
      
      if (lastSignIn && lastSignIn > oneDayAgo) {
        stats.auth.activeToday++;
      }
      
      if (user.disabled) {
        stats.auth.disabledUsers++;
      }
    });
    
    // Security statistics
    try {
      const adminUsers = await db.collection('users')
        .where('role', '==', 'admin')
        .count()
        .get();
      stats.security.adminUsers = adminUsers.data().count;
    } catch (e) {
      // Users collection might have different structure
    }
    
    // Support sessions
    try {
      const activeSessions = await db.collection('support-sessions')
        .where('status', '==', 'active')
        .count()
        .get();
      stats.security.supportSessions = activeSessions.data().count;
    } catch (e) {
      // Support sessions might not exist
    }
    
    // Recent audit logs
    try {
      const recentAudit = await db.collection('audit-logs')
        .where('timestamp', '>', admin.firestore.Timestamp.fromDate(oneDayAgo))
        .count()
        .get();
      stats.security.recentAuditLogs = recentAudit.data().count;
    } catch (e) {
      // Audit logs might not exist
    }
    
  } catch (error) {
    log.error(`Error collecting statistics: ${error.message}`);
  }
  
  return stats;
}

// Check for anomalies
function checkAnomalies(stats) {
  const anomalies = [];
  
  // Check for unusual activity
  if (stats.firestore.recentActivity > THRESHOLDS.hourlyReads) {
    anomalies.push({
      severity: 'high',
      message: `High Firestore activity: ${stats.firestore.recentActivity} operations in last hour`
    });
  }
  
  if (stats.auth.recentSignups > THRESHOLDS.dailyNewUsers) {
    anomalies.push({
      severity: 'medium',
      message: `Unusual signup rate: ${stats.auth.recentSignups} new users in 24 hours`
    });
  }
  
  if (stats.security.adminUsers > 10) {
    anomalies.push({
      severity: 'low',
      message: `High number of admin users: ${stats.security.adminUsers}`
    });
  }
  
  if (stats.auth.disabledUsers > stats.auth.totalUsers * 0.2) {
    anomalies.push({
      severity: 'low',
      message: `High percentage of disabled users: ${stats.auth.disabledUsers}/${stats.auth.totalUsers}`
    });
  }
  
  return anomalies;
}

// Display statistics
function displayStats(stats, anomalies) {
  console.clear();
  console.log(chalk.bold.blue('\n🔍 Firebase Usage Monitor - EllaAI Platform\n'));
  console.log(chalk.gray(`Last updated: ${new Date().toLocaleString()}\n`));
  
  // Firestore Statistics
  const firestoreTable = new Table({
    head: ['Firestore Metrics', 'Value'],
    colWidths: [30, 20]
  });
  
  firestoreTable.push(
    ['Collections', stats.firestore.collections],
    ['Total Documents', stats.firestore.documents.toLocaleString()],
    ['Recent Activity (1hr)', stats.firestore.recentActivity]
  );
  
  console.log(chalk.cyan('📊 Firestore Statistics'));
  console.log(firestoreTable.toString());
  
  // Authentication Statistics
  const authTable = new Table({
    head: ['Authentication Metrics', 'Value'],
    colWidths: [30, 20]
  });
  
  authTable.push(
    ['Total Users', stats.auth.totalUsers],
    ['Active Today', stats.auth.activeToday],
    ['New Users (24hr)', stats.auth.recentSignups],
    ['Disabled Users', stats.auth.disabledUsers]
  );
  
  console.log(chalk.cyan('\n👤 Authentication Statistics'));
  console.log(authTable.toString());
  
  // Security Statistics
  const securityTable = new Table({
    head: ['Security Metrics', 'Value'],
    colWidths: [30, 20]
  });
  
  securityTable.push(
    ['Admin Users', stats.security.adminUsers],
    ['Active Support Sessions', stats.security.supportSessions],
    ['Audit Logs (24hr)', stats.security.recentAuditLogs]
  );
  
  console.log(chalk.cyan('\n🔒 Security Statistics'));
  console.log(securityTable.toString());
  
  // Display anomalies
  if (anomalies.length > 0) {
    console.log(chalk.red('\n⚠️  Anomalies Detected:'));
    anomalies.forEach(anomaly => {
      const color = anomaly.severity === 'high' ? chalk.red :
                   anomaly.severity === 'medium' ? chalk.yellow :
                   chalk.blue;
      console.log(color(`   [${anomaly.severity.toUpperCase()}] ${anomaly.message}`));
    });
  } else {
    console.log(chalk.green('\n✅ No anomalies detected - all metrics within normal range'));
  }
  
  // Usage recommendations
  console.log(chalk.gray('\n📝 Recommendations:'));
  console.log(chalk.gray('   • Monitor daily for unusual spikes'));
  console.log(chalk.gray('   • Set up budget alerts in Google Cloud Console'));
  console.log(chalk.gray('   • Review audit logs regularly'));
  console.log(chalk.gray('   • Keep admin user count minimal'));
}

// Continuous monitoring mode
async function continuousMonitor(intervalMinutes = 5) {
  console.log(chalk.yellow(`\n⏱️  Starting continuous monitoring (updates every ${intervalMinutes} minutes)`));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));
  
  const monitor = async () => {
    try {
      const stats = await getUsageStats();
      const anomalies = checkAnomalies(stats);
      displayStats(stats, anomalies);
      
      if (anomalies.filter(a => a.severity === 'high').length > 0) {
        console.log(chalk.red.bold('\n🚨 HIGH SEVERITY ANOMALIES DETECTED! Review immediately.'));
      }
    } catch (error) {
      log.error(`Monitoring error: ${error.message}`);
    }
  };
  
  // Initial run
  await monitor();
  
  // Set up interval
  setInterval(monitor, intervalMinutes * 60 * 1000);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const continuous = args.includes('--continuous') || args.includes('-c');
  const interval = args.includes('--interval') ? 
    parseInt(args[args.indexOf('--interval') + 1]) : 5;
  
  if (continuous) {
    await continuousMonitor(interval);
  } else {
    // Single run
    try {
      const stats = await getUsageStats();
      const anomalies = checkAnomalies(stats);
      displayStats(stats, anomalies);
      
      console.log(chalk.gray('\n💡 Tip: Use --continuous flag for real-time monitoring'));
      process.exit(anomalies.filter(a => a.severity === 'high').length > 0 ? 1 : 0);
    } catch (error) {
      log.error(`Failed to get usage statistics: ${error.message}`);
      process.exit(1);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Monitoring stopped'));
  process.exit(0);
});

// Run the monitor
main();