#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
SAP AI CATALOG DOWNLOADER
Downloads the latest AI use cases from SAP Discovery Center
https://discovery-center.cloud.sap/ai-catalog/

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
    'timeout': 90000,  # 90 seconds
    'wait_for_table': 20000,  # 20 seconds to wait for table to load
    'scroll_delay': 500,  # ms between scrolls
    'max_retries': 3,
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


def extract_use_cases_from_page(page):
    """
    Extract AI use cases from the SAP Discovery Center page.
    The page uses a dynamic table that loads data via JavaScript.
    """
    use_cases = []
    
    # Wait for the table to be visible
    log('⏳', 'Waiting for AI catalog table to load...')
    
    try:
        # Wait for the main content area
        page.wait_for_selector('[class*="catalog"]', timeout=CONFIG['wait_for_table'])
        time.sleep(2)  # Additional wait for dynamic content
        
        # Try multiple selectors for the table/cards
        selectors_to_try = [
            'table tbody tr',
            '[class*="use-case"]',
            '[class*="card"]',
            '[class*="tile"]',
            '[class*="item"]',
            'article',
        ]
        
        rows = []
        for selector in selectors_to_try:
            rows = page.query_selector_all(selector)
            if rows and len(rows) > 5:  # Found meaningful content
                log('✅', f'Found {len(rows)} items using selector: {selector}')
                break
        
        if not rows:
            log('⚠️', 'Could not find table rows, trying alternative extraction...')
            return extract_from_json_data(page)
        
        # Extract data from each row
        for i, row in enumerate(rows):
            try:
                use_case = extract_row_data(row, i)
                if use_case and use_case.get('name'):
                    use_cases.append(use_case)
            except Exception as e:
                log('⚠️', f'Error extracting row {i}: {e}')
                continue
        
        return use_cases
        
    except PlaywrightTimeout:
        log('⚠️', 'Timeout waiting for table, trying JSON extraction...')
        return extract_from_json_data(page)


def extract_row_data(row, index):
    """Extract data from a single table row or card element."""
    use_case = {
        'name': '',
        'ai_type': '',
        'commercial_type': '',
        'product': '',
        'description': '',
        'product_category': '',
        'package': '',
        'quick_filters': '',
        'availability': '',
        'identifier': f'J{index}',
        'url': '',
    }
    
    # Try to extract text content
    text_content = row.inner_text()
    
    # Try to find a link for the detail page
    link = row.query_selector('a')
    if link:
        href = link.get_attribute('href')
        if href:
            if href.startswith('/'):
                use_case['url'] = f'https://discovery-center.cloud.sap{href}'
            elif href.startswith('http'):
                use_case['url'] = href
    
    # Try to extract structured data from cells
    cells = row.query_selector_all('td')
    if cells and len(cells) >= 5:
        use_case['name'] = cells[0].inner_text().strip() if len(cells) > 0 else ''
        use_case['ai_type'] = cells[1].inner_text().strip() if len(cells) > 1 else ''
        use_case['commercial_type'] = cells[2].inner_text().strip() if len(cells) > 2 else ''
        use_case['product'] = cells[3].inner_text().strip() if len(cells) > 3 else ''
        use_case['description'] = cells[4].inner_text().strip() if len(cells) > 4 else ''
        use_case['product_category'] = cells[5].inner_text().strip() if len(cells) > 5 else ''
        use_case['availability'] = cells[6].inner_text().strip() if len(cells) > 6 else ''
    else:
        # Try to extract from card-style layout
        name_el = row.query_selector('[class*="name"], [class*="title"], h2, h3, h4')
        if name_el:
            use_case['name'] = name_el.inner_text().strip()
        
        desc_el = row.query_selector('[class*="description"], [class*="desc"], p')
        if desc_el:
            use_case['description'] = desc_el.inner_text().strip()
        
        # Check for AI type badges
        if 'AI Agent' in text_content:
            use_case['ai_type'] = 'AI Agent'
        elif 'AI Feature' in text_content:
            use_case['ai_type'] = 'AI Feature'
        
        # Check for availability
        if 'Generally Available' in text_content:
            use_case['availability'] = 'Generally Available'
        elif 'Beta' in text_content:
            use_case['availability'] = 'Beta'
        elif 'EAC' in text_content or 'Early Adopter' in text_content:
            use_case['availability'] = 'Early Adopter Care (EAC)'
        
        # Check for commercial type
        if 'Premium' in text_content:
            use_case['commercial_type'] = 'Premium'
        elif 'Base' in text_content:
            use_case['commercial_type'] = 'Base'
    
    return use_case


def extract_from_json_data(page):
    """
    Try to extract data from embedded JSON or API responses.
    SAP Discovery Center often embeds data in script tags or fetches via API.
    """
    use_cases = []
    
    log('🔍', 'Attempting to extract data from page scripts...')
    
    # Look for embedded JSON data
    scripts = page.query_selector_all('script')
    for script in scripts:
        try:
            content = script.inner_text()
            if 'AI Feature' in content or 'AI Agent' in content:
                # Try to parse as JSON
                start = content.find('[')
                end = content.rfind(']') + 1
                if start >= 0 and end > start:
                    json_str = content[start:end]
                    data = json.loads(json_str)
                    if isinstance(data, list):
                        for item in data:
                            use_case = parse_json_item(item)
                            if use_case:
                                use_cases.append(use_case)
        except (json.JSONDecodeError, Exception):
            continue
    
    # If no embedded data, try to intercept network requests
    if not use_cases:
        log('🌐', 'Trying to fetch data from API...')
        use_cases = fetch_from_api(page)
    
    return use_cases


