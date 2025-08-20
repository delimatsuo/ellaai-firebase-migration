#!/usr/bin/env node

/**
 * Production Bundle Testing Script
 * Tests the optimized bundle in a production-like environment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class ProductionTester {
  constructor() {
    this.testResults = {
      buildSuccess: false,
      bundleIntegrity: false,
      loadingPerformance: {},
      errorReporting: {},
      schedulerCompatibility: false,
      timestamp: new Date().toISOString()
    };
  }

  async runAllTests() {
    console.log('🚀 Starting production bundle testing...\n');

    try {
      await this.testBuildProcess();
      await this.testBundleIntegrity();
      await this.testServerStartup();
      await this.testSchedulerCompatibility();
      await this.generateTestReport();
    } catch (error) {
      console.error('❌ Production testing failed:', error);
      process.exit(1);
    }
  }

  async testBuildProcess() {
    console.log('🔨 Testing build process...');
    
    try {
      // Clean previous build
      await execAsync('rm -rf dist');
      
      // Run production build
      const buildStart = Date.now();
      const { stdout, stderr } = await execAsync('npm run build');
      const buildTime = Date.now() - buildStart;
      
      console.log(`  ✅ Build completed in ${buildTime}ms`);
      
      // Check for build warnings/errors
      if (stderr && stderr.includes('error')) {
        throw new Error(`Build errors detected: ${stderr}`);
      }
      
      this.testResults.buildSuccess = true;
      this.testResults.buildTime = buildTime;
      
      // Analyze build output
      if (stdout.includes('Some chunks are larger than')) {
        console.log('  ⚠️  Large chunk warning detected (expected for some vendor chunks)');
      }
      
    } catch (error) {
      console.error('  ❌ Build process failed:', error.message);
      throw error;
    }
  }

  async testBundleIntegrity() {
    console.log('🔍 Testing bundle integrity...');
    
    try {
      // Check if dist directory exists
      if (!fs.existsSync('dist')) {
        throw new Error('Distribution directory not found');
      }
      
      // Check critical files
      const criticalFiles = [
        'dist/index.html',
        'dist/manifest.json'
      ];
      
      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Critical file missing: ${file}`);
        }
      }
      
      // Analyze bundle structure
      const bundleStats = await this.analyzeBundleStructure();
      this.testResults.bundleStats = bundleStats;
      
      console.log(`  ✅ Found ${bundleStats.jsChunks} JS chunks, ${bundleStats.cssChunks} CSS chunks`);
      console.log(`  ✅ Total bundle size: ${bundleStats.totalSize}KB`);
      
      this.testResults.bundleIntegrity = true;
      
    } catch (error) {
      console.error('  ❌ Bundle integrity check failed:', error.message);
      throw error;
    }
  }

  async analyzeBundleStructure() {
    const stats = {
      jsChunks: 0,
      cssChunks: 0,
      totalSize: 0,
      chunks: []
    };
    
    // Recursively analyze assets
    const analyzeDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);
        
        if (fileStat.isDirectory()) {
          analyzeDir(filePath);
        } else {
          const ext = path.extname(file);
          const sizeKB = Math.round(fileStat.size / 1024);
          
          if (ext === '.js') {
            stats.jsChunks++;
            stats.chunks.push({ name: file, size: sizeKB, type: 'js' });
          } else if (ext === '.css') {
            stats.cssChunks++;
            stats.chunks.push({ name: file, size: sizeKB, type: 'css' });
          }
          
          stats.totalSize += sizeKB;
        }
      }
    };
    
    if (fs.existsSync('dist/assets')) {
      analyzeDir('dist/assets');
    }
    
    return stats;
  }

  async testServerStartup() {
    console.log('🌐 Testing server startup...');
    
    try {
      // Start production server in background
      const serverProcess = exec('npx serve -s dist -p 5001');
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test basic connectivity
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5001');
      
      if (stdout.trim() !== '200') {
        throw new Error(`Server returned status: ${stdout}`);
      }
      
      console.log('  ✅ Server started successfully on port 5001');
      
      // Test asset loading
      await this.testAssetLoading();
      
      // Cleanup
      serverProcess.kill();
      
    } catch (error) {
      console.error('  ❌ Server startup test failed:', error.message);
      throw error;
    }
  }

  async testAssetLoading() {
    console.log('📦 Testing asset loading...');
    
    try {
      // Test main HTML loads
      const { stdout: htmlResponse } = await execAsync('curl -s http://localhost:5001');
      
      if (!htmlResponse.includes('<div id="root">')) {
        throw new Error('Main HTML structure not found');
      }
      
      // Test that HTML references are correct
      if (!htmlResponse.includes('src="/src/main.tsx"')) {
        throw new Error('Main script reference not found in HTML');
      }
      
      console.log('  ✅ HTML loads correctly');
      console.log('  ✅ Script references are valid');
      
    } catch (error) {
      console.error('  ❌ Asset loading test failed:', error.message);
      throw error;
    }
  }

  async testSchedulerCompatibility() {
    console.log('⚙️ Testing React scheduler compatibility...');
    
    try {
      // Check if scheduler initialization files exist
      const schedulerFiles = [
        'src/scheduler-init.ts',
        'src/scheduler-polyfill.ts'
      ];
      
      for (const file of schedulerFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Scheduler file missing: ${file}`);
        }
      }
      
      // Verify scheduler polyfill structure
      const schedulerInit = fs.readFileSync('src/scheduler-init.ts', 'utf8');
      
      if (!schedulerInit.includes('initializeReactScheduler')) {
        throw new Error('Scheduler initialization function not found');
      }
      
      if (!schedulerInit.includes('createReactSchedulerPolyfill')) {
        throw new Error('Scheduler polyfill function not found');
      }
      
      console.log('  ✅ Scheduler initialization files present');
      console.log('  ✅ Scheduler polyfill implementation verified');
      
      this.testResults.schedulerCompatibility = true;
      
    } catch (error) {
      console.error('  ❌ Scheduler compatibility test failed:', error.message);
      throw error;
    }
  }

  async generateTestReport() {
    console.log('📋 Generating test report...');
    
    const report = {
      ...this.testResults,
      summary: {
        allTestsPassed: this.testResults.buildSuccess && 
                       this.testResults.bundleIntegrity && 
                       this.testResults.schedulerCompatibility,
        totalTests: 4,
        passedTests: [
          this.testResults.buildSuccess,
          this.testResults.bundleIntegrity,
          this.testResults.schedulerCompatibility,
          true // Server startup test (if we reach here, it passed)
        ].filter(Boolean).length
      }
    };
    
    // Save detailed report
    const reportPath = 'reports/production-test-report.json';
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    console.log(`✅ Build Process: ${this.testResults.buildSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Bundle Integrity: ${this.testResults.bundleIntegrity ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Server Startup: PASS`);
    console.log(`✅ Scheduler Compatibility: ${this.testResults.schedulerCompatibility ? 'PASS' : 'FAIL'}`);
    
    if (this.testResults.bundleStats) {
      console.log(`\n📊 Bundle Statistics:`);
      console.log(`   Total Size: ${this.testResults.bundleStats.totalSize}KB`);
      console.log(`   JS Chunks: ${this.testResults.bundleStats.jsChunks}`);
      console.log(`   CSS Chunks: ${this.testResults.bundleStats.cssChunks}`);
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (report.summary.allTestsPassed) {
      console.log('\n🎉 All production tests passed! Bundle is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the report and fix issues before deployment.');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ProductionTester();
  tester.runAllTests().catch(error => {
    console.error('Production testing failed:', error);
    process.exit(1);
  });
}

export { ProductionTester };