#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
SAP AI CATALOG DOWNLOADER
Downloads the latest AI use cases from SAP Discovery Center
https://discovery-center.cloud.sap/ai-catalog/

This script uses Playwright to:
1. Load the SAP Discovery Center AI Catalog page
2. Accept cookie consent if present
3. Click the built-in "Download" button
4. Save the exported CSV file

Usage:
  python3 downloader.py
  
Output:
  sap_ai_raw_data.csv - CSV file with all AI use cases
═══════════════════════════════════════════════════════════════
"""

import os
import sys
import time
import shutil
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
    'timeout': 120000,  # 2 minutes for page load
    'download_timeout': 60000,  # 1 minute for download
}


def log(emoji, message):
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {emoji} {message}")


def download_catalog():
    """Main function to download the SAP AI catalog using the built-in Download button."""
    log('🚀', 'Starting SAP AI Catalog download...')
    log('🌐', f'URL: {CONFIG["url"]}')
    
    # Determine output path
    script_dir = Path(__file__).parent
    output_path = script_dir / CONFIG['output_file']
    
    with sync_playwright() as p:
        # Launch browser
        log('🌐', 'Launching browser...')
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            accept_downloads=True,
        )
        
        # Set longer default timeout
        context.set_default_timeout(CONFIG['timeout'])
        
        page = context.new_page()
        
        try:
            # Navigate to the page
            log('📄', 'Loading SAP Discovery Center AI Catalog...')
            page.goto(CONFIG['url'], wait_until='domcontentloaded', timeout=CONFIG['timeout'])
            
            # Wait for initial page load
            log('⏳', 'Waiting for page to load...')
            time.sleep(5)
            
            # Wait for the loading spinner to disappear
            try:
                page.wait_for_selector('#dc-loading-spinner', state='hidden', timeout=60000)
                log('✅', 'Loading spinner hidden')
            except PlaywrightTimeout:
                log('⚠️', 'Loading spinner timeout, continuing...')
            
            # Wait for network to settle
            try:
                page.wait_for_load_state('networkidle', timeout=30000)
            except PlaywrightTimeout:
                log('⚠️', 'Network idle timeout, continuing...')
            
            # Additional wait for dynamic content
            time.sleep(10)
            
            # Accept cookie consent if present
            log('🍪', 'Checking for cookie consent...')
            try:
                # Try German "Accept All" button
                accept_btn = page.locator('button:has-text("Alle akzeptieren")').first
                if accept_btn.is_visible(timeout=3000):
                    accept_btn.click()
                    log('✅', 'Accepted cookies (German)')
                    time.sleep(2)
            except:
                pass
            
            try:
                # Try English "Accept All" button
                accept_btn = page.locator('button:has-text("Accept All")').first
                if accept_btn.is_visible(timeout=3000):
                    accept_btn.click()
                    log('✅', 'Accepted cookies (English)')
                    time.sleep(2)
            except:
                pass
            
            # Find and click the Download button
            log('🔍', 'Looking for Download button...')
            
            # Wait for the Download button to appear
            download_btn = page.locator('button:has-text("Download")').first
            download_btn.wait_for(state='visible', timeout=30000)
            log('✅', 'Found Download button')
            
            # Set up download handler
            log('📥', 'Clicking Download button...')
            
            with page.expect_download(timeout=CONFIG['download_timeout']) as download_info:
                download_btn.click()
            
            download = download_info.value
            
            # Save the downloaded file
            log('💾', f'Saving download to {output_path}...')
            download.save_as(str(output_path))
            
            # Verify the download
            if output_path.exists():
                file_size = output_path.stat().st_size
                
                # Count lines
                with open(output_path, 'r', encoding='utf-8-sig') as f:
                    lines = f.readlines()
                    total_lines = len(lines)
                    
                    # Count AI types
                    ai_agents = sum(1 for line in lines if '"AI Agent"' in line)
                    ai_features = sum(1 for line in lines if '"AI Feature"' in line)
                
                log('📊', f'File size: {file_size / 1024:.2f} KB')
                log('📈', f'Total use cases: {total_lines - 1}')  # Exclude header
                log('🤖', f'AI Agents: {ai_agents}')
                log('✨', f'AI Features: {ai_features}')
                log('🎉', 'Download completed successfully!')
                
                return True
            else:
                log('❌', 'Download file not found')
                return False
            
        except Exception as e:
            log('❌', f'Error during download: {e}')
            
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