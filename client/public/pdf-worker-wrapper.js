// This is a wrapper for the PDF.js worker to fix module loading issues
(function() {
  // Load the worker script inline - requires special MIME type handling
  try {
    // The original worker content is injected here by the build process
    importScripts('/pdf.worker.min.js');
    console.log('PDF.js worker loaded successfully via wrapper');
  } catch (e) {
    console.error('Failed to load PDF.js worker:', e);
  }
})();
