#!/usr/bin/env node

/**
 * Advanced Bundle Analysis Script
 * Analyzes Vite bundle composition and identifies optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class BundleAnalyzer {
  constructor() {
    this.distPath = path.join(process.cwd(), 'dist');
    this.assetsPath = path.join(this.distPath, 'assets');
    this.analysis = {
      bundles: [],
      totalSize: 0,
      gzipSize: 0,
      issues: [],
      recommendations: []
    };
  }

  async analyzeBundles() {
    console.log('🔍 Starting comprehensive bundle analysis...\n');

    // Check if dist directory exists
    if (!fs.existsSync(this.distPath)) {
      throw new Error('Distribution directory not found. Run "npm run build" first.');
    }

    await this.analyzeJavaScriptBundles();
    await this.analyzeCSSBundles();
    await this.analyzeAssetFiles();
    await this.checkBundleStructure();
    await this.generateRecommendations();

    return this.analysis;
  }

  async analyzeJavaScriptBundles() {
    console.log('📦 Analyzing JavaScript bundles...');

    const jsFiles = fs.readdirSync(this.assetsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file,
        path: path.join(this.assetsPath, file),
        type: this.getBundleType(file)
      }));

    for (const bundle of jsFiles) {
      const stats = fs.statSync(bundle.path);
      const sizeKB = Math.round(stats.size / 1024);
      
      // Estimate gzip size (rough approximation)
      const gzipSizeKB = Math.round(sizeKB * 0.3);

      const bundleInfo = {
        name: bundle.name,
        type: bundle.type,
        size: sizeKB,
        gzipSize: gzipSizeKB,
        path: bundle.path
      };

      this.analysis.bundles.push(bundleInfo);
      this.analysis.totalSize += sizeKB;
      this.analysis.gzipSize += gzipSizeKB;

      console.log(`  ${bundle.name}: ${sizeKB}KB (${gzipSizeKB}KB gzipped) - ${bundle.type}`);

      // Check for oversized bundles
      if (sizeKB > 1000) {
        this.analysis.issues.push({
          type: 'OVERSIZED_BUNDLE',
          bundle: bundle.name,
          size: sizeKB,
          severity: 'HIGH',
          description: `Bundle ${bundle.name} is ${sizeKB}KB, exceeding 1MB threshold`
        });
      }
    }

    console.log(`\n📊 Total JS: ${this.analysis.totalSize}KB (${this.analysis.gzipSize}KB gzipped)\n`);
  }

  async analyzeCSSBundles() {
    console.log('🎨 Analyzing CSS bundles...');

    const cssFiles = fs.readdirSync(this.assetsPath)
      .filter(file => file.endsWith('.css'))
      .map(file => ({
        name: file,
        path: path.join(this.assetsPath, file)
      }));

    let totalCSSSize = 0;

    for (const cssFile of cssFiles) {
      const stats = fs.statSync(cssFile.path);
      const sizeKB = Math.round(stats.size / 1024);
      totalCSSSize += sizeKB;

      console.log(`  ${cssFile.name}: ${sizeKB}KB`);
    }

    console.log(`\n📊 Total CSS: ${totalCSSSize}KB\n`);
  }

  async analyzeAssetFiles() {
    console.log('🖼️ Analyzing static assets...');

    const assetDirs = ['images', 'fonts', 'icons'].filter(dir => 
      fs.existsSync(path.join(this.assetsPath, dir))
    );

    for (const dir of assetDirs) {
      const dirPath = path.join(this.assetsPath, dir);
      const files = fs.readdirSync(dirPath);
      let dirSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        dirSize += stats.size;
      }

      const sizeKB = Math.round(dirSize / 1024);
      console.log(`  ${dir}: ${sizeKB}KB (${files.length} files)`);
    }

    console.log();
  }

  getBundleType(filename) {
    if (filename.includes('react-vendor')) return 'React Core';
    if (filename.includes('react-ecosystem')) return 'React Libraries';
    if (filename.includes('firebase')) return 'Firebase';
    if (filename.includes('mui')) return 'Material-UI';
    if (filename.includes('monaco')) return 'Monaco Editor';
    if (filename.includes('charts')) return 'Charts';
    if (filename.includes('vendor')) return 'Third-party';
    if (filename.includes('index')) return 'Application Code';
    return 'Unknown';
  }

  async checkBundleStructure() {
    console.log('🏗️ Checking bundle structure...');

    // Check for main bundle size issues
    const mainBundle = this.analysis.bundles.find(b => b.type === 'Application Code');
    if (mainBundle && mainBundle.size > 500) {
      this.analysis.issues.push({
        type: 'LARGE_MAIN_BUNDLE',
        bundle: mainBundle.name,
        size: mainBundle.size,
        severity: 'CRITICAL',
        description: `Main bundle is ${mainBundle.size}KB. Should be under 500KB for optimal performance.`
      });
    }

    // Check vendor bundle distribution
    const vendorBundles = this.analysis.bundles.filter(b => b.type.includes('vendor') || b.type.includes('Core') || b.type.includes('Libraries'));
    const vendorSize = vendorBundles.reduce((sum, b) => sum + b.size, 0);
    
    if (vendorSize < this.analysis.totalSize * 0.3) {
      this.analysis.issues.push({
        type: 'INSUFFICIENT_CODE_SPLITTING',
        severity: 'MEDIUM',
        description: `Only ${Math.round(vendorSize / this.analysis.totalSize * 100)}% of code is properly split into vendor chunks.`
      });
    }

    console.log(`  ✅ Bundle structure analysis complete\n`);
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');

    // Main bundle optimization
    const mainBundle = this.analysis.bundles.find(b => b.type === 'Application Code');
    if (mainBundle && mainBundle.size > 500) {
      this.analysis.recommendations.push({
        type: 'CODE_SPLITTING',
        priority: 'HIGH',
        title: 'Implement Advanced Code Splitting',
        description: 'Split the main bundle using dynamic imports and route-based chunking',
        expectedSavings: `${Math.round(mainBundle.size * 0.4)}KB`,
        implementation: [
          'Use React.lazy() for route-based splitting',
          'Implement dynamic imports for large libraries',
          'Split feature modules into separate chunks',
          'Use Vite\'s manual chunk configuration'
        ]
      });
    }

    // Scheduler optimization
    if (this.analysis.issues.some(i => i.type === 'OVERSIZED_BUNDLE')) {
      this.analysis.recommendations.push({
        type: 'SCHEDULER_OPTIMIZATION',
        priority: 'CRITICAL',
        title: 'Optimize React Scheduler Integration',
        description: 'Prevent scheduler initialization issues through better bundling',
        expectedSavings: 'Reliability improvement',
        implementation: [
          'Move React scheduler to inline initialization',
          'Implement scheduler preload strategy',
          'Optimize polyfill injection timing',
          'Use scheduler/tracing imports selectively'
        ]
      });
    }

    // Performance optimizations
    this.analysis.recommendations.push({
      type: 'PERFORMANCE_OPTIMIZATION',
      priority: 'MEDIUM',
      title: 'Bundle Performance Enhancements',
      description: 'Implement advanced performance optimizations',
      expectedSavings: `${Math.round(this.analysis.totalSize * 0.15)}KB`,
      implementation: [
        'Enable tree shaking for unused exports',
        'Implement module preloading',
        'Use compression and caching strategies',
        'Optimize chunk loading sequence'
      ]
    });

    console.log(`  ✅ Generated ${this.analysis.recommendations.length} recommendations\n`);
  }

  printAnalysis() {
    console.log('🎯 BUNDLE ANALYSIS RESULTS');
    console.log('========================\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`  Total Bundles: ${this.analysis.bundles.length}`);
    console.log(`  Total Size: ${this.analysis.totalSize}KB (${this.analysis.gzipSize}KB gzipped)`);
    console.log(`  Issues Found: ${this.analysis.issues.length}`);
    console.log(`  Recommendations: ${this.analysis.recommendations.length}\n`);

    // Issues
    if (this.analysis.issues.length > 0) {
      console.log('⚠️  ISSUES:');
      this.analysis.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity}] ${issue.description}`);
      });
      console.log();
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    this.analysis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`     ${rec.description}`);
      if (rec.expectedSavings) {
        console.log(`     Expected savings: ${rec.expectedSavings}`);
      }
      console.log();
    });

    // Bundle breakdown
    console.log('📦 BUNDLE BREAKDOWN:');
    this.analysis.bundles.forEach(bundle => {
      const percent = Math.round((bundle.size / this.analysis.totalSize) * 100);
      console.log(`  ${bundle.name}: ${bundle.size}KB (${percent}%) - ${bundle.type}`);
    });
  }

  async saveAnalysis() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.analysis, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new BundleAnalyzer();
    await analyzer.analyzeBundles();
    analyzer.printAnalysis();
    await analyzer.saveAnalysis();
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BundleAnalyzer };