def parse_json_item(item):
    """Parse a JSON item into a use case dictionary."""
    if not isinstance(item, dict):
        return None
    
    return {
        'name': item.get('name', item.get('title', '')),
        'ai_type': item.get('aiType', item.get('ai_type', item.get('type', ''))),
        'commercial_type': item.get('commercialType', item.get('commercial_type', '')),
        'product': item.get('product', item.get('productName', '')),
        'description': item.get('description', item.get('desc', '')),
        'product_category': item.get('productCategory', item.get('category', '')),
        'package': item.get('package', ''),
        'quick_filters': item.get('quickFilters', item.get('filters', '')),
        'availability': item.get('availability', item.get('status', '')),
        'identifier': item.get('identifier', item.get('id', '')),
        'url': item.get('url', item.get('detailPage', item.get('link', ''))),
    }


def fetch_from_api(page):
    """
    Try to fetch data directly from SAP's API endpoints.
    """
    use_cases = []
    
    # Known API endpoints for SAP Discovery Center
    api_endpoints = [
        'https://discovery-center.cloud.sap/api/ai-catalog',
        'https://discovery-center.cloud.sap/api/v1/ai-features',
        'https://discovery-center.cloud.sap/api/v1/use-cases',
    ]
    
    for endpoint in api_endpoints:
        try:
            response = page.evaluate(f'''
                async () => {{
                    try {{
                        const res = await fetch("{endpoint}");
                        if (res.ok) {{
                            return await res.json();
                        }}
                    }} catch (e) {{
                        return null;
                    }}
                    return null;
                }}
            ''')
            
            if response and isinstance(response, list):
                for item in response:
                    use_case = parse_json_item(item)
                    if use_case and use_case.get('name'):
                        use_cases.append(use_case)
                
                if use_cases:
                    log('✅', f'Fetched {len(use_cases)} use cases from API')
                    break
        except Exception as e:
            log('⚠️', f'API fetch failed for {endpoint}: {e}')
            continue
    
    return use_cases


def scroll_to_load_all(page):
    """
    Scroll the page to load all dynamically loaded content.
    """
    log('📜', 'Scrolling to load all content...')
    
    previous_height = 0
    scroll_attempts = 0
    max_scroll_attempts = 50
    
    while scroll_attempts < max_scroll_attempts:
        # Get current scroll height
        current_height = page.evaluate('document.body.scrollHeight')
        
        if current_height == previous_height:
            # No new content loaded, we're done
            break
        
        previous_height = current_height
        
        # Scroll to bottom
        page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        time.sleep(CONFIG['scroll_delay'] / 1000)
        
        scroll_attempts += 1
    
    # Scroll back to top
    page.evaluate('window.scrollTo(0, 0)')
    time.sleep(0.5)
    
    log('✅', f'Completed scrolling ({scroll_attempts} scrolls)')


def save_to_csv(use_cases, output_path):
    """Save use cases to a CSV file."""
    log('💾', f'Saving {len(use_cases)} use cases to {output_path}...')
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
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


def download_catalog():
    """Main function to download the SAP AI catalog."""
    log('🚀', 'Starting SAP AI Catalog download...')
    log('🌐', f'URL: {CONFIG["url"]}')
    
    # Determine output path
    script_dir = Path(__file__).parent
    output_path = script_dir / CONFIG['output_file']
    
    use_cases = []
    
    with sync_playwright() as p:
        # Launch browser
        log('🌐', 'Launching browser...')
        browser = p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        # Set up request interception to capture API responses
        api_data = []
        
        def handle_response(response):
            if 'api' in response.url.lower() or 'catalog' in response.url.lower():
                try:
                    if response.status == 200:
                        content_type = response.headers.get('content-type', '')
                        if 'json' in content_type:
                            data = response.json()
                            if isinstance(data, list):
                                api_data.extend(data)
                            elif isinstance(data, dict) and 'items' in data:
                                api_data.extend(data['items'])
                except Exception:
                    pass
        
        page.on('response', handle_response)
        
        try:
            # Navigate to the page
            log('📄', 'Loading SAP Discovery Center AI Catalog...')
            # Use 'domcontentloaded' instead of 'networkidle' as SAP pages have many background requests
            page.goto(CONFIG['url'], timeout=CONFIG['timeout'], wait_until='domcontentloaded')
            
            # Wait for the page to stabilize
            log('⏳', 'Waiting for page to stabilize...')
            page.wait_for_load_state('load', timeout=30000)
            
            # Wait for content to load
            time.sleep(3)
            
            # Scroll to load all content
            scroll_to_load_all(page)
            
            # Check if we captured API data
            if api_data:
                log('✅', f'Captured {len(api_data)} items from API responses')
                for item in api_data:
                    use_case = parse_json_item(item)
                    if use_case and use_case.get('name'):
                        use_cases.append(use_case)
            
            # If no API data, try page extraction
            if not use_cases:
                use_cases = extract_use_cases_from_page(page)
            
            # Take a screenshot for debugging if no data found
            if not use_cases:
                screenshot_path = script_dir / 'debug_screenshot.png'
                page.screenshot(path=str(screenshot_path), full_page=True)
                log('📸', f'Debug screenshot saved to {screenshot_path}')
                log('❌', 'No use cases found. Check the screenshot for page state.')
            
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
    
    # Save results
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
        ai_agents = sum(1 for uc in use_cases if uc.get('ai_type') == 'AI Agent')
        ai_features = sum(1 for uc in use_cases if uc.get('ai_type') == 'AI Feature')
        
        log('📊', f'Total use cases: {len(use_cases)}')
        log('🤖', f'AI Agents: {ai_agents}')
        log('✨', f'AI Features: {ai_features}')
        log('🎉', 'Download completed successfully!')
        
        return True
    else:
        log('❌', 'No use cases were extracted')
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