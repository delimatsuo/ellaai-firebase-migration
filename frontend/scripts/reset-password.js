// Script to reset password for admin user
// Run with: node scripts/reset-password.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ellaai-platform-prod'
});

async function resetUserPassword() {
  const email = 'admin@ellatechtalent.com';
  const newPassword = 'EllaAdmin2024!';
  
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Found user:', user.uid);
    
    // Update password
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });
    
    console.log('✅ Password reset successfully!');
    console.log('Email:', email);
    console.log('New Password:', newPassword);
    console.log('\nYou can now login with these credentials.');
    
  } catch (error) {
    console.error('Error resetting password:', error);
    
    // If user doesn't exist, create them
    if (error.code === 'auth/user-not-found') {
      console.log('User not found. Creating new admin user...');
      
      try {
        const newUser = await admin.auth().createUser({
          email: email,
          password: newPassword,
          emailVerified: true,
          displayName: 'Admin User'
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('User ID:', newUser.uid);
        console.log('Email:', email);
        console.log('Password:', newPassword);
        
        // Also create user profile in Firestore
        await admin.firestore().collection('users').doc(newUser.uid).set({
          email: email,
          displayName: 'Admin User',
          role: 'system_admin',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          emailVerified: true
        });
        
        console.log('✅ User profile created in Firestore');
        
      } catch (createError) {
        console.error('Error creating user:', createError);
      }
    }
  }
  
  process.exit(0);
}

resetUserPassword();