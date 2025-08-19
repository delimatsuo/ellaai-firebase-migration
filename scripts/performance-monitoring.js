#!/usr/bin/env node

/**
 * Performance Monitoring Script for EllaAI
 * 
 * This script provides comprehensive performance monitoring including:
 * - Lighthouse CI integration
 * - Load testing
 * - Bundle analysis
 * - Performance budgets
 * - Monitoring dashboard data collection
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const express = require('express');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.results = {
      timestamp: Date.now(),
      lighthouse: null,
      bundles: null,
      loadTest: null,
      budgets: null,
      recommendations: []
    };
    
    this.thresholds = {
      lcp: 2500, // Largest Contentful Paint
      fid: 100,  // First Input Delay
      cls: 0.1,  // Cumulative Layout Shift
      fcp: 1800, // First Contentful Paint
      tti: 3800, // Time to Interactive
      tbt: 300,  // Total Blocking Time
      bundleSize: 1000000, // 1MB total
      jsSize: 400000,      // 400KB JavaScript
      cssSize: 50000,      // 50KB CSS
    };
  }

  async runFullAnalysis() {
    console.log('🚀 Starting comprehensive performance analysis...\n');
    
    try {
      // 1. Bundle Analysis
      console.log('📦 Analyzing bundle sizes...');
      await this.analyzeBundles();
      
      // 2. Build the application
      console.log('🔨 Building application...');
      await this.buildApplication();
      
      // 3. Run Lighthouse CI
      console.log('🔍 Running Lighthouse analysis...');
      await this.runLighthouseCI();
      
      // 4. Load Testing
      console.log('⚡ Running load tests...');
      await this.runLoadTests();
      
      // 5. Check Performance Budgets
      console.log('💰 Checking performance budgets...');
      this.checkPerformanceBudgets();
      
      // 6. Generate Report
      console.log('📊 Generating performance report...');
      await this.generateReport();
      
      console.log('\n✅ Performance analysis completed!');
      console.log(`📋 Report saved to: ${this.getReportPath()}`);
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message);
      process.exit(1);
    }
  }

  async buildApplication() {
    try {
      execSync('cd frontend && npm run build', { stdio: 'pipe' });
      console.log('✅ Application built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async analyzeBundles() {
    const distPath = path.join(__dirname, '../frontend/dist');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('Dist folder not found. Please build the application first.');
    }
    
    const bundles = this.getBundleSizes(distPath);
    this.results.bundles = bundles;
    
    console.log('Bundle Analysis:');
    Object.entries(bundles).forEach(([type, size]) => {
      const sizeKB = (size / 1024).toFixed(2);
      const status = this.getBudgetStatus(type, size);
      console.log(`  ${type}: ${sizeKB}KB ${status}`);
    });
  }

  getBundleSizes(distPath) {
    const sizes = {
      total: 0,
      javascript: 0,
      css: 0,
      images: 0,
      fonts: 0,
      other: 0
    };
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          const size = stat.size;
          sizes.total += size;
          
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.mjs'].includes(ext)) {
            sizes.javascript += size;
          } else if (ext === '.css') {
            sizes.css += size;
          } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
            sizes.images += size;
          } else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
            sizes.fonts += size;
          } else {
            sizes.other += size;
          }
        }
      });
    };
    
    walkDir(distPath);
    return sizes;
  }

  getBudgetStatus(type, size) {
    const budgetMap = {
      javascript: this.thresholds.jsSize,
      css: this.thresholds.cssSize,
      total: this.thresholds.bundleSize
    };
    
    const budget = budgetMap[type];
    if (!budget) return '';
    
    if (size <= budget) return '✅';
    if (size <= budget * 1.2) return '⚠️';
    return '❌';
  }

  async runLighthouseCI() {
    try {
      // Start preview server
      console.log('Starting preview server...');
      const previewProcess = spawn('npm', ['run', 'preview'], {
        cwd: path.join(__dirname, '../frontend'),
        stdio: 'pipe'
      });
      
      // Wait for server to be ready
      await new Promise((resolve) => {
        previewProcess.stdout.on('data', (data) => {
          if (data.toString().includes('Local:')) {
            resolve();
          }
        });
        
        setTimeout(resolve, 5000); // Fallback timeout
      });
      
      // Run Lighthouse CI
      const lighthouseResult = execSync('npx lhci autorun', {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse Lighthouse results
      this.results.lighthouse = this.parseLighthouseResults(lighthouseResult);
      
      // Kill preview server
      previewProcess.kill();
      
      console.log('✅ Lighthouse analysis completed');
      
    } catch (error) {
      console.warn('⚠️ Lighthouse analysis failed:', error.message);
      this.results.lighthouse = { error: error.message };
    }
  }

  parseLighthouseResults(output) {
    // Parse Lighthouse CI output
    const lines = output.split('\n');
    const results = {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
      pwa: null,
      metrics: {}
    };
    
    lines.forEach(line => {
      if (line.includes('Performance:')) {
        results.performance = this.extractScore(line);
      } else if (line.includes('Accessibility:')) {
        results.accessibility = this.extractScore(line);
      } else if (line.includes('Best Practices:')) {
        results.bestPractices = this.extractScore(line);
      } else if (line.includes('SEO:')) {
        results.seo = this.extractScore(line);
      } else if (line.includes('PWA:')) {
        results.pwa = this.extractScore(line);
      }
    });
    
    return results;
  }

  extractScore(line) {
    const match = line.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  async runLoadTests() {
    const loadTestResults = {
      endpoints: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        avgResponseTime: 0
      }
    };
    
    const endpoints = [
      { name: 'Homepage', url: 'http://localhost:4173/' },
      { name: 'Login', url: 'http://localhost:4173/login' },
      { name: 'Dashboard', url: 'http://localhost:4173/dashboard' },
      { name: 'Assessments', url: 'http://localhost:4173/assessments' }
    ];
    
    console.log('Running quick load tests...');
    
    for (const endpoint of endpoints) {
      try {
        const result = await this.quickLoadTest(endpoint.url);
        loadTestResults.endpoints[endpoint.name] = result;
        loadTestResults.summary.totalTests++;
        
        if (result.success && result.avgResponseTime < 2000) {
          loadTestResults.summary.passed++;
        } else {
          loadTestResults.summary.failed++;
        }
        
        loadTestResults.summary.avgResponseTime += result.avgResponseTime;
        
        console.log(`  ${endpoint.name}: ${result.avgResponseTime.toFixed(0)}ms ${result.success ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`  ${endpoint.name}: Failed ❌`);
        loadTestResults.endpoints[endpoint.name] = { error: error.message };
        loadTestResults.summary.totalTests++;
        loadTestResults.summary.failed++;
      }
    }
    
    if (loadTestResults.summary.totalTests > 0) {
      loadTestResults.summary.avgResponseTime /= loadTestResults.summary.totalTests;
    }
    
    this.results.loadTest = loadTestResults;
  }

  async quickLoadTest(url, requests = 10) {
    const results = [];
    
    for (let i = 0; i < requests; i++) {
      const start = performance.now();
      
      try {
        const response = await fetch(url);
        const end = performance.now();
        
        results.push({
          responseTime: end - start,
          status: response.status,
          success: response.ok
        });
        
      } catch (error) {
        const end = performance.now();
        results.push({
          responseTime: end - start,
          status: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    const successfulRequests = results.filter(r => r.success);
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    return {
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: results.length - successfulRequests.length,
      avgResponseTime,
      successRate: (successfulRequests.length / results.length) * 100,
      success: successfulRequests.length > results.length * 0.95 // 95% success rate
    };
  }

  checkPerformanceBudgets() {
    const budgets = {
      bundleSize: {
        budget: this.thresholds.bundleSize,
        actual: this.results.bundles?.total || 0,
        passed: (this.results.bundles?.total || 0) <= this.thresholds.bundleSize
      },
      javascriptSize: {
        budget: this.thresholds.jsSize,
        actual: this.results.bundles?.javascript || 0,
        passed: (this.results.bundles?.javascript || 0) <= this.thresholds.jsSize
      },
      cssSize: {
        budget: this.thresholds.cssSize,
        actual: this.results.bundles?.css || 0,
        passed: (this.results.bundles?.css || 0) <= this.thresholds.cssSize
      }
    };
    
    this.results.budgets = budgets;
    
    // Generate recommendations
    Object.entries(budgets).forEach(([key, budget]) => {
      if (!budget.passed) {
        const overage = ((budget.actual - budget.budget) / budget.budget * 100).toFixed(1);
        this.results.recommendations.push({
          type: 'budget',
          severity: budget.actual > budget.budget * 1.5 ? 'error' : 'warning',
          message: `${key} exceeds budget by ${overage}% (${(budget.actual / 1024).toFixed(2)}KB vs ${(budget.budget / 1024).toFixed(2)}KB)`
        });
      }
    });
    
    console.log('Performance Budget Results:');
    Object.entries(budgets).forEach(([key, budget]) => {
      const status = budget.passed ? '✅' : '❌';
      const actualKB = (budget.actual / 1024).toFixed(2);
      const budgetKB = (budget.budget / 1024).toFixed(2);
      console.log(`  ${key}: ${actualKB}KB / ${budgetKB}KB ${status}`);
    });
  }

  async generateReport() {
    const reportPath = this.getReportPath();
    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary()
    };
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Write HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlReportPath = reportPath.replace('.json', '.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log('\n📊 Performance Report Summary:');
    console.log(report.summary.text);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach((rec, i) => {
        const icon = rec.severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${i + 1}. ${icon} ${rec.message}`);
      });
    }
  }

  generateSummary() {
    let score = 100;
    let issues = 0;
    let status = 'excellent';
    
    // Check budgets
    if (this.results.budgets) {
      Object.values(this.results.budgets).forEach(budget => {
        if (!budget.passed) {
          issues++;
          score -= 15;
        }
      });
    }
    
    // Check load test results
    if (this.results.loadTest?.summary.failed > 0) {
      issues++;
      score -= 20;
    }
    
    // Determine status
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'needs-improvement';
    else status = 'poor';
    
    return {
      score,
      status,
      issues,
      text: `Performance Score: ${score}/100 (${status.replace('-', ' ')}) - ${issues} issue(s) detected`
    };
  }

  generateHTMLReport(report) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EllaAI Performance Report</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #2196F3; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .metric-card { background: #f9f9f9; border-radius: 6px; padding: 15px; margin: 10px 0; border-left: 4px solid #ddd; }
            .metric-card.pass { border-left-color: #4CAF50; }
            .metric-card.warn { border-left-color: #FF9800; }
            .metric-card.fail { border-left-color: #F44336; }
            .score { font-size: 2em; font-weight: bold; color: #2196F3; }
            .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 EllaAI Performance Report</h1>
                <p>Generated: ${report.generatedAt}</p>
                <div class="score">Score: ${report.summary.score}/100</div>
                <p>Status: ${report.summary.status.replace('-', ' ').toUpperCase()}</p>
            </div>
            
            <div class="content">
                <h2>📦 Bundle Analysis</h2>
                ${report.bundles ? Object.entries(report.bundles).map(([type, size]) => `
                    <div class="metric-card ${this.getBudgetStatus(type, size) === '✅' ? 'pass' : this.getBudgetStatus(type, size) === '⚠️' ? 'warn' : 'fail'}">
                        <strong>${type}:</strong> ${(size / 1024).toFixed(2)}KB
                    </div>
                `).join('') : '<p>No bundle data available</p>'}
                
                <h2>⚡ Load Test Results</h2>
                ${report.loadTest ? `
                    <table>
                        <thead>
                            <tr><th>Endpoint</th><th>Avg Response Time</th><th>Success Rate</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${Object.entries(report.loadTest.endpoints).map(([name, result]) => `
                                <tr>
                                    <td>${name}</td>
                                    <td>${result.avgResponseTime?.toFixed(0) || 'N/A'}ms</td>
                                    <td>${result.successRate?.toFixed(1) || 'N/A'}%</td>
                                    <td>${result.success ? '✅' : '❌'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No load test data available</p>'}
                
                ${report.recommendations.length > 0 ? `
                    <div class="recommendations">
                        <h3>💡 Recommendations</h3>
                        <ul>
                            ${report.recommendations.map(rec => `
                                <li>${rec.severity === 'error' ? '❌' : '⚠️'} ${rec.message}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getReportPath() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return path.join(__dirname, '../reports', `performance-report-${timestamp}.json`);
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];
  const monitor = new PerformanceMonitor();
  
  switch (command) {
    case 'full':
      monitor.runFullAnalysis();
      break;
      
    case 'bundle':
      monitor.analyzeBundles().then(() => console.log('✅ Bundle analysis complete'));
      break;
      
    case 'lighthouse':
      monitor.runLighthouseCI().then(() => console.log('✅ Lighthouse analysis complete'));
      break;
      
    case 'load':
      monitor.runLoadTests().then(() => console.log('✅ Load tests complete'));
      break;
      
    default:
      console.log(`
Usage: node performance-monitoring.js <command>

Commands:
  full        Run complete performance analysis
  bundle      Analyze bundle sizes only
  lighthouse  Run Lighthouse CI only
  load        Run load tests only

Examples:
  npm run perf:analyze        # Full analysis
  npm run perf:bundle         # Bundle analysis only
  npm run perf:lighthouse     # Lighthouse only
  npm run perf:load          # Load tests only
      `);
  }
}

module.exports = PerformanceMonitor;