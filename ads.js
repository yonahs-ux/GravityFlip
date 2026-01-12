/**
 * Gravity Flip - Ad Manager
 * Handles fetching, caching, and displaying interstitial ads
 * Works offline using cached ads
 */

class AdManager {
    constructor(options = {}) {
        // Configurable mock ad endpoint
        this.adEndpoint = options.adEndpoint || 'https://example.com/api/ads';
        this.cacheKey = 'gravityFlip_adCache';
        this.isShowingAd = false;
        this.onAdClosed = null;
        
        // DOM elements
        this.adOverlay = document.getElementById('adOverlay');
        this.adContent = document.getElementById('adContent');
        this.closeAdBtn = document.getElementById('closeAdBtn');
        
        // Bind events
        if (this.closeAdBtn) {
            this.closeAdBtn.addEventListener('click', () => this.dismissAd());
        }
        
        // Initialize with mock ads for offline usage
        this._initializeMockAds();
        
        // Try to fetch fresh ads if online
        if (this.isOnline()) {
            this.fetchAds();
        }
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.fetchAds());
        
        console.log('[AdManager] Initialized');
    }
    
    /**
     * Check if device is online
     */
    isOnline() {
        // Check for Android bridge first
        if (typeof AndroidBridge !== 'undefined' && AndroidBridge.isNetworkAvailable) {
            return AndroidBridge.isNetworkAvailable();
        }
        return navigator.onLine;
    }
    
    /**
     * Initialize with default mock ads for offline-first experience
     */
    _initializeMockAds() {
        const existingAds = this.getCachedAds();
        if (!existingAds || existingAds.length === 0) {
            const mockAds = [
                {
                    id: 'mock_1',
                    type: 'html',
                    content: '<div class="mock-ad"><h3>🎮 Level Up!</h3><p>Check out more awesome games</p></div>'
                },
                {
                    id: 'mock_2',
                    type: 'html',
                    content: '<div class="mock-ad"><h3>⭐ Rate Us!</h3><p>Enjoying the game? Leave a review!</p></div>'
                },
                {
                    id: 'mock_3',
                    type: 'html',
                    content: '<div class="mock-ad"><h3>🏆 Challenge Friends</h3><p>Share your high score!</p></div>'
                }
            ];
            this.cacheAds(mockAds);
            console.log('[AdManager] Mock ads initialized');
        }
    }
    
    /**
     * Fetch ads from endpoint (simulated)
     */
    async fetchAds() {
        if (!this.isOnline()) {
            console.log('[AdManager] Offline - using cached ads');
            return;
        }
        
        try {
            // In production, this would fetch from a real endpoint
            // For now, we simulate a network request
            console.log('[AdManager] Fetching ads from:', this.adEndpoint);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Simulated response - in production, use fetch()
            const ads = [
                {
                    id: 'fetched_1',
                    type: 'html',
                    content: '<div class="mock-ad"><h3>🚀 New Game Alert!</h3><p>Try our latest adventure game</p></div>',
                    fetchedAt: Date.now()
                },
                {
                    id: 'fetched_2',
                    type: 'html',
                    content: '<div class="mock-ad"><h3>💎 Premium Features</h3><p>Unlock exclusive content</p></div>',
                    fetchedAt: Date.now()
                }
            ];
            
            this.cacheAds(ads);
            console.log('[AdManager] Ads fetched and cached:', ads.length);
            this._logEvent('ads_fetched');
            
        } catch (error) {
            console.warn('[AdManager] Failed to fetch ads:', error);
        }
    }
    
    /**
     * Cache ads to localStorage
     */
    cacheAds(ads) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(ads));
        } catch (error) {
            console.warn('[AdManager] Failed to cache ads:', error);
        }
    }
    
    /**
     * Get cached ads from localStorage
     */
    getCachedAds() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.warn('[AdManager] Failed to read cached ads:', error);
            return [];
        }
    }
    
    /**
     * Check if ads are available
     */
    hasAds() {
        const ads = this.getCachedAds();
        return ads && ads.length > 0;
    }
    
    /**
     * Get a random cached ad
     */
    getRandomAd() {
        const ads = this.getCachedAds();
        if (!ads || ads.length === 0) return null;
        return ads[Math.floor(Math.random() * ads.length)];
    }
    
    /**
     * Show an interstitial ad
     * @param {Function} onClosed - Callback when ad is dismissed
     * @returns {boolean} - Whether an ad was shown
     */
    showAd(onClosed = null) {
        if (this.isShowingAd) {
            console.log('[AdManager] Ad already showing');
            return false;
        }
        
        const ad = this.getRandomAd();
        if (!ad) {
            console.log('[AdManager] No ads available');
            this._logEvent('ad_not_available');
            if (onClosed) onClosed();
            return false;
        }
        
        this.isShowingAd = true;
        this.onAdClosed = onClosed;
        
        // Render ad content
        if (ad.type === 'html') {
            this.adContent.innerHTML = ad.content;
        } else if (ad.type === 'image') {
            this.adContent.innerHTML = `<img src="${ad.imageUrl}" alt="Advertisement">`;
        }
        
        // Show overlay
        this.adOverlay.classList.remove('hidden');
        
        console.log('[AdManager] Ad displayed:', ad.id);
        this._logEvent('ad_displayed');
        
        // Emit debug event
        if (window.gameDebug) {
            window.gameDebug.adDisplayed = true;
            window.gameDebug.lastAdId = ad.id;
        }
        
        return true;
    }
    
    /**
     * Dismiss the current ad
     */
    dismissAd() {
        if (!this.isShowingAd) return;
        
        this.adOverlay.classList.add('hidden');
        this.isShowingAd = false;
        
        console.log('[AdManager] Ad dismissed');
        this._logEvent('ad_dismissed');
        
        // Emit debug event
        if (window.gameDebug) {
            window.gameDebug.adDisplayed = false;
        }
        
        // Call callback
        if (this.onAdClosed) {
            this.onAdClosed();
            this.onAdClosed = null;
        }
    }
    
    /**
     * Clear ad cache (for testing)
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        console.log('[AdManager] Cache cleared');
    }
    
    /**
     * Log event to Android bridge or console
     */
    _logEvent(event) {
        if (typeof AndroidBridge !== 'undefined' && AndroidBridge.logEvent) {
            AndroidBridge.logEvent('AdManager: ' + event);
        }
    }
}

// Global ad manager instance
window.adManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adManager = new AdManager();
});
