#!/usr/bin/env node

/**
 * Production Verification Script
 * Verifies that the production build doesn't contain any localhost references
 * or development-only code that could cause WebSocket connection issues.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patterns to check for in production bundle
const forbiddenPatterns = [
  /localhost:8080/gi,
  /localhost:9099/gi,
  /localhost:5001/gi,
  /localhost:9199/gi,
  /127\.0\.0\.1:8080/gi,
  /127\.0\.0\.1:9099/gi,
  /127\.0\.0\.1:5001/gi,
  /127\.0\.0\.1:9199/gi,
  /connectAuthEmulator/gi,
  /connectFirestoreEmulator/gi,
  /connectFunctionsEmulator/gi,
  /connectStorageEmulator/gi,
  /ws:\/\/localhost/gi,
  /demo-project/gi,
  /"firebase-admin"/gi, // Should not be in frontend bundle
  /import.*firebase-admin/gi
];

// Patterns that should be present in production
const requiredPatterns = [
  /ellaai-platform-prod/gi,
  /AIzaSyDSdftFqUvIjCoRhIqLR0sI9B99R4hQcNU/gi,
  /"prod"/gi
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

function checkFile(filePath) {
  const ext = extname(filePath);
  
  // Only check JS, CSS, and HTML files
  if (!['.js', '.css', '.html', '.json'].includes(ext)) {
    return { valid: true, issues: [] };
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for forbidden patterns
    forbiddenPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: 'forbidden',
          pattern: pattern.toString(),
          matches: matches.length,
          sample: matches[0]
        });
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return { valid: true, issues: [] };
  }
}

function checkProductionConfig() {
  console.log('🔍 Verifying production configuration...');
  
  const distPath = join(__dirname, '../dist');
  
  try {
    const allFiles = getAllFiles(distPath);
    const jsFiles = allFiles.filter(file => extname(file) === '.js');
    const cssFiles = allFiles.filter(file => extname(file) === '.css');
    const htmlFiles = allFiles.filter(file => extname(file) === '.html');
    
    console.log(`📁 Found ${jsFiles.length} JS files, ${cssFiles.length} CSS files, ${htmlFiles.length} HTML files`);
    
    let totalIssues = 0;
    const problemFiles = [];

    // Check all relevant files
    [...jsFiles, ...cssFiles, ...htmlFiles].forEach(file => {
      const result = checkFile(file);
      
      if (!result.valid) {
        totalIssues += result.issues.length;
        problemFiles.push({
          file: file.replace(distPath, ''),
          issues: result.issues
        });
      }
    });

    // Report results
    console.log('\n📊 Verification Results:');
    console.log(`Total files checked: ${jsFiles.length + cssFiles.length + htmlFiles.length}`);
    console.log(`Issues found: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('✅ Production build is clean - no localhost references found');
      console.log('✅ No WebSocket connection issues detected');
      return true;
    } else {
      console.log('\n🚨 Issues found in production build:');
      
      problemFiles.forEach(({ file, issues }) => {
        console.log(`\n📄 File: ${file}`);
        issues.forEach(issue => {
          console.log(`  ❌ ${issue.type}: ${issue.pattern} (${issue.matches} matches)`);
          console.log(`     Sample: "${issue.sample}"`);
        });
      });
      
      console.log('\n💡 Recommendations:');
      console.log('1. Ensure VITE_ENV=production is set during build');
      console.log('2. Check that all environment variables are properly defined');
      console.log('3. Verify that development-only code is properly excluded');
      console.log('4. Run: npm run build with production environment variables');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('\n🌍 Checking environment variables...');
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_API_URL'
  ];
  
  const missingVars = [];
  const invalidVars = [];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else if (value.includes('localhost') || value.includes('127.0.0.1')) {
      invalidVars.push({ name: varName, value });
    }
  });
  
  if (missingVars.length === 0 && invalidVars.length === 0) {
    console.log('✅ All environment variables are properly configured');
    return true;
  } else {
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => console.log(`  - ${varName}`));
    }
    
    if (invalidVars.length > 0) {
      console.log('❌ Invalid environment variables (contain localhost):');
      invalidVars.forEach(({ name, value }) => console.log(`  - ${name}: ${value}`));
    }
    
    return false;
  }
}

function main() {
  console.log('🚀 Production Build Verification Script');
  console.log('=====================================\n');
  
  const envCheck = checkEnvironmentVariables();
  const buildCheck = checkProductionConfig();
  
  console.log('\n📋 Summary:');
  console.log(`Environment Variables: ${envCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Production Build: ${buildCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  if (envCheck && buildCheck) {
    console.log('\n🎉 All checks passed! Production build is ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some checks failed. Please fix the issues before deploying.');
    process.exit(1);
  }
}

main();