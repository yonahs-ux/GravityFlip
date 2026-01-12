/**
 * Gravity Flip - Ad Simulation Tests
 * Tests for the ad caching and display system
 */

class AdSimulationTests {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message) {
        console.log('[AD TEST]', message);
    }

    assert(condition, testName) {
        if (condition) {
            this.passed++;
            this.results.push({ name: testName, status: 'PASS' });
            console.log(`✓ ${testName}`);
        } else {
            this.failed++;
            this.results.push({ name: testName, status: 'FAIL' });
            console.error(`✗ ${testName}`);
        }
    }

    async runAllTests() {
        console.log('========================================');
        console.log('GRAVITY FLIP - AD SIMULATION TESTS');
        console.log('========================================');
        console.log('');

        if (!window.adManager) {
            console.error('ERROR: window.adManager not available');
            return;
        }

        await this.testAdManagerExists();
        await this.testAdCaching();
        await this.testCachedAdDisplay();
        await this.testEmptyCacheHandling();
        await this.testAdDismissal();
        await this.testOnlineOfflineDetection();

        this.printReport();
    }

    async testAdManagerExists() {
        this.log('Testing AdManager initialization...');

        this.assert(window.adManager !== null, 'AdManager instance exists');
        this.assert(typeof window.adManager.showAd === 'function', 'showAd method exists');
        this.assert(typeof window.adManager.dismissAd === 'function', 'dismissAd method exists');
        this.assert(typeof window.adManager.hasAds === 'function', 'hasAds method exists');
        this.assert(typeof window.adManager.cacheAds === 'function', 'cacheAds method exists');
    }

    async testAdCaching() {
        this.log('Testing ad caching...');

        // Clear cache first
        window.adManager.clearCache();

        const testAds = [
            { id: 'test_1', type: 'html', content: '<div>Test Ad 1</div>' },
            { id: 'test_2', type: 'html', content: '<div>Test Ad 2</div>' }
        ];

        window.adManager.cacheAds(testAds);

        const cached = window.adManager.getCachedAds();

        this.assert(cached.length === 2, 'Correct number of ads cached');
        this.assert(cached[0].id === 'test_1', 'First ad cached correctly');
        this.assert(cached[1].id === 'test_2', 'Second ad cached correctly');
    }

    async testCachedAdDisplay() {
        this.log('Testing cached ad display...');

        // Ensure ads are cached
        window.adManager._initializeMockAds();

        this.assert(window.adManager.hasAds(), 'Ads are available');

        let callbackCalled = false;
        const result = window.adManager.showAd(() => {
            callbackCalled = true;
        });

        this.assert(result === true, 'showAd returns true when ads available');
        this.assert(window.adManager.isShowingAd === true, 'isShowingAd flag is set');

        await this.wait(100);

        // Check overlay is visible
        const overlay = document.getElementById('adOverlay');
        this.assert(!overlay.classList.contains('hidden'), 'Ad overlay is visible');

        // Dismiss ad
        window.adManager.dismissAd();
        await this.wait(100);

        this.assert(callbackCalled, 'Callback called after dismissal');
        this.assert(window.adManager.isShowingAd === false, 'isShowingAd flag cleared');
    }

    async testEmptyCacheHandling() {
        this.log('Testing empty cache handling...');

        // Clear cache
        window.adManager.clearCache();

        this.assert(!window.adManager.hasAds(), 'hasAds returns false when cache empty');

        let callbackCalled = false;
        const result = window.adManager.showAd(() => {
            callbackCalled = true;
        });

        this.assert(result === false, 'showAd returns false when no ads');
        this.assert(callbackCalled, 'Callback still called (graceful fallback)');

        // Restore mock ads
        window.adManager._initializeMockAds();
    }

    async testAdDismissal() {
        this.log('Testing ad dismissal...');

        window.adManager._initializeMockAds();

        let resumeCallbackCalled = false;

        window.adManager.showAd(() => {
            resumeCallbackCalled = true;
        });

        await this.wait(100);

        window.adManager.dismissAd();
        await this.wait(100);

        this.assert(resumeCallbackCalled, 'Resume callback executed on dismiss');

        const overlay = document.getElementById('adOverlay');
        this.assert(overlay.classList.contains('hidden'), 'Ad overlay hidden after dismiss');
    }

    async testOnlineOfflineDetection() {
        this.log('Testing online/offline detection...');

        const isOnline = window.adManager.isOnline();
        const navigatorOnline = navigator.onLine;

        this.assert(typeof isOnline === 'boolean', 'isOnline returns boolean');
        this.assert(isOnline === navigatorOnline, 'isOnline matches navigator.onLine');
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printReport() {
        console.log('');
        console.log('========================================');
        console.log('AD TEST REPORT');
        console.log('========================================');
        console.log(`Total: ${this.passed + this.failed}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log('');

        if (this.failed === 0) {
            console.log('✓ ALL AD TESTS PASSED');
        } else {
            console.log('✗ SOME TESTS FAILED');
        }
        console.log('========================================');

        return {
            total: this.passed + this.failed,
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AdSimulationTests = AdSimulationTests;

    window.runAdTests = async function () {
        const tests = new AdSimulationTests();
        await tests.runAllTests();
        return tests.printReport();
    };

    console.log('[AdSimulationTests] Loaded. Run window.runAdTests() to execute tests.');
}
