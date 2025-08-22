#!/usr/bin/env python3
"""
EllaAI Admin Page Analysis Script
"""
from playwright.sync_api import sync_playwright
import time
import os

def analyze_ellaai_admin():
    """Navigate and analyze the EllaAI admin interface"""
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)  # Set to False to see what's happening
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        try:
            print("🔍 Navigating to EllaAI Admin Page...")
            page.goto('https://ellaai-platform-prod.web.app/admin', wait_until='networkidle')
            
            # Wait a bit more for any dynamic content
            time.sleep(3)
            
            # Get basic page info
            title = page.title()
            url = page.url
            print(f"📄 Page Title: {title}")
            print(f"🔗 Current URL: {url}")
            
            # Take full page screenshot
            screenshot_path = 'screenshots/admin_homepage.png'
            os.makedirs('screenshots', exist_ok=True)
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved: {screenshot_path}")
            
            # Check if we're redirected to login
            if 'login' in url.lower() or 'auth' in url.lower():
                print("🔒 Redirected to login page - authentication required")
                page.screenshot(path='screenshots/login_page.png', full_page=True)
                print("📸 Login page screenshot saved")
                
                # Try to identify login elements
                login_elements = page.query_selector_all('input[type="email"], input[type="password"], button[type="submit"]')
                print(f"🔍 Found {len(login_elements)} login-related elements")
                
            else:
                print("✅ Successfully accessed admin page")
                
                # Analyze the page structure
                analyze_page_structure(page)
                
                # Look for navigation elements
                analyze_navigation(page)
                
                # Check for data tables and key admin features
                analyze_admin_features(page)
                
        except Exception as e:
            print(f"❌ Error accessing page: {e}")
            page.screenshot(path='screenshots/error_page.png', full_page=True)
            
        finally:
            browser.close()

def analyze_page_structure(page):
    """Analyze the overall page structure and layout"""
    print("\n🏗️  ANALYZING PAGE STRUCTURE")
    print("-" * 50)
    
    # Check for main structural elements
    structural_elements = {
        'header': page.query_selector('header'),
        'nav': page.query_selector('nav'),
        'main': page.query_selector('main'),
        'aside': page.query_selector('aside'),
        'footer': page.query_selector('footer'),
    }
    
    for element_type, element in structural_elements.items():
        if element:
            print(f"✅ {element_type.upper()} element found")
        else:
            print(f"❌ {element_type.upper()} element missing")
    
    # Check for common admin patterns
    admin_patterns = {
        'dashboard': page.query_selector_all('[class*="dashboard"], [id*="dashboard"]'),
        'sidebar': page.query_selector_all('[class*="sidebar"], [class*="side-nav"]'),
        'cards': page.query_selector_all('[class*="card"], .card'),
        'tables': page.query_selector_all('table'),
        'forms': page.query_selector_all('form'),
        'modals': page.query_selector_all('[class*="modal"]'),
    }
    
    for pattern_name, elements in admin_patterns.items():
        count = len(elements)
        print(f"📊 {pattern_name.upper()}: {count} found")

def analyze_navigation(page):
    """Analyze navigation structure and menu items"""
    print("\n🧭 ANALYZING NAVIGATION")
    print("-" * 50)
    
    # Look for navigation links
    nav_links = page.query_selector_all('a[href], button[role="menuitem"]')
    print(f"🔗 Total navigation elements: {len(nav_links)}")
    
    # Extract text from navigation items
    nav_items = []
    for link in nav_links[:20]:  # Limit to first 20 to avoid spam
        try:
            text = link.inner_text().strip()
            href = link.get_attribute('href') or 'N/A'
            if text and len(text) < 50:  # Filter out very long text
                nav_items.append((text, href))
        except:
            continue
    
    print("📋 Navigation items found:")
    for text, href in nav_items:
        print(f"  • {text} → {href}")

def analyze_admin_features(page):
    """Analyze admin-specific features and capabilities"""
    print("\n⚙️  ANALYZING ADMIN FEATURES")
    print("-" * 50)
    
    # Look for common admin features
    feature_selectors = {
        'User Management': ['[class*="user"], [data-testid*="user"]', 'text=Users', 'text=User Management'],
        'Company/Tenant Management': ['[class*="company"], [class*="tenant"]', 'text=Companies', 'text=Tenants'],
        'Assessment Tools': ['[class*="assessment"], [class*="test"]', 'text=Assessments', 'text=Tests'],
        'Analytics/Reports': ['[class*="analytics"], [class*="report"]', 'text=Analytics', 'text=Reports'],
        'Settings': ['[class*="setting"], [class*="config"]', 'text=Settings', 'text=Configuration'],
        'Search/Filter': ['input[type="search"], [class*="search"]', '[class*="filter"]'],
        'Data Tables': ['table', '[class*="data-table"], [class*="grid"]'],
        'Action Buttons': ['button[class*="action"], [class*="btn-primary"]'],
        'Status Indicators': ['[class*="status"], [class*="badge"]'],
        'Bulk Operations': ['[class*="bulk"], [class*="select-all"]'],
    }
    
    for feature_name, selectors in feature_selectors.items():
        found = False
        for selector in selectors:
            try:
                elements = page.query_selector_all(selector)
                if elements:
                    print(f"✅ {feature_name}: {len(elements)} elements found")
                    found = True
                    break
            except:
                continue
        
        if not found:
            print(f"❌ {feature_name}: Not found")

if __name__ == "__main__":
    analyze_ellaai_admin()