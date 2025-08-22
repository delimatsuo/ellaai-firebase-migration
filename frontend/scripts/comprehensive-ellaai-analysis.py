#!/usr/bin/env python3
"""
Comprehensive EllaAI Platform Analysis Script
Uses Playwright to analyze the live application for design patterns, functionality, and admin interface gaps
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
import base64

class EllaAIAnalyzer:
    def __init__(self):
        self.base_url = "https://ellaai-platform-prod.web.app"
        self.analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "main_app": {},
            "admin_interface": {},
            "design_analysis": {},
            "service_connectivity": {},
            "design_gaps": []
        }
        
        # Create screenshots directory
        self.screenshots_dir = "./screenshots/analysis"
        os.makedirs(self.screenshots_dir, exist_ok=True)

    async def take_screenshot(self, page: Page, name: str, full_page: bool = True) -> str:
        """Take screenshot and return file path"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        filepath = os.path.join(self.screenshots_dir, filename)
        
        await page.screenshot(path=filepath, full_page=full_page)
        print(f"📸 Screenshot saved: {filepath}")
        return filepath

    async def extract_design_tokens(self, page: Page) -> Dict[str, Any]:
        """Extract design tokens from computed styles"""
        design_tokens = await page.evaluate("""
            () => {
                const tokens = {};
                
                // Extract CSS custom properties (variables)
                const computedStyle = getComputedStyle(document.documentElement);
                const cssVars = {};
                for (let i = 0; i < computedStyle.length; i++) {
                    const prop = computedStyle[i];
                    if (prop.startsWith('--')) {
                        cssVars[prop] = computedStyle.getPropertyValue(prop).trim();
                    }
                }
                tokens.cssVariables = cssVars;
                
                // Extract Material-UI theme tokens if available
                if (window.__MUI_THEME__) {
                    tokens.muiTheme = window.__MUI_THEME__;
                }
                
                // Extract computed styles from key elements
                const keyElements = document.querySelectorAll('button, .MuiCard-root, .MuiAppBar-root, .MuiDrawer-root, h1, h2, h3, h4, h5, h6, .MuiTypography-root');
                tokens.elementStyles = {};
                
                keyElements.forEach((el, index) => {
                    const styles = getComputedStyle(el);
                    const elementKey = `${el.tagName.toLowerCase()}_${el.className.replace(/\s+/g, '_')}_${index}`;
                    tokens.elementStyles[elementKey] = {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        fontSize: styles.fontSize,
                        fontFamily: styles.fontFamily,
                        fontWeight: styles.fontWeight,
                        borderRadius: styles.borderRadius,
                        padding: styles.padding,
                        margin: styles.margin,
                        boxShadow: styles.boxShadow,
                        border: styles.border
                    };
                });
                
                return tokens;
            }
        """)
        return design_tokens

    async def analyze_main_application(self, page: Page) -> Dict[str, Any]:
        """Analyze the main application dashboard and design"""
        print("🔍 Analyzing main application...")
        
        await page.goto(self.base_url, wait_until="networkidle")
        await page.wait_for_timeout(3000)  # Wait for dynamic content
        
        # Take screenshot
        screenshot_path = await self.take_screenshot(page, "main_dashboard")
        
        # Extract design tokens
        design_tokens = await self.extract_design_tokens(page)
        
        # Analyze page structure
        page_structure = await page.evaluate("""
            () => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyClasses: document.body.className,
                    hasNavigation: !!document.querySelector('nav, .MuiAppBar-root, .MuiDrawer-root'),
                    hasCards: document.querySelectorAll('.MuiCard-root, .MuiPaper-root').length,
                    hasButtons: document.querySelectorAll('button, .MuiButton-root').length,
                    colorScheme: getComputedStyle(document.documentElement).getPropertyValue('color-scheme') || 'auto',
                    mainContentSelector: document.querySelector('main, #main, #root, .main-content') ? true : false
                };
            }
        """)
        
        # Check if login page or dashboard
        is_login_page = await page.locator('input[type="email"], input[type="password"]').count() > 0
        
        return {
            "screenshot_path": screenshot_path,
            "page_structure": page_structure,
            "design_tokens": design_tokens,
            "is_login_page": is_login_page,
            "timestamp": datetime.now().isoformat()
        }

    async def analyze_admin_interface(self, page: Page, context: BrowserContext) -> Dict[str, Any]:
        """Analyze admin interface and all subpages"""
        print("🔍 Analyzing admin interface...")
        
        admin_analysis = {
            "pages": {},
            "navigation_structure": {},
            "connectivity_issues": [],
            "functionality_tests": {}
        }
        
        # Admin pages to test
        admin_pages = [
            "/admin",
            "/admin/create-company", 
            "/admin/users",
            "/admin/audit-logs",
            "/admin/system-health",
            "/admin/database-query"
        ]
        
        for admin_path in admin_pages:
            try:
                print(f"📄 Analyzing {admin_path}...")
                full_url = f"{self.base_url}{admin_path}"
                
                # Navigate to admin page
                response = await page.goto(full_url, wait_until="networkidle")
                await page.wait_for_timeout(2000)
                
                page_name = admin_path.replace("/admin", "admin_root").replace("/", "_").lstrip("_")
                screenshot_path = await self.take_screenshot(page, f"admin_{page_name}")
                
                # Check if page loaded successfully
                status_code = response.status if response else 0
                is_404 = await page.locator('text=404, text=Not Found, text=Page not found').count() > 0
                is_error = status_code >= 400 or is_404
                
                # Analyze page content
                page_analysis = await page.evaluate("""
                    () => {
                        const analysis = {
                            title: document.title,
                            url: window.location.href,
                            hasContent: document.body.innerText.length > 100,
                            hasForm: document.querySelectorAll('form, input, select, textarea').length > 0,
                            hasTable: document.querySelectorAll('table, .MuiTable-root, .MuiDataGrid-root').length > 0,
                            hasNavigation: document.querySelectorAll('nav, .MuiDrawer-root, sidebar').length > 0,
                            hasCards: document.querySelectorAll('.MuiCard-root, .MuiPaper-root').length > 0,
                            hasLoadingIndicators: document.querySelectorAll('.MuiCircularProgress-root, .loading, [data-testid*="loading"]').length > 0,
                            errorMessages: [],
                            formFields: [],
                            actionButtons: []
                        };
                        
                        // Extract error messages
                        const errorSelectors = ['.error, .MuiAlert-standardError, [role="alert"]', 'text*="error"', 'text*="failed"'];
                        errorSelectors.forEach(selector => {
                            try {
                                const errors = document.querySelectorAll(selector);
                                errors.forEach(el => analysis.errorMessages.push(el.textContent));
                            } catch (e) {}
                        });
                        
                        // Extract form fields
                        const inputs = document.querySelectorAll('input, select, textarea');
                        inputs.forEach(input => {
                            analysis.formFields.push({
                                type: input.type || input.tagName.toLowerCase(),
                                name: input.name,
                                placeholder: input.placeholder,
                                required: input.required
                            });
                        });
                        
                        // Extract action buttons
                        const buttons = document.querySelectorAll('button, .MuiButton-root, [role="button"]');
                        buttons.forEach(btn => {
                            analysis.actionButtons.push({
                                text: btn.textContent.trim(),
                                disabled: btn.disabled,
                                type: btn.type
                            });
                        });
                        
                        return analysis;
                    }
                """)
                
                # Test form functionality if present
                functionality_test = {}
                if page_analysis['hasForm']:
                    functionality_test = await self.test_form_functionality(page)
                
                admin_analysis["pages"][admin_path] = {
                    "screenshot_path": screenshot_path,
                    "status_code": status_code,
                    "is_error": is_error,
                    "page_analysis": page_analysis,
                    "functionality_test": functionality_test,
                    "design_tokens": await self.extract_design_tokens(page)
                }
                
            except Exception as e:
                print(f"❌ Error analyzing {admin_path}: {str(e)}")
                admin_analysis["pages"][admin_path] = {
                    "error": str(e),
                    "status": "failed"
                }
        
        return admin_analysis

    async def test_form_functionality(self, page: Page) -> Dict[str, Any]:
        """Test form functionality and validation"""
        functionality = {
            "has_validation": False,
            "required_fields": [],
            "submit_test": "not_tested",
            "api_connectivity": "unknown"
        }
        
        try:
            # Check for required fields
            required_inputs = await page.locator('input[required], select[required], textarea[required]').count()
            functionality["required_fields"] = required_inputs
            
            # Test validation by trying to submit empty form
            submit_button = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("Save")')
            if await submit_button.count() > 0:
                # Try submitting without filling required fields
                await submit_button.first.click()
                await page.wait_for_timeout(1000)
                
                # Check for validation messages
                validation_messages = await page.locator('.error, .MuiFormHelperText-root, [role="alert"]').count()
                functionality["has_validation"] = validation_messages > 0
                functionality["submit_test"] = "validation_works" if validation_messages > 0 else "no_validation"
        
        except Exception as e:
            functionality["submit_test"] = f"error: {str(e)}"
        
        return functionality

    async def test_service_connectivity(self, page: Page) -> Dict[str, Any]:
        """Test API calls and service connectivity"""
        print("🔗 Testing service connectivity...")
        
        connectivity_results = {
            "firebase_auth": "unknown",
            "api_calls": [],
            "errors": [],
            "loading_times": {}
        }
        
        # Monitor network requests
        network_requests = []
        
        async def handle_request(request):
            network_requests.append({
                "url": request.url,
                "method": request.method,
                "timestamp": datetime.now().isoformat()
            })
        
        async def handle_response(response):
            for req in network_requests:
                if req["url"] == response.url:
                    req["status"] = response.status
                    req["response_time"] = datetime.now().isoformat()
                    break
        
        page.on("request", handle_request)
        page.on("response", handle_response)
        
        # Test main page loading
        start_time = datetime.now()
        await page.goto(f"{self.base_url}/admin", wait_until="networkidle")
        load_time = (datetime.now() - start_time).total_seconds()
        
        connectivity_results["loading_times"]["admin_page"] = load_time
        connectivity_results["api_calls"] = network_requests[-10:]  # Last 10 requests
        
        # Test Firebase authentication
        firebase_status = await page.evaluate("""
            () => {
                try {
                    // Check if Firebase is loaded
                    if (window.firebase || window.firebaseApp) {
                        return 'loaded';
                    }
                    return 'not_loaded';
                } catch (e) {
                    return 'error: ' + e.message;
                }
            }
        """)
        
        connectivity_results["firebase_auth"] = firebase_status
        
        return connectivity_results

    async def compare_designs(self, main_app_data: Dict, admin_data: Dict) -> List[Dict[str, Any]]:
        """Compare main app vs admin interface designs"""
        print("🎨 Performing design gap analysis...")
        
        design_gaps = []
        
        # Compare color schemes
        main_tokens = main_app_data.get("design_tokens", {})
        admin_pages = admin_data.get("pages", {})
        
        for page_path, page_data in admin_pages.items():
            if "design_tokens" not in page_data:
                continue
                
            admin_tokens = page_data["design_tokens"]
            
            # Compare CSS variables
            main_vars = main_tokens.get("cssVariables", {})
            admin_vars = admin_tokens.get("cssVariables", {})
            
            missing_vars = set(main_vars.keys()) - set(admin_vars.keys())
            different_values = {}
            
            for var in main_vars:
                if var in admin_vars and main_vars[var] != admin_vars[var]:
                    different_values[var] = {
                        "main_app": main_vars[var],
                        "admin_page": admin_vars[var]
                    }
            
            if missing_vars or different_values:
                design_gaps.append({
                    "page": page_path,
                    "type": "css_variables",
                    "missing_variables": list(missing_vars),
                    "different_values": different_values
                })
        
        return design_gaps

    async def generate_report(self) -> str:
        """Generate comprehensive analysis report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = f"./analysis/comprehensive_ellaai_analysis_{timestamp}.json"
        
        # Ensure analysis directory exists
        os.makedirs("./analysis", exist_ok=True)
        
        # Save detailed JSON report
        with open(report_path, 'w') as f:
            json.dump(self.analysis_results, f, indent=2, default=str)
        
        # Generate markdown summary
        markdown_report = self.generate_markdown_summary(timestamp)
        markdown_path = f"./analysis/ellaai_analysis_summary_{timestamp}.md"
        with open(markdown_path, 'w') as f:
            f.write(markdown_report)
        
        print(f"📊 Analysis complete!")
        print(f"📄 JSON Report: {report_path}")
        print(f"📝 Markdown Summary: {markdown_path}")
        
        return report_path

    def generate_markdown_summary(self, timestamp: str) -> str:
        """Generate markdown summary of analysis"""
        return f"""# EllaAI Comprehensive Platform Analysis Report
        
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Analysis ID:** {timestamp}

