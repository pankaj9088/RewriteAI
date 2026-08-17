/**
 * ============================================================================
 * RewriteAI - Extension Configuration
 * ============================================================================
 * 
 * 🔧 INSTRUCTIONS FOR DEPLOYMENT:
 * 
 * 1. Deploy your backend server (e.g., on Render, Railway, Fly.io, or VPS).
 * 2. Copy your live HTTPS URL (e.g., https://rewriteai-api.onrender.com).
 * 3. Replace "https://YOUR_PUBLIC_BACKEND_URL" below with your actual URL.
 * 4. For local development, you can switch ENV to 'development' or change it in settings.
 */

const CONFIG = {
  // Environment: 'production' (default for Chrome Web Store) or 'development'
  ENV: 'production',

  // 🚀 REPLACE THIS PLACEHOLDER WITH YOUR DEPLOYED RENDER BACKEND URL
  PRODUCTION_API_URL: 'https://YOUR_PUBLIC_BACKEND_URL',

  // 💻 Localhost URL for local development
  DEVELOPMENT_API_URL: 'http://localhost:3000',

  /**
   * Returns the active base URL based on ENV mode
   */
  get API_BASE_URL() {
    return this.ENV === 'production' ? this.PRODUCTION_API_URL : this.DEVELOPMENT_API_URL;
  },

  /**
   * Full rewrite endpoint
   */
  get REWRITE_ENDPOINT() {
    return `${this.API_BASE_URL.replace(/\/$/, '')}/api/rewrite`;
  },

  /**
   * Health check endpoint
   */
  get HEALTH_ENDPOINT() {
    return `${this.API_BASE_URL.replace(/\/$/, '')}/health`;
  },

  /**
   * Helper to verify if the URL is still the placeholder
   */
  isPlaceholder(url) {
    const target = url || this.PRODUCTION_API_URL;
    return target.includes('YOUR_PUBLIC_BACKEND_URL') || target.includes('YOUR-PUBLIC-BACKEND-URL');
  }
};

// Export configuration globally for both Service Worker and Browser Window contexts
if (typeof self !== 'undefined') {
  self.CONFIG = CONFIG;
}
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
