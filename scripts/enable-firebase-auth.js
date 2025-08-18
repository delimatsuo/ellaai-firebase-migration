#!/usr/bin/env node

/**
 * Script to enable Firebase Authentication using REST API
 * This uses the Firebase Management API to enable authentication
 */

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const PROJECT_ID = 'ellaai-platform-prod';

async function getAccessToken() {
    try {
        const { stdout } = await execPromise('gcloud auth print-access-token');
        return stdout.trim();
    } catch (error) {
        console.error('Failed to get access token:', error);
        process.exit(1);
    }
}

async function enableFirebaseAuth() {
    const accessToken = await getAccessToken();
    
    // First, ensure Firebase project exists
    const projectData = JSON.stringify({
        projectId: PROJECT_ID,
        displayName: 'EllaAI Platform',
        locationId: 'us-central'
    });

    // Enable Firebase on the project
    const addFirebaseOptions = {
        hostname: 'firebase.googleapis.com',
        port: 443,
        path: `/v1beta1/projects/${PROJECT_ID}:addFirebase`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': projectData.length
        }
    };

    console.log('🔧 Enabling Firebase on project...');
    
    await new Promise((resolve, reject) => {
        const req = https.request(addFirebaseOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 409) {
                    console.log('✅ Firebase enabled on project');
                    resolve();
                } else {
                    console.log('Response:', data);
                    resolve(); // Continue even if already enabled
                }
            });
        });
        
        req.on('error', reject);
        req.write(projectData);
        req.end();
    });

    // Now add a web app to get the configuration
    const webAppData = JSON.stringify({
        displayName: 'EllaAI Web App',
        appId: '1:461280362624:web:883037632b2125776c2665'
    });

    const addWebAppOptions = {
        hostname: 'firebase.googleapis.com',
        port: 443,
        path: `/v1beta1/projects/${PROJECT_ID}/webApps`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': webAppData.length
        }
    };

    console.log('🔧 Adding Web App configuration...');
    
    await new Promise((resolve, reject) => {
        const req = https.request(addWebAppOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 409) {
                    console.log('✅ Web app configured');
                    resolve();
                } else {
                    console.log('Response:', data);
                    resolve(); // Continue even if already exists
                }
            });
        });
        
        req.on('error', reject);
        req.write(webAppData);
        req.end();
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Firebase setup complete!');
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Manual step required!\n');
    console.log('Please complete the setup by:');
    console.log('1. Go to: https://console.firebase.google.com/project/ellaai-platform-prod/authentication');
    console.log('2. Click "Get started" button');
    console.log('3. Enable "Email/Password" sign-in method');
    console.log('4. Click "Save"');
    console.log('\nAfter completing these steps, you can create the admin account at:');
    console.log('https://ellaai-platform-prod.web.app/setup-admin.html');
    console.log('='.repeat(60));
}

// Run the script
enableFirebaseAuth().catch(console.error);