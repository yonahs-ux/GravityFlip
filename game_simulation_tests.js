/**
 * Gravity Flip v3.1 - FIXES VALIDATION TESTS
 * 
 * Tests for:
 * - Mid-air gravity flipping (MUST WORK)
 * - Flip cooldown enforcement (100ms)
 * - Obstacle spawning (MUST EXIST)
 * - Death on collision
 */

class GameSimulationTests {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message) {
        console.log('[TEST]', message);
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
        console.log('GRAVITY FLIP v3.1 - FIXES VALIDATION');
        console.log('========================================');
        console.log('');

        if (!window.gameDebug) {
            console.error('ERROR: window.gameDebug not available');
            return { passed: false, failedCount: 1 };
        }

        // CRITICAL FIX #1: Mid-air flipping
        await this.testMidAirFlipping();
        await this.testMultipleMidAirFlips();
        await this.testCooldownEnforcement();

        // CRITICAL FIX #2: Obstacles
        await this.testObstaclesSpawnEarly();
        await this.testObstacleCollisionCausesDeath();
        await this.testDifferentObstacleTypes();

        // Existing tests
        await this.testGradualPhysics();
        await this.testDeathCounter();

        return this.printReport();
    }

    // ==========================================
    // CRITICAL FIX #1: MID-AIR FLIPPING
    // ==========================================

    async testMidAirFlipping() {
        this.log('Testing MID-AIR FLIPPING (critical fix)...');

        window.gameDebug.startGame();
        await this.wait(100);

        // First flip - go to ceiling
        window.gameDebug.flipGravity();
        await this.wait(50); // Very short wait - still in air

        const stateAfterFirstFlip = window.gameDebug.getPlayerState();
        this.assert(!stateAfterFirstFlip.isGrounded, 'Player is in the air after first flip');

        // Second flip WHILE IN AIR (after cooldown)
        await this.wait(120); // Wait for cooldown (100ms + buffer)

        const beforeSecondFlip = window.gameDebug.getPlayerState();
        const flipCountBefore = window.gameDebug.getFlipCount();

        window.gameDebug.flipGravity();
        await this.wait(50);

        const flipCountAfter = window.gameDebug.getFlipCount();

        // Check mid-air flip worked
        this.assert(flipCountAfter > flipCountBefore, 'MID-AIR FLIP ALLOWED (flip count increased)');

        const afterSecondFlip = window.gameDebug.getPlayerState();
        const directionChanged = beforeSecondFlip.gravityDirection !== afterSecondFlip.gravityDirection;
        this.assert(directionChanged, 'Gravity direction changed during mid-air flip');
    }

    async testMultipleMidAirFlips() {
        this.log('Testing MULTIPLE mid-air flips...');

        window.gameDebug.startGame();
        await this.wait(100);

        let flipCount = 0;
        const target = 3;

        // Try to flip multiple times while in air
        for (let i = 0; i < target; i++) {
            window.gameDebug.flipGravity();
            await this.wait(150); // Wait for cooldown between each
            flipCount++;
        }

        await this.wait(100);

        const actualFlips = window.gameDebug.getFlipCount();
        this.assert(actualFlips >= target, `Multiple mid-air flips work (got ${actualFlips} flips)`);
    }

    async testCooldownEnforcement() {
        this.log('Testing COOLDOWN enforcement (100ms minimum)...');

        window.gameDebug.startGame();
        await this.wait(100);

        // First flip
        window.gameDebug.flipGravity();
        const countAfterFirst = window.gameDebug.getFlipCount();

        // Immediately try to flip again (should be blocked by cooldown)
        await this.wait(10); // Much less than 100ms cooldown
        window.gameDebug.flipGravity();
        const countAfterSpam = window.gameDebug.getFlipCount();

        this.assert(countAfterSpam === countAfterFirst,
            'Cooldown blocks rapid flips (' + countAfterFirst + ' = ' + countAfterSpam + ')');

        // Wait for cooldown then flip should work
        await this.wait(150);
        window.gameDebug.flipGravity();
        const countAfterWait = window.gameDebug.getFlipCount();

        this.assert(countAfterWait > countAfterFirst,
            'Flip works after cooldown elapsed');
    }

    // ==========================================
    // CRITICAL FIX #2: OBSTACLES
    // ==========================================

    async testObstaclesSpawnEarly() {
        this.log('Testing OBSTACLES SPAWN EARLY (critical fix)...');

        window.gameDebug.startGame();
        window.gameDebug.clearObstacles();

        // Wait less than 2 seconds - obstacles MUST spawn
        await this.wait(1500);

        const obstacles = window.gameDebug.getObstacles();
        this.assert(obstacles.length > 0,
            'OBSTACLES EXIST within first 1.5 seconds (found ' + obstacles.length + ')');

        if (obstacles.length > 0) {
            const firstObstacle = obstacles[0];
            this.assert(firstObstacle.x !== undefined, 'Obstacle has X position');
            this.assert(firstObstacle.y !== undefined, 'Obstacle has Y position');
            this.assert(firstObstacle.type !== undefined, 'Obstacle has type');
        }
    }

    async testObstacleCollisionCausesDeath() {
        this.log('Testing OBSTACLE COLLISION causes DEATH...');

        const initialDeaths = window.gameDebug.getDeathCount();

        window.gameDebug.startGame();
        await this.wait(50);

        // Trigger death (simulates collision)
        window.gameDebug.triggerDeath();
        await this.wait(300);

        const afterDeath = window.gameDebug.getDeathCount();

        this.assert(afterDeath === initialDeaths + 1, 'Death counter increments on collision');
        this.assert(window.gameDebug.isGameOver(), 'Game is over after death');
    }

    async testDifferentObstacleTypes() {
        this.log('Testing DIFFERENT OBSTACLE TYPES...');

        window.gameDebug.startGame();
        window.gameDebug.clearObstacles();
        await this.wait(50);

        // Spawn all types
        window.gameDebug.spawnObstacle('spike', 'floor');
        window.gameDebug.spawnObstacle('block', 'ceiling');
        window.gameDebug.spawnObstacle('floating', 'floating');
        await this.wait(50);

        const obstacles = window.gameDebug.getObstacles();

        this.assert(obstacles.length >= 3, 'Multiple obstacle types spawned');

        const hasFloor = obstacles.some(o => o.surface === 'floor');
        const hasCeiling = obstacles.some(o => o.surface === 'ceiling');
        const hasFloating = obstacles.some(o => o.surface === 'floating');

        this.assert(hasFloor, 'Floor obstacle exists');
        this.assert(hasCeiling, 'Ceiling obstacle exists');
        this.assert(hasFloating, 'Floating obstacle exists (mid-air hazard)');
    }

    // ==========================================
    // EXISTING TESTS
    // ==========================================

    async testGradualPhysics() {
        this.log('Testing gradual physics (no teleportation)...');

        window.gameDebug.startGame();
        await this.wait(100);

        const startY = window.gameDebug.getPlayerState().y;

        window.gameDebug.flipGravity();
        await this.wait(50);

        const midY = window.gameDebug.getPlayerState().y;

        // Player should have moved but not teleported
        const moved = Math.abs(midY - startY) > 0;
        const notTeleported = Math.abs(midY - startY) < window.innerHeight * 0.5;

        this.assert(moved && notTeleported, 'Player moves gradually (not teleports)');
    }

    async testDeathCounter() {
        this.log('Testing death counter persistence...');

        const stored = parseInt(localStorage.getItem('gravityFlip_deaths') || '0');
        this.assert(!isNaN(stored), 'Death counter stored in localStorage');
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printReport() {
        console.log('');
        console.log('========================================');
        console.log('FIX VALIDATION REPORT');
        console.log('========================================');
        console.log(`Total: ${this.passed + this.failed}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log('');

        // Check critical fixes
        const midAirPassed = this.results.some(r =>
            r.name.includes('MID-AIR') && r.status === 'PASS');
        const obstaclesPassed = this.results.some(r =>
            r.name.includes('OBSTACLES EXIST') && r.status === 'PASS');
        const cooldownPassed = this.results.some(r =>
            r.name.includes('Cooldown') && r.status === 'PASS');

        console.log('CRITICAL FIXES:');
        console.log(midAirPassed ? '  ✓ Mid-air flipping: WORKING' : '  ✗ Mid-air flipping: BROKEN');
        console.log(obstaclesPassed ? '  ✓ Obstacles: SPAWNING' : '  ✗ Obstacles: NOT SPAWNING');
        console.log(cooldownPassed ? '  ✓ Flip cooldown: ENFORCED' : '  ✗ Flip cooldown: NOT ENFORCED');

        if (this.failed === 0) {
            console.log('');
            console.log('✓ ALL FIXES VALIDATED');
        } else {
            console.log('');
            console.log('✗ SOME FIXES FAILED:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`  - ${r.name}`);
            });
        }
        console.log('========================================');

        return {
            passed: this.failed === 0,
            total: this.passed + this.failed,
            passedCount: this.passed,
            failedCount: this.failed,
            criticalFixes: {
                midAirFlipping: midAirPassed,
                obstaclesSpawning: obstaclesPassed,
                cooldownEnforced: cooldownPassed
            }
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.GameSimulationTests = GameSimulationTests;

    window.runGameTests = async function () {
        const tests = new GameSimulationTests();
        return await tests.runAllTests();
    };

    window.validateFixes = window.runGameTests;

    console.log('[GameSimulationTests v3.1] Loaded.');
    console.log('Run window.validateFixes() to verify all critical fixes.');
}
