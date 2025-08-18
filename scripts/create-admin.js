#!/usr/bin/env node

/**
 * Script to create admin user for EllaAI platform
 * Usage: node scripts/create-admin.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin with application default credentials
admin.initializeApp({
  projectId: 'ellaai-platform-prod'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  console.log('🔐 EllaAI Admin User Setup\n');
  
  const email = 'admin@ellatechtalent.com';
  const password = 'EllaTech2024Admin!@#';
  const displayName = 'System Administrator';

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`✅ User already exists: ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true
        });
        console.log(`✅ Admin user created: ${email}`);
      } else {
        throw error;
      }
    }

    // Set custom claims for admin role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      company_id: 'ellatechtalent',
      permissions: ['all'],
      isSystemAdmin: true
    });
    console.log('✅ Admin role assigned');

    // Create user document in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'admin',
      company_id: 'ellatechtalent',
      isSystemAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ User profile created in Firestore');

    console.log('\n' + '='.repeat(50));
    console.log('ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('Login URL: https://ellaai-platform-prod.web.app/login');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Confirm before creating
rl.question('Create admin user for EllaAI? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    createAdminUser();
  } else {
    console.log('Admin creation cancelled.');
    rl.close();
  }
});