## Executive Summary

This report provides a comprehensive analysis of the EllaAI platform at https://ellaai-platform-prod.web.app, focusing on:
1. Main application design patterns and UI components
2. Admin interface functionality and connectivity 
3. Design consistency gaps between main app and admin interface
4. Service connectivity and API functionality

## Main Application Analysis

{self._format_main_app_analysis()}

## Admin Interface Analysis

{self._format_admin_analysis()}

## Design Gap Analysis

{self._format_design_gaps()}

## Service Connectivity Analysis  

{self._format_connectivity_analysis()}

## Recommendations

{self._generate_recommendations()}

---
*This report was generated automatically using Playwright browser automation.*
"""

    def _format_main_app_analysis(self) -> str:
        main_app = self.analysis_results.get("main_app", {})
        if not main_app:
            return "No main application data available."
        
        return f"""
### Design Tokens Extracted
- CSS Variables: {len(main_app.get("design_tokens", {}).get("cssVariables", {}))}
- Element Styles Analyzed: {len(main_app.get("design_tokens", {}).get("elementStyles", {}))}

### Page Structure
- Page Type: {"Login Page" if main_app.get("is_login_page") else "Dashboard/Application"}
- Has Navigation: {main_app.get("page_structure", {}).get("hasNavigation", False)}
- UI Components: {main_app.get("page_structure", {}).get("hasCards", 0)} cards, {main_app.get("page_structure", {}).get("hasButtons", 0)} buttons

