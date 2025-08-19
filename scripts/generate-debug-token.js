#!/usr/bin/env node

/**
 * Firebase App Check Debug Token Generator
 * Use this for testing App Check in development
 */

const crypto = require('crypto');

// Generate a debug token
const debugToken = crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Firebase App Check Debug Token:\n');
console.log(debugToken);
console.log('\nTo use this token:\n');
console.log('1. Add to Firebase Console > App Check > Apps > Your App > Debug Tokens');
console.log('2. Add to your .env file:');
console.log('   VITE_APP_CHECK_DEBUG_TOKEN=' + debugToken);
console.log('\n⚠️  Only use debug tokens in development!\n');
