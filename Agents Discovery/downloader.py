#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
SAP AI CATALOG DOWNLOADER
Downloads the latest AI use cases from SAP Discovery Center
https://discovery-center.cloud.sap/ai-catalog/

This script uses Playwright to:
1. Load the SAP Discovery Center AI Catalog page
2. Wait for the table to render
3. Extract data from the rendered table
4. Save to CSV format

Usage:
  python3 downloader.py
  
Output:
  sap_ai_raw_data.csv - CSV file with all AI use cases
═══════════════════════════════════════════════════════════════
"""

import csv
import json
import os
import sys
import time
import re
from datetime import datetime
from pathlib import Path

# Try to import playwright, provide helpful error if not installed
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("❌ Playwright is not installed.")
    print("   Install it with: pip3 install playwright && playwright install chromium")
    sys.exit(1)

# Configuration
CONFIG = {
    'url': 'https://discovery-center.cloud.sap/ai-catalog/',
    'output_file': 'sap_ai_raw_data.csv',
    'timeout': 180000,  # 3 minutes for page load
    'table_timeout': 120000,  # 2 minutes to wait for table
}

# CSV Headers matching the expected format
CSV_HEADERS = [
    'Name',
    'AI Type',
    'Commercial Type',
    'Product',
    'Description',
    'Product Category',
    'Package',
    'Quick Filters',
    'Availability',
    'Identifier',
    'Detail Page'
]


def log(emoji, message):
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {emoji} {message}")


def save_to_csv(use_cases, output_path):
    """Save use cases to a CSV file."""
    log('💾', f'Saving {len(use_cases)} use cases to {output_path}...')
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        
        # Write header
        writer.writerow(CSV_HEADERS)
        
        # Write data rows
        for uc in use_cases:
            row = [
                uc.get('name', ''),
                uc.get('ai_type', ''),
                uc.get('commercial_type', ''),
                uc.get('product', ''),
                uc.get('description', ''),
                uc.get('product_category', ''),
                uc.get('package', ''),
                uc.get('quick_filters', ''),
                uc.get('availability', ''),
                uc.get('identifier', ''),
                uc.get('url', ''),
            ]
            writer.writerow(row)
    
    log('✅', f'Saved to {output_path}')


def extract_table_data(page):
    """Extract data from the rendered table using JavaScript."""
    log('🔍', 'Extracting data from table...')
    
    # JavaScript to extract table data
    extract_script = """
    () => {
        const results = [];
        
        // Try to find table rows
        const rows = document.querySelectorAll('table tbody tr, .sapMListItem, [class*="TableRow"]');
        
        if (rows.length === 0) {
            // Try alternative selectors for SAP UI5 tables
            const altRows = document.querySelectorAll('[role="row"], .sapMListItemBase');
            if (altRows.length > 0) {
                altRows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td, [role="cell"], .sapMListItemText');
                    if (cells.length >= 3) {
                        const text = row.innerText || '';
                        const link = row.querySelector('a');
                        
                        results.push({
                            name: cells[0]?.innerText?.trim() || '',
                            ai_type: text.includes('AI Agent') ? 'AI Agent' : (text.includes('AI Feature') ? 'AI Feature' : ''),
                            commercial_type: text.includes('Premium') ? 'Premium' : (text.includes('Base') ? 'Base' : ''),
                            product: cells[1]?.innerText?.trim() || '',
                            description: cells[2]?.innerText?.trim() || '',
                            product_category: '',
                            package: '',
                            quick_filters: '',
                            availability: text.includes('Generally Available') ? 'Generally Available' : 
                                         (text.includes('Beta') ? 'Beta' : 
                                         (text.includes('EAC') || text.includes('Early Adopter') ? 'Early Adopter Care (EAC)' : '')),
                            identifier: 'J' + index,
                            url: link?.href || '',
                        });
                    }
                });
            }
        } else {
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const link = row.querySelector('a');
                    results.push({
                        name: cells[0]?.innerText?.trim() || '',
                        ai_type: cells[1]?.innerText?.trim() || '',
                        commercial_type: cells[2]?.innerText?.trim() || '',
                        product: cells[3]?.innerText?.trim() || '',
                        description: cells[4]?.innerText?.trim() || '',
                        product_category: cells[5]?.innerText?.trim() || '',
                        package: cells[6]?.innerText?.trim() || '',
                        quick_filters: cells[7]?.innerText?.trim() || '',
                        availability: cells[8]?.innerText?.trim() || '',
                        identifier: 'J' + index,
                        url: link?.href || '',
                    });
                }
            });
        }
        
        return results;
    }
    """
    
    try:
        data = page.evaluate(extract_script)
        return data
    except Exception as e:
        log('⚠️', f'Error extracting table data: {e}')
        return []


def scroll_and_load_all(page):
    """Scroll the page to load all lazy-loaded content."""
    log('📜', 'Scrolling to load all content...')
    
    previous_count = 0
    stable_count = 0
    max_stable = 3  # Stop after 3 consecutive same counts
    
    for i in range(50):  # Max 50 scroll attempts
        # Scroll to bottom
        page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        time.sleep(1)
        
        # Check current row count
        current_count = page.evaluate('''
            () => {
                const rows = document.querySelectorAll('table tbody tr, .sapMListItem, [role="row"]');
                return rows.length;
            }
        ''')
        
        log('📊', f'Scroll {i+1}: Found {current_count} rows')
        
        if current_count == previous_count:
            stable_count += 1
            if stable_count >= max_stable:
                log('✅', f'Content fully loaded ({current_count} rows)')
                break
        else:
            stable_count = 0
        
        previous_count = current_count
        
        # Also try clicking "Load More" button if exists
        try:
            load_more = page.query_selector('[class*="loadMore"], [class*="ShowMore"], button:has-text("More")')
            if load_more and load_more.is_visible():
                load_more.click()
                time.sleep(2)
        except:
            pass
    
    # Scroll back to top
    page.evaluate('window.scrollTo(0, 0)')
    time.sleep(1)


def download_catalog():
    """Main function to download the SAP AI catalog."""
    log('🚀', 'Starting SAP AI Catalog download...')
    log('🌐', f'URL: {CONFIG["url"]}')
    
    # Determine output path
    script_dir = Path(__file__).parent
    output_path = script_dir / CONFIG['output_file']
    
    use_cases = []
    
    with sync_playwright() as p:
        # Launch browser with more permissive settings
        log('🌐', 'Launching browser...')
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            java_script_enabled=True,
            ignore_https_errors=True,
        )
        
        # Set longer default timeout
        context.set_default_timeout(CONFIG['timeout'])
        
        page = context.new_page()
        
        try:
            # Navigate to the page
            log('📄', 'Loading SAP Discovery Center AI Catalog...')
            log('⏳', 'This may take 1-2 minutes...')
            
            page.goto(CONFIG['url'], wait_until='domcontentloaded', timeout=CONFIG['timeout'])
            
            # Wait for initial page load
            log('⏳', 'Waiting for page to initialize...')
            time.sleep(10)
            
            # Wait for the loading spinner to disappear
            try:
                page.wait_for_selector('#dc-loading-spinner', state='hidden', timeout=60000)
                log('✅', 'Loading spinner hidden')
            except:
                log('⚠️', 'Loading spinner timeout, continuing...')
            
            # Wait for table or content to appear
            log('⏳', 'Waiting for content to load...')
            
            # Try multiple selectors for the table
            table_selectors = [
                'table tbody tr',
                '.sapMListItem',
                '[role="row"]',
                '[class*="TableRow"]',
                '[class*="catalog"]',
            ]
            
            table_found = False
            for selector in table_selectors:
                try:
                    page.wait_for_selector(selector, timeout=30000)
                    log('✅', f'Found content with selector: {selector}')
                    table_found = True
                    break
                except:
                    continue
            
            if not table_found:
                log('⚠️', 'Table not found with standard selectors, waiting more...')
                time.sleep(30)
            
            # Additional wait for dynamic content
            time.sleep(10)
            
            # Scroll to load all content
            scroll_and_load_all(page)
            
            # Extract data from the table
            use_cases = extract_table_data(page)
            
            # Take a screenshot for debugging
            screenshot_path = script_dir / 'debug_screenshot.png'
            page.screenshot(path=str(screenshot_path), full_page=True)
            log('📸', f'Screenshot saved to {screenshot_path}')
            
            # If no data extracted, try alternative method
            if not use_cases:
                log('⚠️', 'No data extracted from table, trying alternative method...')
                
                # Get page HTML for debugging
                html_content = page.content()
                html_path = script_dir / 'debug_page.html'
                with open(html_path, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                log('📄', f'Page HTML saved to {html_path}')
            
        except Exception as e:
            log('❌', f'Error during extraction: {e}')
            # Take error screenshot
            try:
                screenshot_path = script_dir / 'error_screenshot.png'
                page.screenshot(path=str(screenshot_path), full_page=True)
                log('📸', f'Error screenshot saved to {screenshot_path}')
            except Exception:
                pass
            raise
        
        finally:
            browser.close()
    
    # Process and save results
    if use_cases:
        # Remove duplicates based on name
        seen_names = set()
        unique_use_cases = []
        for uc in use_cases:
            name = uc.get('name', '')
            if name and name not in seen_names:
                seen_names.add(name)
                unique_use_cases.append(uc)
        
        use_cases = unique_use_cases
        save_to_csv(use_cases, output_path)
        
        # Print summary
        ai_agents = sum(1 for uc in use_cases if 'agent' in uc.get('ai_type', '').lower())
        ai_features = sum(1 for uc in use_cases if 'feature' in uc.get('ai_type', '').lower())
        
        log('📊', f'Total use cases: {len(use_cases)}')
        log('🤖', f'AI Agents: {ai_agents}')
        log('✨', f'AI Features: {ai_features}')
        log('🎉', 'Download completed successfully!')
        
        return True
    else:
        log('❌', 'No use cases were extracted')
        log('💡', 'The SAP Discovery Center page may have changed structure.')
        log('💡', 'Check the debug_screenshot.png and debug_page.html files.')
        return False


if __name__ == '__main__':
    try:
        success = download_catalog()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        log('⚠️', 'Download cancelled by user')
        sys.exit(1)
    except Exception as e:
        log('❌', f'Fatal error: {e}')
        sys.exit(1)