### Screenshot
- Main Dashboard: `{main_app.get("screenshot_path", "Not available")}`
"""

    def _format_admin_analysis(self) -> str:
        admin_data = self.analysis_results.get("admin_interface", {})
        pages = admin_data.get("pages", {})
        
        if not pages:
            return "No admin interface data available."
        
        result = "### Admin Pages Analyzed\n\n"
        for path, data in pages.items():
            status = "✅ Success" if not data.get("is_error") else "❌ Error"
            result += f"**{path}**\n"
            result += f"- Status: {status}\n"
            result += f"- Has Content: {data.get('page_analysis', {}).get('hasContent', False)}\n"
            result += f"- Has Forms: {data.get('page_analysis', {}).get('hasForm', False)}\n"
            result += f"- Screenshot: `{data.get('screenshot_path', 'N/A')}`\n\n"
        
        return result

    def _format_design_gaps(self) -> str:
        gaps = self.analysis_results.get("design_gaps", [])
        if not gaps:
            return "No significant design gaps identified."
        
        result = "### Identified Design Inconsistencies\n\n"
        for gap in gaps:
            result += f"**{gap['page']}**\n"
            result += f"- Gap Type: {gap['type']}\n"
            if gap.get('missing_variables'):
                result += f"- Missing Variables: {len(gap['missing_variables'])}\n"
            if gap.get('different_values'):
                result += f"- Different Values: {len(gap['different_values'])}\n"
            result += "\n"
        
        return result

    def _format_connectivity_analysis(self) -> str:
        connectivity = self.analysis_results.get("service_connectivity", {})
        if not connectivity:
            return "No connectivity analysis performed."
        
        return f"""
