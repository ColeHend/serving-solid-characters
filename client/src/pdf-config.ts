/**
 * This file is imported at the application root to ensure PDF.js 
 * is properly configured before any PDF components are loaded.
 */

// Add type definitions for our global properties
declare global {
  interface Window {
    pdfjsLib?: any;
    pdfjsVersion?: string;
    pdfjsGetDocument?: (params: any) => any;
  }
}

/**
 * PDF.js configuration - use non-worker mode only
 * 
 * In PDF.js v4+, worker loading can be problematic due to module/CORS issues.
 * This configuration ensures we use non-worker mode everywhere for reliability.
 */
(function configurePdfJs() {
  try {
    // Check if already defined
    if (window.pdfjsLib) {
      console.debug('[PDF_GLOBAL] PDF.js already configured');
      return;
    }
    
    // Set stub worker path - this is essential for PDF.js to work
    window.pdfjsWorkerSrc = '/pdf-worker-stub.js';
    console.debug('[PDF_GLOBAL] PDF.js worker stub path set');
    
    // Set version info to help debugging
    window.pdfjsVersion = '4.10.38'; // Match the actual version in package.json
    console.debug('[PDF_GLOBAL] PDF.js version set');
    
    // Pre-fetch the worker stub to ensure it's available
    fetch('/pdf-worker-stub.js').catch(err => {
      console.warn('[PDF_GLOBAL] Could not fetch worker stub:', err);
    });
  } catch (err) {
    console.warn('[PDF_GLOBAL] Failed to configure PDF.js globally:', err);
  }
})();

export {};
