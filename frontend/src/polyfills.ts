// This file is mainly needed to ensure that certain globals are available
// Most of the polyfills are now handled by vite-plugin-node-polyfills

// For additional safety, ensure global and Buffer are defined
// These assignments help with libraries that directly access these globals
if (typeof window !== 'undefined') {
  // Ensure global is defined
  window.global = window;
  
  // For libraries that check if we're in Node environment
  window.process = window.process || { env: {} };
} 