### Firebase Authentication
- Status: {connectivity.get("firebase_auth", "Unknown")}

### API Connectivity
- Requests Monitored: {len(connectivity.get("api_calls", []))}
- Admin Page Load Time: {connectivity.get("loading_times", {}).get("admin_page", "N/A")}s

### Network Requests
{self._format_network_requests(connectivity.get("api_calls", []))}
"""

    def _format_network_requests(self, requests: List) -> str:
        if not requests:
            return "No requests captured."
        
        result = ""
        for req in requests[-5:]:  # Show last 5 requests
            result += f"- {req.get('method', 'GET')} {req.get('url', 'N/A')} ({req.get('status', 'N/A')})\n"
        
        return result

    def _generate_recommendations(self) -> str:
        return """
### Key Recommendations

1. **Design Consistency**
   - Standardize CSS variables across main app and admin interface
   - Implement shared design system components
   - Ensure consistent Material-UI theme usage

2. **Admin Interface Improvements**
   - Fix any non-functional admin pages identified
   - Improve form validation and error handling
   - Enhance mobile responsiveness for admin workflows

3. **Service Connectivity**
   - Optimize API response times
   - Implement proper error handling for failed requests
   - Add loading states for better UX

4. **Next Steps**
   - Address design gaps identified in this analysis
   - Implement missing admin functionality
   - Create comprehensive admin interface rebuild plan
"""

    async def run_analysis(self):
        """Run the complete analysis"""
        print("🚀 Starting comprehensive EllaAI analysis...")
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=False)  # Set to True for headless
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            page = await context.new_page()
            
            try:
                # 1. Analyze main application
                self.analysis_results["main_app"] = await self.analyze_main_application(page)
                
                # 2. Analyze admin interface
                self.analysis_results["admin_interface"] = await self.analyze_admin_interface(page, context)
                
                # 3. Test service connectivity
                self.analysis_results["service_connectivity"] = await self.test_service_connectivity(page)
                
                # 4. Compare designs
                self.analysis_results["design_gaps"] = await self.compare_designs(
                    self.analysis_results["main_app"],
                    self.analysis_results["admin_interface"]
                )
                
                # 5. Generate comprehensive report
                report_path = await self.generate_report()
                
                print("✅ Analysis completed successfully!")
                return report_path
                
            except Exception as e:
                print(f"❌ Analysis failed: {str(e)}")
                raise
            finally:
                await browser.close()

async def main():
    """Main entry point"""
    analyzer = EllaAIAnalyzer()
    try:
        report_path = await analyzer.run_analysis()
        print(f"\n📊 Complete analysis report available at: {report_path}")
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())