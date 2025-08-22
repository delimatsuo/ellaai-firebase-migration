#!/usr/bin/env python3
"""
EllaAI Platform Analysis Script - Comprehensive B2B SaaS Review
"""
from playwright.sync_api import sync_playwright
import time
import os
import json

def analyze_platform():
    """Comprehensive analysis of EllaAI platform"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        try:
            # Analysis structure
            analysis_results = {
                "login_page": {},
                "main_application": {},
                "recommendations": {
                    "critical": [],
                    "high_priority": [],
                    "medium_priority": [],
                    "low_priority": []
                }
            }
            
            # 1. Analyze Login Page
            print("🔍 ANALYZING LOGIN PAGE...")
            analyze_login_page(page, analysis_results)
            
            # 2. Try to access main application
            print("\n🔍 ANALYZING MAIN APPLICATION...")
            analyze_main_application(page, analysis_results)
            
            # 3. Check for public pages that might reveal admin structure
            print("\n🔍 CHECKING PUBLIC PAGES...")
            check_public_pages(page, analysis_results)
            
            # Generate comprehensive report
            generate_report(analysis_results)
            
        except Exception as e:
            print(f"❌ Error during analysis: {e}")
            
        finally:
            browser.close()

def analyze_login_page(page, results):
    """Detailed analysis of login page"""
    page.goto('https://ellaai-platform-prod.web.app/login', wait_until='networkidle')
    time.sleep(2)
    
    # Take screenshot
    os.makedirs('screenshots', exist_ok=True)
    page.screenshot(path='screenshots/login_detailed.png', full_page=True)
    
    login_analysis = {
        "security_features": [],
        "ux_issues": [],
        "missing_features": [],
        "strengths": []
    }
    
    # Check for security features
    if page.query_selector('input[type="password"]'):
        login_analysis["security_features"].append("Password field properly masked")
    
    if page.query_selector('[class*="google"], [text*="Google"]'):
        login_analysis["security_features"].append("Google SSO integration")
        login_analysis["strengths"].append("Multiple authentication methods")
    
    # Check for UX elements
    if page.query_selector('a[href*="forgot"], [text*="forgot"]'):
        login_analysis["strengths"].append("Password recovery option")
    else:
        login_analysis["missing_features"].append("Password recovery link")
    
    if page.query_selector('a[href*="signup"], [text*="Sign up"]'):
        login_analysis["strengths"].append("Clear signup option")
    
    # Check for missing enterprise features
    if not page.query_selector('[text*="SSO"], [text*="SAML"]'):
        login_analysis["missing_features"].append("Enterprise SSO (SAML/OIDC) not visible")
    
    if not page.query_selector('[text*="MFA"], [text*="2FA"]'):
        login_analysis["missing_features"].append("Multi-factor authentication not visible")
    
    results["login_page"] = login_analysis
    print("✅ Login page analysis complete")

def analyze_main_application(page, results):
    """Try to understand main application structure"""
    
    # Check if we can access any public dashboard or demo
    urls_to_check = [
        'https://ellaai-platform-prod.web.app/',
        'https://ellaai-platform-prod.web.app/dashboard',
        'https://ellaai-platform-prod.web.app/demo',
        'https://ellaai-platform-prod.web.app/public',
    ]
    
    app_analysis = {
        "accessible_pages": [],
        "navigation_structure": [],
        "inferred_features": [],
        "missing_admin_features": []
    }
    
    for url in urls_to_check:
        try:
            print(f"  Checking: {url}")
            page.goto(url, wait_until='networkidle', timeout=10000)
            time.sleep(1)
            
            current_url = page.url
            title = page.title()
            
            if 'login' not in current_url.lower():
                app_analysis["accessible_pages"].append({
                    "url": url,
                    "final_url": current_url,
                    "title": title
                })
                
                # Take screenshot
                filename = url.replace('https://ellaai-platform-prod.web.app/', '').replace('/', '_') or 'homepage'
                page.screenshot(path=f'screenshots/app_{filename}.png', full_page=True)
                
                # Analyze navigation if accessible
                nav_items = extract_navigation_items(page)
                if nav_items:
                    app_analysis["navigation_structure"].extend(nav_items)
                
        except Exception as e:
            print(f"    ❌ Could not access {url}: {e}")
    
    # Infer admin features based on B2B SaaS patterns
    infer_admin_requirements(app_analysis)
    
    results["main_application"] = app_analysis
    print("✅ Main application analysis complete")

def extract_navigation_items(page):
    """Extract navigation items from accessible pages"""
    nav_items = []
    
    # Look for common navigation patterns
    selectors = [
        'nav a', 
        '[role="navigation"] a',
        '.navbar a',
        '.menu a',
        '.nav-link',
        'header a'
    ]
    
    for selector in selectors:
        try:
            elements = page.query_selector_all(selector)
            for element in elements[:10]:  # Limit to prevent spam
                text = element.inner_text().strip()
                href = element.get_attribute('href')
                if text and len(text) < 30:
                    nav_items.append({"text": text, "href": href})
        except:
            continue
    
    return nav_items

def infer_admin_requirements(app_analysis):
    """Infer what admin features should be present based on B2B SaaS standards"""
    
    # Standard B2B SaaS admin requirements
    admin_features = [
        {
            "category": "User Management",
            "features": [
                "User list with search/filter",
                "User role management",
                "User activity logs",
                "Bulk user operations",
                "User invitation system"
            ]
        },
        {
            "category": "Company/Tenant Management", 
            "features": [
                "Company profiles",
                "Subscription management",
                "Usage analytics per tenant",
                "Custom branding controls",
                "Data isolation monitoring"
            ]
        },
        {
            "category": "Assessment Management",
            "features": [
                "Assessment template library",
                "Custom assessment creation",
                "Performance analytics",
                "Candidate pipeline view",
                "Assessment results dashboard"
            ]
        },
        {
            "category": "System Administration",
            "features": [
                "System health monitoring",
                "Error logs and alerts",
                "API usage statistics",
                "Security audit logs",
                "Backup and restore tools"
            ]
        },
        {
            "category": "Analytics & Reporting",
            "features": [
                "Usage metrics dashboard",
                "Revenue analytics",
                "User engagement metrics", 
                "Custom report builder",
                "Data export capabilities"
            ]
        }
    ]
    
    app_analysis["missing_admin_features"] = admin_features

def check_public_pages(page, results):
    """Check for publicly accessible pages that might reveal platform structure"""
    
    public_urls = [
        'https://ellaai-platform-prod.web.app/about',
        'https://ellaai-platform-prod.web.app/features', 
        'https://ellaai-platform-prod.web.app/pricing',
        'https://ellaai-platform-prod.web.app/contact',
        'https://ellaai-platform-prod.web.app/help',
        'https://ellaai-platform-prod.web.app/docs',
    ]
    
    public_analysis = {
        "accessible_content": [],
        "platform_insights": []
    }
    
    for url in public_urls:
        try:
            page.goto(url, timeout=5000)
            if 'login' not in page.url.lower():
                public_analysis["accessible_content"].append({
                    "url": url,
                    "title": page.title(),
                    "accessible": True
                })
                
                # Extract any platform insights
                text_content = page.inner_text('body')[:1000]  # First 1000 chars
                if 'admin' in text_content.lower() or 'manage' in text_content.lower():
                    public_analysis["platform_insights"].append({
                        "url": url,
                        "insight": "Contains admin/management references"
                    })
                    
        except Exception as e:
            public_analysis["accessible_content"].append({
                "url": url,
                "accessible": False,
                "error": str(e)
            })
    
    results["public_pages"] = public_analysis

def generate_report(results):
    """Generate comprehensive B2B SaaS admin analysis report"""
    
    print("\n" + "="*80)
    print("📊 ELLAAI B2B SAAS ADMIN PLATFORM ANALYSIS REPORT")
    print("="*80)
    
    print("\n🔐 LOGIN PAGE ANALYSIS")
    print("-" * 40)
    login = results.get("login_page", {})
    
    print("✅ STRENGTHS:")
    for strength in login.get("strengths", []):
        print(f"  • {strength}")
    
    print("\n⚠️ MISSING FEATURES:")
    for missing in login.get("missing_features", []):
        print(f"  • {missing}")
    
    print("\n🏢 INFERRED ADMIN REQUIREMENTS")
    print("-" * 40)
    
    app = results.get("main_application", {})
    for category in app.get("missing_admin_features", []):
        print(f"\n📋 {category['category'].upper()}:")
        for feature in category["features"]:
            print(f"  • {feature}")
    
    print("\n🎯 PRIORITY RECOMMENDATIONS")
    print("-" * 40)
    
    # Generate specific recommendations
    recommendations = generate_recommendations()
    
    for priority, items in recommendations.items():
        print(f"\n🔥 {priority.upper().replace('_', ' ')} PRIORITY:")
        for i, item in enumerate(items[:5], 1):  # Top 5 per priority
            print(f"  {i}. {item}")
    
    # Save detailed analysis to file
    os.makedirs('analysis', exist_ok=True)
    with open('analysis/ellaai_admin_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed analysis saved to: analysis/ellaai_admin_analysis.json")
    print(f"📸 Screenshots saved to: screenshots/")

def generate_recommendations():
    """Generate prioritized recommendations for EllaAI admin platform"""
    
    return {
        "critical": [
            "Implement comprehensive user management dashboard with search, filter, and bulk operations",
            "Add system health monitoring and error alerting for proactive issue resolution",  
            "Create audit logging system for compliance and security tracking",
            "Develop role-based access control (RBAC) interface for permission management",
            "Build company/tenant management system with usage analytics"
        ],
        "high_priority": [
            "Add assessment management dashboard with performance analytics",
            "Implement API usage monitoring and rate limiting controls",
            "Create automated backup and disaster recovery management",
            "Build custom reporting and data export capabilities",
            "Add multi-factor authentication (MFA) and enterprise SSO support"
        ],
        "medium_priority": [
            "Develop email template management for automated communications",
            "Create webhook configuration interface for integrations",
            "Add user activity tracking and engagement metrics",
            "Implement custom branding controls for white-label customers",
            "Build notification center for system alerts and updates"
        ],
        "low_priority": [
            "Add dark mode support for admin interface",
            "Create mobile-responsive admin dashboard",
            "Implement advanced search with faceted filtering",
            "Add data visualization widgets for KPI monitoring",
            "Create onboarding flow for new admin users"
        ]
    }

if __name__ == "__main__":
    analyze_platform()