/**
 * Gravity Flip v3.0 - Complete Game Overhaul
 * 
 * PHYSICS: Gradual velocity-based gravity flip (no teleporting)
 * PLAYER: Human-like running character
 * OBSTACLES: Floor, ceiling, and mid-air hazards
 * AUDIO: Techno background music with mute control
 */

// ==========================================
// GAME CONFIGURATION
// ==========================================
const CONFIG = {
    // Physics - HARDER: Faster gravity, less float time
    GRAVITY: 1.2,                    // Increased gravity (was 0.8)
    FLIP_VELOCITY: 18,               // Higher flip velocity (was 15)
    MAX_VELOCITY: 22,                // Higher max velocity (was 18)

    // Player
    PLAYER_WIDTH: 30,
    PLAYER_HEIGHT: 45,               // Slightly shorter player
    PLAYER_X_POSITION: 150,

    // Surfaces - MUCH BIGGER = Less vertical space = Can't hover
    FLOOR_HEIGHT: 150,               // Was 60 - now takes more screen
    CEILING_HEIGHT: 150,             // Was 60 - now takes more screen

    // Obstacles - Bigger and deadlier
    OBSTACLE_TYPES: ['spike', 'block', 'floating'],
    SPIKE_WIDTH: 35,                 // Wider (was 30)
    SPIKE_HEIGHT: 50,                // Taller (was 40)
    BLOCK_WIDTH: 55,                 // Wider (was 50)
    BLOCK_HEIGHT: 55,                // Taller (was 50)
    FLOATING_WIDTH: 70,              // Wider (was 60)
    FLOATING_HEIGHT: 40,             // Taller (was 30)

    // Speed & Difficulty - FASTER
    BASE_SPEED: 6,                   // Faster start (was 5)
    MAX_SPEED: 14,                   // Faster max (was 12)
    SPEED_INCREMENT: 0.0005,         // Speed up faster (was 0.0003)

    // Flip cooldown (allows mid-air flips)
    FLIP_COOLDOWN: 100, // milliseconds between flips

    // Spawn rates - MORE OBSTACLES
    INITIAL_SPAWN_RATE: 600,         // Faster spawning (was 800)
    MIN_SPAWN_RATE: 350,             // More frequent (was 500)
    SPAWN_RATE_DECREASE: 0.3,        // Get harder faster (was 0.2)
    FIRST_OBSTACLE_DELAY: 500,       // First obstacle sooner (was 1000)

    // Game
    DEATHS_PER_AD: 5,

    // Animation
    RUN_ANIMATION_SPEED: 80,          // Faster animation (was 100)

    // Level System - Dynamic: Level 1 = 500pts, Level 2 = 1000pts, etc.
    BASE_POINTS_PER_LEVEL: 500,       // Level N requires N * 500 points
    MAX_LEVEL: 10,                    // Maximum level (win condition)
    LEVEL_TRANSITION_DURATION: 2000,  // ms to show level complete screen

    // Difficulty scaling per level (multipliers)
    LEVEL_SPEED_MULTIPLIER: 1.15,     // Each level is 15% faster
    LEVEL_SPAWN_MULTIPLIER: 0.85,     // Each level spawns 15% more often
    LEVEL_OBSTACLE_SIZE_MULTIPLIER: 1.1, // Each level has 10% bigger obstacles

    // Respawn System
    RESPAWN_FREEZE_DURATION: 3000,    // 3 seconds freeze after respawn

    // Power-Up System (Coin-based - single power-up only)
    COIN_SPAWN_CHANCE: 0.05,          // 5% chance to spawn a coin
    COIN_SPAWN_COOLDOWN: 5000,        // Minimum 5 seconds between coins
    COIN_SIZE: 40,                    // Coin diameter in pixels
    POWER_UP_DURATION: 5000,          // Power-ups last 5 seconds
    POWER_UP_POPUP_DURATION: 2000,    // Show popup for 2 seconds
    POWER_UP_TYPES: ['shield', 'slowmo', 'magnet'],
    POWER_UP_NAMES: {
        shield: '🛡️ SHIELD!',
        slowmo: '🐢 SLOW-MO!',
        magnet: '🧲 MAGNET!'
    },

    // Base Resolution (aspect ratio = 16:9)
    // Game is designed at this resolution; scales to fit screen
    BASE_WIDTH: 1280,
    BASE_HEIGHT: 720,
    TARGET_ASPECT_RATIO: 16 / 9
};

// Neon Cyber-Drift Themes
const THEMES = [
    {
        bg: '#050011',
        floor: '#1a0033',
        ceiling: '#1a0033',
        floorAccent: '#00f3ff', // Cyan
        ceilingAccent: '#bc13fe', // Purple
        player: '#00f3ff', // Cyan Outline/Glow
        playerSkin: '#e0f7fa', // Pale Cyan Skin (Glowing)
        playerShirt: '#bc13fe', // Purple Shirt
        obstacle: '#ff0055', // Hot Red/Pink
        floatingObstacle: '#ffee00' // Yellow
    },
    {
        bg: '#000511',
        floor: '#001a33',
        ceiling: '#001a33',
        floorAccent: '#bc13fe', // Purple
        ceilingAccent: '#00ff9d', // Green
        player: '#bc13fe',
        playerSkin: '#f3e5f5', // Pale Purple Skin
        playerShirt: '#00ff9d', // Green Shirt
        obstacle: '#00ff9d', // Green
        floatingObstacle: '#00f3ff' // Cyan
    },
    {
        bg: '#110005',
        floor: '#33001a',
        ceiling: '#33001a',
        floorAccent: '#ff0055', // Red
        ceilingAccent: '#ffee00', // Yellow
        player: '#ff0055',
        playerSkin: '#ffebee', // Pale Red Skin
        playerShirt: '#ffee00', // Yellow Shirt
        obstacle: '#ffee00', // Yellow
        floatingObstacle: '#bc13fe' // Purple
    }
];

// ==========================================
// AUDIO MANAGER
// ==========================================
class AudioManager {
    constructor() {
        this.isMuted = localStorage.getItem('gravityFlip_muted') === 'true';
        this.audioContext = null;
        this.musicGain = null;
        this.isPlaying = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.musicGain.gain.value = this.isMuted ? 0 : 0.3;

            // Initialize global filter for low-pass effect (muffling on death/pause)
            this.globalFilter = this.audioContext.createBiquadFilter();
            this.globalFilter.type = 'lowpass';
            this.globalFilter.frequency.value = 22050; // Fully open
            this.globalFilter.connect(this.musicGain);

            this.initialized = true;

            // Generate procedural 8-Bit Chiptune
            this.startChiptuneMusic();

            console.log('[AudioManager] Initialized (Synthwave Mode)');
        } catch (e) {
            console.warn('[AudioManager] Failed to initialize:', e);
        }
    }

    startChiptuneMusic() {
        // Renamed but now plays Synthwave
        if (!this.audioContext || this.isPlaying) return;

        this.isPlaying = true;
        this.playSynthwaveLoop();
    }

    playSynthwaveLoop() {
        if (!this.audioContext || !this.isPlaying) return;

        const now = this.audioContext.currentTime;
        const bpm = 100; // Classic synthwave tempo
        const beatDuration = 60 / bpm;

        // Warm pad chord (sustained background)
        this.playWarmPad(now, beatDuration * 4);

        // Deep rolling bass (arpeggio style)
        const bassNotes = [55, 55, 73.42, 73.42, 82.41, 82.41, 65.41, 65.41]; // A1, D2, E2, C2 progression
        for (let i = 0; i < 8; i++) {
            const bassFreq = bassNotes[i % bassNotes.length];
            this.playDeepBass(bassFreq, now + i * beatDuration / 2, beatDuration / 2);
        }

        // Kick on 1 and 3
        this.playSynthKick(now);
        this.playSynthKick(now + beatDuration * 2);

        // Gated snare on 2 and 4
        this.playGatedSnare(now + beatDuration);
        this.playGatedSnare(now + beatDuration * 3);

        // Soft hi-hats
        for (let i = 0; i < 8; i++) {
            this.playSoftHiHat(now + i * beatDuration / 2);
        }

        // Schedule next loop
        setTimeout(() => this.playSynthwaveLoop(), beatDuration * 4 * 1000);
    }

    playWarmPad(time, duration) {
        // Two detuned sawtooth oscillators for warmth
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, time); // A3
        osc2.frequency.setValueAtTime(220 * 1.005, time); // Slightly detuned for chorus

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.Q.value = 1;

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.setValueAtTime(0.08, time + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0.01, time + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.globalFilter);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
    }

    playDeepBass(freq, time, duration) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, time);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.linearRampToValueAtTime(0.1, time + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0.01, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.globalFilter);

        osc.start(time);
        osc.stop(time + duration);
    }

    playSynthKick(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.connect(gain);
        gain.connect(this.globalFilter);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    playGatedSnare(time) {
        // Classic 80s gated reverb snare: noise burst with sharp cutoff
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Quick attack, sustain, abrupt gate
            const env = i < bufferSize * 0.1 ? i / (bufferSize * 0.1) :
                i < bufferSize * 0.7 ? 1 :
                    Math.pow(1 - (i - bufferSize * 0.7) / (bufferSize * 0.3), 3);
            data[i] = (Math.random() * 2 - 1) * env;
        }

        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.5;

        gain.gain.setValueAtTime(0.4, time);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.globalFilter);

        source.start(time);
    }

    playSoftHiHat(time) {
        const bufferSize = this.audioContext.sampleRate * 0.04;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }

        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.globalFilter);

        source.start(time);
    }

    setLowPass(active) {
        if (!this.globalFilter) return;

        const targetFreq = active ? 200 : 22050;
        const now = this.audioContext.currentTime;

        this.globalFilter.frequency.cancelScheduledValues(now);
        this.globalFilter.frequency.exponentialRampToValueAtTime(Math.max(targetFreq, 100), now + 0.5);
    }

    playDeathSound() {
        if (!this.audioContext || this.isMuted) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // 8-Bit Death: Sawtooth/Square drop
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.4);

        // Noise burst overlay for "crunch"
        const noiseNodes = this.createNoiseBurst(this.audioContext.currentTime, 0.4);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }

    // Helper for noise generation (used by death sound)
    createNoiseBurst(time, duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.2, time);
        noiseGain.gain.linearRampToValueAtTime(0.01, time + duration);

        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start(time);
        return { noise, noiseGain };
    }

    playFlipSound() {
        if (!this.audioContext || this.isMuted) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // 8-Bit Jump Sound: Square wave with rapid sliding pitch
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('gravityFlip_muted', this.isMuted.toString());

        if (this.musicGain) {
            this.musicGain.gain.value = this.isMuted ? 0 : 0.3;
        }

        return this.isMuted;
    }

    getMuteState() {
        return this.isMuted;
    }
}

// ==========================================
// GAME STATE
// ==========================================
class GameState {
    constructor() {
        this.reset();
        this.totalDeaths = parseInt(localStorage.getItem('gravityFlip_deaths') || '0');
        this.highScore = parseInt(localStorage.getItem('gravityFlip_highScore') || '0');
        this.highestLevel = parseInt(localStorage.getItem('gravityFlip_highLevel') || '1');
        this.extraLives = parseInt(localStorage.getItem('gravityFlip_extraLives') || '0');
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isLevelTransition = false;
        this.isRespawnFreeze = false;      // Respawn invincibility state
        this.respawnFreezeEndTime = 0;
        this.score = 0;              // Total score (carries over)
        this.levelScore = 0;         // Score within current level
        this.distance = 0;
        this.flipCount = 0;
        this.level = 1;
        this.themeIndex = 0;

        // Calculate initial difficulty based on level
        this.updateDifficultyForLevel();
    }

    updateDifficultyForLevel() {
        // Each level gets progressively harder
        const levelMultiplier = Math.pow(CONFIG.LEVEL_SPEED_MULTIPLIER, this.level - 1);
        const spawnMultiplier = Math.pow(CONFIG.LEVEL_SPAWN_MULTIPLIER, this.level - 1);

        this.currentSpeed = CONFIG.BASE_SPEED * levelMultiplier;
        this.currentSpawnRate = CONFIG.INITIAL_SPAWN_RATE * spawnMultiplier;

        // Cap values
        this.currentSpeed = Math.min(this.currentSpeed, CONFIG.MAX_SPEED);
        this.currentSpawnRate = Math.max(this.currentSpawnRate, CONFIG.MIN_SPAWN_RATE);
    }

    getObstacleSizeMultiplier() {
        return Math.pow(CONFIG.LEVEL_OBSTACLE_SIZE_MULTIPLIER, this.level - 1);
    }

    advanceLevel() {
        if (this.level < CONFIG.MAX_LEVEL) {
            this.level++;
            this.levelScore = 0;
            this.updateDifficultyForLevel();

            // Update highest level
            if (this.level > this.highestLevel) {
                this.highestLevel = this.level;
                localStorage.setItem('gravityFlip_highLevel', this.highestLevel.toString());
            }

            return true;
        }
        return false; // Already at max level (you win!)
    }

    incrementDeaths() {
        this.totalDeaths++;
        localStorage.setItem('gravityFlip_deaths', this.totalDeaths.toString());
    }

    updateHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('gravityFlip_highScore', this.highScore.toString());
            return true;
        }
        return false;
    }

    shouldShowAd() {
        return this.totalDeaths > 0 && this.totalDeaths % CONFIG.DEATHS_PER_AD === 0;
    }

    addExtraLife() {
        this.extraLives++;
        localStorage.setItem('gravityFlip_extraLives', this.extraLives.toString());
    }

    useExtraLife() {
        if (this.extraLives > 0) {
            this.extraLives--;
            localStorage.setItem('gravityFlip_extraLives', this.extraLives.toString());
            return true;
        }
        return false;
    }

    hasExtraLife() {
        return this.extraLives > 0;
    }
}

// ==========================================
// PLAYER CLASS - HUMAN CHARACTER
// ==========================================
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.trail = []; // Ghost trail history
        this.trailTimer = 0;
        this.reset();
    }

    reset() {
        this.x = CONFIG.PLAYER_X_POSITION;
        this.gravityDirection = 1; // 1 = down, -1 = up
        this.velocityY = 0;
        this.isFlipping = false;
        this.isGrounded = true;
        this.lastFlipTime = 0; // For cooldown tracking

        // Start on floor
        this.y = this.canvas.height - CONFIG.FLOOR_HEIGHT - this.height;

        // Animation
        this.runFrame = 0;
        this.lastFrameTime = 0;
        this.rotation = 0;
        this.trail = [];
    }

    flip(currentTime) {
        // ALLOW MID-AIR FLIPS with cooldown
        const timeSinceLastFlip = currentTime - this.lastFlipTime;
        if (timeSinceLastFlip < CONFIG.FLIP_COOLDOWN) {
            return false; // Cooldown not elapsed
        }

        // FIXED: Apply velocity FIRST in the correct direction, THEN flip gravity
        // If going UP to ceiling: need negative velocity
        // If going DOWN to floor: need positive velocity
        if (this.gravityDirection === 1) {
            // Currently on floor, flip to ceiling = go UP (negative Y)
            this.velocityY = -CONFIG.FLIP_VELOCITY;
        } else {
            // Currently on ceiling, flip to floor = go DOWN (positive Y)
            this.velocityY = CONFIG.FLIP_VELOCITY;
        }

        this.gravityDirection *= -1;
        this.isFlipping = true;
        this.isGrounded = false;
        this.lastFlipTime = currentTime;

        return true;
    }

    update(deltaTime, currentTime) {
        // Apply gravity (GRADUAL movement)
        this.velocityY += CONFIG.GRAVITY * this.gravityDirection;

        // Cap velocity
        this.velocityY = Math.max(-CONFIG.MAX_VELOCITY, Math.min(CONFIG.MAX_VELOCITY, this.velocityY));

        // Update position (GRADUAL - player moves through space)
        this.y += this.velocityY;

        // Floor boundary
        const floorY = this.canvas.height - CONFIG.FLOOR_HEIGHT - this.height;
        if (this.y >= floorY && this.gravityDirection === 1) {
            this.y = floorY;
            this.velocityY = 0;
            this.isFlipping = false;
            this.isGrounded = true;
        }

        // Ceiling boundary
        const ceilingY = CONFIG.CEILING_HEIGHT;
        if (this.y <= ceilingY && this.gravityDirection === -1) {
            this.y = ceilingY;
            this.velocityY = 0;
            this.isFlipping = false;
            this.isGrounded = true;
        }

        // Rotation interpolation
        const targetRotation = this.gravityDirection === 1 ? 0 : Math.PI;
        this.rotation += (targetRotation - this.rotation) * 0.15;

        // Running animation
        if (currentTime - this.lastFrameTime > CONFIG.RUN_ANIMATION_SPEED) {
            this.runFrame = (this.runFrame + 1) % 4;
            this.lastFrameTime = currentTime;
        }

        // Update trail
        this.trailTimer += deltaTime;
        if (this.trailTimer > 50) { // Add trail point every 50ms
            this.trail.push({ x: this.x, y: this.y, rotation: this.rotation, runFrame: this.runFrame, alpha: 0.6 });
            if (this.trail.length > 5) this.trail.shift();
            this.trailTimer = 0;
        }
    }

    draw(ctx, theme) {
        // Draw Ghost Trail
        this.drawTrail(ctx, theme);

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Draw Human Character (Neon Style)
        this.drawHuman(ctx, theme);

        ctx.restore();
    }

    drawTrail(ctx, theme) {
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.save();
            ctx.translate(point.x + this.width / 2, point.y + this.height / 2);
            ctx.rotate(point.rotation);
            ctx.globalAlpha = point.alpha * 0.3; // Faint trail

            // Draw simplified human for trail (re-use frame data)
            // Hack to temporarily set runFrame for drawing
            const currentFrame = this.runFrame;
            this.runFrame = point.runFrame;

            // Draw silhouette
            ctx.shadowBlur = 0;
            ctx.fillStyle = theme.player;
            // Simplified drawing for performance: just box or main body? 
            // Let's use full human but simpler colors
            this.drawHuman(ctx, theme, true); // true = outline/silhouette mode

            this.runFrame = currentFrame; // Restore

            ctx.restore();

            // Fade trail points
            point.alpha -= 0.02;
        }
        // Clean up invisible points
        this.trail = this.trail.filter(p => p.alpha > 0);
    }

    // Pass 'isTrail' to potentially simplify drawing for trails
    drawHuman(ctx, theme, isTrail = false) {
        const w = this.width;
        const h = this.height;

        // Apply Neon Glows if main player
        if (!isTrail) {
            ctx.shadowColor = theme.player;
            ctx.shadowBlur = 15;
        }

        // Body Dimensions
        const headRadius = 8;
        const bodyHeight = 18;
        const bodyWidth = 10;
        const limbWidth = 4;
        const limbLength = 14;

        // Draw from Center
        // Head
        ctx.fillStyle = isTrail ? theme.player : theme.playerSkin;
        ctx.beginPath();
        ctx.arc(0, -h / 2 + headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Torso
        ctx.fillStyle = isTrail ? theme.player : theme.playerShirt;
        ctx.fillRect(-bodyWidth / 2, -h / 2 + headRadius * 2 - 2, bodyWidth, bodyHeight);

        // Arms and Legs Animation
        const swing = Math.sin(this.runFrame * Math.PI / 2) * 20;

        ctx.fillStyle = isTrail ? theme.player : theme.playerSkin;

        // Legs
        ctx.save();
        ctx.translate(0, -h / 2 + headRadius * 2 + bodyHeight - 4);

        // Left Leg
        ctx.save();
        ctx.rotate(swing * Math.PI / 180);
        ctx.fillRect(-limbWidth / 2, 0, limbWidth, limbLength);
        ctx.restore();

        // Right Leg
        ctx.save();
        ctx.rotate(-swing * Math.PI / 180);
        ctx.fillRect(-limbWidth / 2, 0, limbWidth, limbLength);
        ctx.restore();

        ctx.restore();

        // Arms
        ctx.fillStyle = isTrail ? theme.player : theme.playerShirt;
        ctx.save();
        ctx.translate(0, -h / 2 + headRadius * 2 + 2);

        // Left Arm
        ctx.save();
        ctx.translate(-bodyWidth / 2, 2);
        ctx.rotate(-swing * Math.PI / 180);
        ctx.fillRect(-limbWidth, 0, limbWidth, limbLength - 2);
        ctx.restore();

        // Right Arm
        ctx.save();
        ctx.translate(bodyWidth / 2, 2);
        ctx.rotate(swing * Math.PI / 180);
        ctx.fillRect(0, 0, limbWidth, limbLength - 2);
        ctx.restore();

        ctx.restore();

        ctx.shadowBlur = 0; // Reset
    }

    drawHuman(ctx, theme) {
        const w = this.width;
        const h = this.height;

        // Glow effect
        ctx.shadowColor = theme.player;
        ctx.shadowBlur = 10;

        // Head
        ctx.fillStyle = theme.playerSkin;
        ctx.beginPath();
        ctx.arc(0, -h / 2 + 8, 8, 0, Math.PI * 2);
        ctx.fill();

        // Body/Torso
        ctx.fillStyle = theme.playerShirt;
        ctx.fillRect(-w / 4, -h / 2 + 16, w / 2, h / 3);

        // Legs (animated)
        ctx.fillStyle = '#333';
        const legOffset = Math.sin(this.runFrame * Math.PI / 2) * 6;

        // Left leg
        ctx.fillRect(-w / 4, -h / 2 + 16 + h / 3, 5, h / 3 + legOffset);

        // Right leg
        ctx.fillRect(w / 4 - 5, -h / 2 + 16 + h / 3, 5, h / 3 - legOffset);

        // Arms (animated)
        ctx.fillStyle = theme.playerSkin;
        const armSwing = Math.sin(this.runFrame * Math.PI / 2) * 15;

        ctx.save();
        ctx.translate(-w / 3, -h / 2 + 20);
        ctx.rotate(armSwing * Math.PI / 180);
        ctx.fillRect(-2, 0, 4, 15);
        ctx.restore();

        ctx.save();
        ctx.translate(w / 3, -h / 2 + 20);
        ctx.rotate(-armSwing * Math.PI / 180);
        ctx.fillRect(-2, 0, 4, 15);
        ctx.restore();

        ctx.shadowBlur = 0;
    }

    getBounds() {
        // Slightly smaller hitbox for fairness
        const padding = 4;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }

    // For testing: get current Y velocity
    getVelocityY() {
        return this.velocityY;
    }
}

// ==========================================
// OBSTACLE CLASSES
// ==========================================
class Obstacle {
    constructor(canvas, type, surface) {
        this.canvas = canvas;
        this.type = type; // 'spike', 'block', 'floating'
        this.surface = surface; // 'floor', 'ceiling', 'floating'
        this.passed = false;

        // Position at right edge
        this.x = canvas.width + 50;

        // Set dimensions based on type
        switch (type) {
            case 'spike':
                this.width = CONFIG.SPIKE_WIDTH;
                this.height = CONFIG.SPIKE_HEIGHT;
                break;
            case 'block':
                this.width = CONFIG.BLOCK_WIDTH;
                this.height = CONFIG.BLOCK_HEIGHT;
                break;
            case 'floating':
                this.width = CONFIG.FLOATING_WIDTH;
                this.height = CONFIG.FLOATING_HEIGHT;
                break;
        }

        // Set Y position based on surface
        this.calculateY();
    }

    calculateY() {
        switch (this.surface) {
            case 'floor':
                this.y = this.canvas.height - CONFIG.FLOOR_HEIGHT - this.height;
                break;
            case 'ceiling':
                this.y = CONFIG.CEILING_HEIGHT;
                break;
            case 'floating':
                // Random position in the middle zone
                const minY = CONFIG.CEILING_HEIGHT + 50;
                const maxY = this.canvas.height - CONFIG.FLOOR_HEIGHT - this.height - 50;
                this.y = minY + Math.random() * (maxY - minY);
                break;
        }
    }

    update(speed) {
        this.x -= speed;
    }

    draw(ctx, theme) {
        ctx.save();

        if (this.type === 'floating') {
            ctx.fillStyle = theme.floatingObstacle;
        } else {
            ctx.fillStyle = theme.obstacle;
        }

        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;

        switch (this.type) {
            case 'spike':
                this.drawSpike(ctx);
                break;
            case 'block':
                this.drawBlock(ctx);
                break;
            case 'floating':
                this.drawFloating(ctx);
                break;
        }

        ctx.restore();
    }

    drawSpike(ctx) {
        ctx.beginPath();
        if (this.surface === 'floor') {
            // Point up
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height);
        } else {
            // Point down
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawBlock(ctx) {
        // Rounded rectangle
        const radius = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();

        // Warning stripes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < this.height; i += 10) {
            if (i % 20 === 0) {
                ctx.fillRect(this.x, this.y + i, this.width, 5);
            }
        }
    }

    drawFloating(ctx) {
        // Diamond/hazard shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Inner pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getBounds() {
        // Slightly smaller for spikes (more forgiving)
        const padding = this.type === 'spike' ? 5 : 2;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}

// ==========================================
// OBSTACLE GENERATOR
// ==========================================
class ObstacleGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.lastObstacleX = 0;
    }

    generate(difficulty) {
        const obstacles = [];

        // Decide obstacle type based on difficulty
        const rand = Math.random();

        if (rand < 0.4) {
            // Floor obstacle
            const type = Math.random() < 0.5 ? 'spike' : 'block';
            obstacles.push(new Obstacle(this.canvas, type, 'floor'));
        } else if (rand < 0.7) {
            // Ceiling obstacle
            const type = Math.random() < 0.5 ? 'spike' : 'block';
            obstacles.push(new Obstacle(this.canvas, type, 'ceiling'));
        } else if (difficulty > 0.3) {
            // Floating obstacle (only at higher difficulty)
            obstacles.push(new Obstacle(this.canvas, 'floating', 'floating'));
        } else {
            // Default to floor
            obstacles.push(new Obstacle(this.canvas, 'spike', 'floor'));
        }

        // At high difficulty, sometimes add paired obstacles
        if (difficulty > 0.5 && Math.random() < 0.3) {
            const secondSurface = obstacles[0].surface === 'floor' ? 'ceiling' : 'floor';
            const secondObs = new Obstacle(this.canvas, 'spike', secondSurface);
            secondObs.x += 150; // Offset
            obstacles.push(secondObs);
        }

        return obstacles;
    }
}

// ==========================================
// EFFECTS SYSTEM
// ==========================================
class EffectsSystem {
    constructor() {
        this.screenShake = { x: 0, y: 0, duration: 0 };
        this.particles = [];
    }

    triggerScreenShake(intensity = 8, duration = 200) {
        this.screenShake.duration = duration;
        this.screenShake.intensity = intensity;
    }

    addDeathParticles(x, y, color) {
        // More explosion particles
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.03 + 0.01,
                color,
                size: Math.random() * 4 + 2,
                type: 'spark'
            });
        }
    }

    addImpactParticles(x, y, color) {
        // Land/Flip particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI; // Semicircle
            // Adjust angle based on floor/ceiling later if needed, general is burst
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8, // Spread X
                vy: (Math.random() - 0.5) * 8, // Spread Y
                life: 1,
                decay: Math.random() * 0.05 + 0.02,
                color,
                size: Math.random() * 3 + 1,
                type: 'dust'
            });
        }
    }

    update(deltaTime) {
        // Screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration -= deltaTime;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Gravity for sparks, not dust
            if (p.type === 'spark') p.vy += 0.2;

            p.life -= p.decay || 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            // Rotate confetti
            if (p.rotation) ctx.rotate(p.rotation);

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            // Draw square confetti
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    getShakeOffset() {
        return { x: this.screenShake.x, y: this.screenShake.y };
    }
}

// ==========================================
// MAIN GAME CLASS
// ==========================================
class GravityFlipGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize logical dimensions to base resolution
        this.logicalWidth = CONFIG.BASE_WIDTH;
        this.logicalHeight = CONFIG.BASE_HEIGHT;

        this.resizeCanvas();

        // Create a canvas-like object with base resolution for game objects
        const logicalCanvas = { width: CONFIG.BASE_WIDTH, height: CONFIG.BASE_HEIGHT };

        // Systems
        this.state = new GameState();
        this.player = new Player(logicalCanvas);
        this.obstacles = [];
        this.obstacleGenerator = new ObstacleGenerator(logicalCanvas);
        this.effects = new EffectsSystem();
        this.audio = new AudioManager();

        // Timing
        this.lastTime = 0;
        this.lastObstacleSpawn = 0;
        this.animationFrame = null;

        // Flip tracking for tests
        this.flipStartY = 0;
        this.flipFrameCount = 0;

        // DOM elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelTransition = document.getElementById('levelTransition');
        this.extraLifeOverlay = document.getElementById('extraLifeOverlay');
        this.hud = document.getElementById('hud');
        this.currentScoreEl = document.getElementById('currentScore');
        this.currentLevelEl = document.getElementById('currentLevel');
        this.extraLivesEl = document.getElementById('extraLives');
        this.finalScoreEl = document.getElementById('finalScore');
        this.highScoreEl = document.getElementById('highScore');
        this.startHighScoreEl = document.getElementById('startHighScore');
        this.deathCountEl = document.getElementById('deathCount');
        this.levelReachedEl = document.getElementById('levelReached');
        this.completedLevelEl = document.getElementById('completedLevel');
        this.nextLevelEl = document.getElementById('nextLevel');
        this.transitionScoreEl = document.getElementById('transitionScore');
        this.muteBtn = document.getElementById('muteBtn');
        this.watchAdBtn = document.getElementById('watchAdBtn');
        this.skipAdBtn = document.getElementById('skipAdBtn');
        this.readyOverlay = document.getElementById('readyOverlay');
        this.readyCountdownEl = document.getElementById('readyCountdown');
        this.powerUpPopupEl = document.getElementById('powerUpPopup');

        // Initialize power-up system
        this.initPowerUpSystem();

        // Initialize
        this.bindEvents();
        this.updateUI();
        this.setupDebugHooks();
        this.setupMuteButton();

        this.draw();

        console.log('[GravityFlipGame] v3.1 Initialized - With Power-ups');
        this._logEvent('Game initialized');
    }

    setupMuteButton() {
        if (this.muteBtn) {
            this.updateMuteButtonUI();
            this.muteBtn.addEventListener('click', () => {
                this.audio.toggleMute();
                this.updateMuteButtonUI();
            });
        }
    }

    updateMuteButtonUI() {
        if (this.muteBtn) {
            this.muteBtn.textContent = this.audio.getMuteState() ? '🔇 MUTED' : '🔊 SOUND';
            this.muteBtn.classList.toggle('muted', this.audio.getMuteState());
        }
    }

    resizeCanvas() {
        // Get available viewport dimensions
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

        // Calculate scale to fit while maintaining aspect ratio
        const scaleX = viewportWidth / CONFIG.BASE_WIDTH;
        const scaleY = viewportHeight / CONFIG.BASE_HEIGHT;

        // Use the smaller scale to ensure the game fits entirely (letterbox)
        const scale = Math.min(scaleX, scaleY);

        // Calculate the actual display size
        const displayWidth = Math.floor(CONFIG.BASE_WIDTH * scale);
        const displayHeight = Math.floor(CONFIG.BASE_HEIGHT * scale);

        // Handle device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;

        // Set canvas internal resolution (game always runs at base resolution)
        this.canvas.width = CONFIG.BASE_WIDTH * dpr;
        this.canvas.height = CONFIG.BASE_HEIGHT * dpr;

        // Set CSS display size (scaled to fit viewport)
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // Scale canvas context to match DPR
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Store dimensions for game logic (always base resolution)
        this.logicalWidth = CONFIG.BASE_WIDTH;
        this.logicalHeight = CONFIG.BASE_HEIGHT;

        // Store scale for input coordinate conversion
        this.displayScale = scale;
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;

        // Fixed Surface Heights (percentage of base height)
        const surfaceHeight = Math.floor(CONFIG.BASE_HEIGHT * 0.12); // 12% of base height
        CONFIG.FLOOR_HEIGHT = surfaceHeight;
        CONFIG.CEILING_HEIGHT = surfaceHeight;

        // Update game objects with base resolution canvas
        const logicalCanvas = { width: CONFIG.BASE_WIDTH, height: CONFIG.BASE_HEIGHT };
        if (this.player) {
            this.player.canvas = logicalCanvas;
            // Keep player in bounds
            const floorY = CONFIG.BASE_HEIGHT - CONFIG.FLOOR_HEIGHT - this.player.height;
            if (this.player.y > floorY && this.player.gravityDirection === 1) {
                this.player.y = floorY;
                this.player.velocityY = 0;
                this.player.isGrounded = true;
            }
        }
        if (this.obstacleGenerator) {
            this.obstacleGenerator.canvas = logicalCanvas;
        }

        console.log(`[Resize] Base: ${CONFIG.BASE_WIDTH}x${CONFIG.BASE_HEIGHT}, Display: ${displayWidth}x${displayHeight}, Scale: ${scale.toFixed(2)}, DPR: ${dpr}`);
    }

    bindEvents() {
        // Resize handler with debounce
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Delay to let browser finish rotation
            setTimeout(() => this.resizeCanvas(), 200);
        });

        // Visual viewport resize (for mobile address bar changes)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.handleRestart());

        // Extra life ad buttons
        if (this.watchAdBtn) {
            this.watchAdBtn.addEventListener('click', () => this.watchExtraLifeAd());
        }
        if (this.skipAdBtn) {
            this.skipAdBtn.addEventListener('click', () => this.skipExtraLifeAd());
        }

        // Share buttons
        const shareWhatsApp = document.getElementById('shareWhatsApp');
        const shareNative = document.getElementById('shareNative');
        const downloadScore = document.getElementById('downloadScore');

        if (shareWhatsApp) {
            shareWhatsApp.addEventListener('click', () => this.shareToWhatsApp());
        }
        if (shareNative) {
            shareNative.addEventListener('click', () => this.shareNative());
        }
        if (downloadScore) {
            downloadScore.addEventListener('click', () => this.downloadScoreImage());
        }

        const flipHandler = async (e) => {
            // Initialize audio on first interaction
            if (!this.audio.initialized) {
                await this.audio.init();
            }

            if (this.state.isRunning && !this.state.isPaused && !this.state.isGameOver) {
                e.preventDefault();
                this.flipGravity();
            }
        };

        this.canvas.addEventListener('click', flipHandler);
        this.canvas.addEventListener('touchstart', flipHandler, { passive: false });

        document.addEventListener('keydown', async (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();

                if (!this.audio.initialized) {
                    await this.audio.init();
                }

                if (this.state.isRunning && !this.state.isPaused && !this.state.isGameOver) {
                    this.flipGravity();
                } else if (!this.state.isRunning && !this.gameOverScreen.classList.contains('hidden')) {
                    this.handleRestart();
                } else if (!this.state.isRunning) {
                    this.startGame();
                }
            }
        });
    }

    setupDebugHooks() {
        window.gameDebug = {
            // State getters
            getPlayerState: () => ({
                x: this.player.x,
                y: this.player.y,
                velocityY: this.player.velocityY,
                gravityDirection: this.player.gravityDirection,
                isFlipping: this.player.isFlipping,
                isGrounded: this.player.isGrounded
            }),
            getDeathCount: () => this.state.totalDeaths,
            getScore: () => this.state.score,
            getHighScore: () => this.state.highScore,
            getPlayerSurface: () => this.player.gravityDirection === 1 ? 'floor' : 'ceiling',
            isRunning: () => this.state.isRunning,
            isPaused: () => this.state.isPaused,
            isGameOver: () => this.state.isGameOver,
            getSpeed: () => this.state.currentSpeed,
            getFlipCount: () => this.state.flipCount,
            getVelocityY: () => this.player.velocityY,

            // Actions
            flipGravity: () => this.flipGravity(),
            triggerDeath: () => this.handleDeath(),
            startGame: () => this.startGame(),
            restartGame: () => this.handleRestart(),

            // Obstacle info
            getObstacles: () => this.obstacles.map(o => ({
                x: o.x,
                y: o.y,
                type: o.type,
                surface: o.surface,
                width: o.width,
                height: o.height
            })),

            spawnObstacle: (type, surface) => {
                this.obstacles.push(new Obstacle(this.canvas, type || 'spike', surface || 'floor'));
            },
            clearObstacles: () => {
                this.obstacles = [];
            },

            // Flip tracking for tests
            getFlipFrameCount: () => this.flipFrameCount,
            getFlipStartY: () => this.flipStartY,

            // Audio
            isMuted: () => this.audio.getMuteState(),
            toggleMute: () => this.audio.toggleMute(),

            adDisplayed: false,
            lastAdId: null,
            config: CONFIG
        };

        console.log('[GravityFlipGame] Debug hooks available at window.gameDebug');
    }

    updateUI() {
        if (this.startHighScoreEl) {
            this.startHighScoreEl.textContent = this.state.highScore;
        }
    }

    async startGame() {
        // Initialize audio
        if (!this.audio.initialized) {
            await this.audio.init();
        }

        this.state.reset();
        this.state.isRunning = true;
        this.player.reset();
        this.obstacles = [];
        this.coins = [];  // Clear coins
        this.clearAllPowerUps();  // Clear any active power-ups
        this.lastObstacleSpawn = performance.now();
        this.lastCoinSpawn = 0;  // Reset coin spawn cooldown
        this.lastTime = performance.now();

        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');

        // Update lives display
        this.updateLivesDisplay();

        // Spawn first obstacle quickly so player sees danger early
        setTimeout(() => {
            if (this.state.isRunning && this.obstacles.length === 0) {
                const newObstacles = this.obstacleGenerator.generate(0);
                this.obstacles.push(...newObstacles);
                this._logEvent('First obstacle spawned');
            }
        }, CONFIG.FIRST_OBSTACLE_DELAY);

        this._logEvent('Game started');
        this.gameLoop(performance.now());
    }

    flipGravity() {
        const currentTime = performance.now();
        if (this.player.flip(currentTime)) {
            this.state.flipCount++;
            this.flipStartY = this.player.y;
            this.flipFrameCount = 0;

            this.audio.playFlipSound();

            // Flip Particles
            const theme = THEMES[this.state.themeIndex];
            this.effects.addImpactParticles(this.player.x + this.player.width / 2, this.player.y + (this.player.gravityDirection === 1 ? 0 : this.player.height), theme.player);

            if (this.flipCountEl) {
                this.flipCountEl.textContent = this.state.flipCount;
            }

            this._logEvent('Gravity flipped (mid-air: ' + !this.player.isGrounded + '), velocityY: ' + this.player.velocityY);
        }
    }

    gameLoop(currentTime) {
        // Don't run game loop during respawn freeze
        if (!this.state.isRunning || this.state.isPaused || this.state.isLevelTransition || this.state.isRespawnFreeze) return;

        const deltaTime = Math.min(currentTime - this.lastTime, 32); // Cap delta
        this.lastTime = currentTime;

        this.update(deltaTime, currentTime);
        this.draw();

        if (!this.state.isGameOver && !this.state.isLevelTransition) {
            this.animationFrame = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(deltaTime, currentTime) {
        // Track flip frames (for testing gradual movement)
        if (this.player.isFlipping) {
            this.flipFrameCount++;
        }

        // Update player (GRADUAL physics)
        this.player.update(deltaTime, currentTime);

        // Increase difficulty
        this.state.currentSpeed = Math.min(
            CONFIG.MAX_SPEED,
            this.state.currentSpeed + CONFIG.SPEED_INCREMENT * deltaTime
        );
        this.state.currentSpawnRate = Math.max(
            CONFIG.MIN_SPAWN_RATE,
            this.state.currentSpawnRate - CONFIG.SPAWN_RATE_DECREASE * deltaTime
        );

        // Update score and level score
        this.state.distance += this.state.currentSpeed;
        const prevScore = this.state.score;
        this.state.score = Math.floor(this.state.distance / 10);

        // Track level-specific score
        const scoreGained = this.state.score - prevScore;
        this.state.levelScore += scoreGained;

        // Update HUD
        this.currentScoreEl.textContent = this.state.score;
        if (this.currentLevelEl) {
            this.currentLevelEl.textContent = this.state.level;
        }

        // Check for level completion (Level N requires N * 1000 points)
        const pointsNeededForLevel = this.state.level * CONFIG.BASE_POINTS_PER_LEVEL;
        if (this.state.levelScore >= pointsNeededForLevel) {
            this.handleLevelComplete();
            return; // Stop update during transition
        }

        // Change background theme based on level
        const newThemeIndex = (this.state.level - 1) % THEMES.length;
        if (newThemeIndex !== this.state.themeIndex) {
            this.state.themeIndex = newThemeIndex;
            this._logEvent('Theme changed to: ' + newThemeIndex);
        }

        // Spawn obstacles
        if (currentTime - this.lastObstacleSpawn > this.state.currentSpawnRate) {
            const difficulty = Math.min(1, this.state.distance / 30000);
            const newObstacles = this.obstacleGenerator.generate(difficulty);
            this.obstacles.push(...newObstacles);
            this.lastObstacleSpawn = currentTime;

            // Also try to spawn a coin
            this.spawnCoin();
        }

        // Update obstacles and check collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(this.state.currentSpeed);

            // Check collision (including MID-FLIP collisions!)
            if (this.checkCollision(this.player.getBounds(), obstacle.getBounds())) {
                // Shield power-up protects from one hit
                if (this.hasActivePowerUp('shield')) {
                    this._logEvent('Shield absorbed hit!');
                    this.deactivatePowerUp('shield');
                    this.obstacles.splice(i, 1);
                    this.effects.triggerScreenShake(3, 100);
                    continue;
                }

                this._logEvent('Collision detected! Player isFlipping: ' + this.player.isFlipping);
                this.handleDeath();
                return;
            }

            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
            }

            if (obstacle.isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update coins and power-ups
        this.updateCoins();

        // Update effects
        this.effects.update(deltaTime);
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    draw() {
        const theme = THEMES[this.state.themeIndex];
        const shake = this.effects.getShakeOffset();

        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Background
        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Floor
        this.ctx.fillStyle = theme.floor;
        this.ctx.fillRect(0, this.logicalHeight - CONFIG.FLOOR_HEIGHT, this.logicalWidth, CONFIG.FLOOR_HEIGHT);
        this.ctx.fillStyle = theme.floorAccent;
        this.ctx.fillRect(0, this.logicalHeight - CONFIG.FLOOR_HEIGHT, this.logicalWidth, 4);

        // Ceiling
        this.ctx.fillStyle = theme.ceiling;
        this.ctx.fillRect(0, 0, this.logicalWidth, CONFIG.CEILING_HEIGHT);
        this.ctx.fillStyle = theme.ceilingAccent;
        this.ctx.fillRect(0, CONFIG.CEILING_HEIGHT - 4, this.logicalWidth, 4);

        // Grid lines for visual reference
        this.drawGrid(theme);

        // Draw coins (rotating power-up collectibles)
        for (const coin of this.coins) {
            coin.draw(this.ctx, theme);
        }

        // Draw obstacles
        for (const obstacle of this.obstacles) {
            obstacle.draw(this.ctx, theme);
        }

        // Draw effects
        this.effects.draw(this.ctx);

        // Draw power-up auras (behind player)
        this.drawPowerUpAuras(this.ctx, theme);

        // Draw player
        this.player.draw(this.ctx, theme);

        this.ctx.restore();
    }

    drawGrid(theme) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const offset = this.state.distance % 100;
        for (let x = -offset; x < this.logicalWidth; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, CONFIG.CEILING_HEIGHT);
            this.ctx.lineTo(x, this.logicalHeight - CONFIG.FLOOR_HEIGHT);
            this.ctx.stroke();
        }
    }

    handleLevelComplete() {
        // Pause the game
        this.state.isLevelTransition = true;
        this.state.isPaused = true;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Update transition overlay
        if (this.completedLevelEl) {
            this.completedLevelEl.textContent = this.state.level;
        }
        if (this.nextLevelEl) {
            this.nextLevelEl.textContent = this.state.level + 1;
        }
        if (this.transitionScoreEl) {
            this.transitionScoreEl.textContent = this.state.score;
        }

        // Show transition overlay
        this.levelTransition.classList.remove('hidden');

        this._logEvent('Level ' + this.state.level + ' complete! Score: ' + this.state.score);

        // After delay, start next level
        setTimeout(() => {
            this.startNextLevel();
        }, CONFIG.LEVEL_TRANSITION_DURATION);
    }

    startNextLevel() {
        // Advance to next level (keeps total score!)
        if (this.state.advanceLevel()) {
            // Clear obstacles
            this.obstacles = [];

            // Reset player position
            this.player.reset();

            // Update theme for new level
            this.state.themeIndex = (this.state.level - 1) % THEMES.length;

            // Hide transition, resume game
            this.levelTransition.classList.add('hidden');
            this.state.isLevelTransition = false;
            this.state.isPaused = false;

            // Reset spawn timer
            this.lastObstacleSpawn = performance.now();
            this.lastTime = performance.now();

            // Update HUD
            if (this.currentLevelEl) {
                this.currentLevelEl.textContent = this.state.level;
            }

            this._logEvent('Starting level ' + this.state.level + ' - Speed: ' + this.state.currentSpeed.toFixed(2));

            // Resume game loop
            this.gameLoop(performance.now());
        } else {
            // You beat the game!
            this.showVictory();
        }
    }

    showVictory() {
        this.levelTransition.classList.add('hidden');
        this.state.updateHighScore(this.state.score);

        // Show game over with victory message
        this.finalScoreEl.textContent = this.state.score + ' (WINNER!)';
        this.highScoreEl.textContent = this.state.highScore;
        this.deathCountEl.textContent = this.state.totalDeaths;
        if (this.levelReachedEl) {
            this.levelReachedEl.textContent = 'MAX';
        }

        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        this._logEvent('Victory! Final score: ' + this.state.score);
    }

    handleDeath() {
        // Check if player has an extra life to use
        if (this.state.useExtraLife()) {
            this._logEvent('Extra life used! Lives remaining: ' + this.state.extraLives);
            this.updateLivesDisplay();

            // Brief pause effect
            this.effects.triggerScreenShake(5, 150);

            // Reset player position but keep score
            this.player.reset();
            this.player.velocityY = 0;  // Explicitly zero velocity
            this.player.isFlipping = false;
            this.player.isGrounded = true;
            this.obstacles = [];
            this.coins = [];  // Clear coins during respawn
            this.lastObstacleSpawn = performance.now();

            // Enter respawn freeze state (player is invincible)
            this.state.isRespawnFreeze = true;
            this.state.respawnFreezeEndTime = performance.now() + CONFIG.RESPAWN_FREEZE_DURATION;

            // Show "Ready..." overlay
            this.showReadyOverlay();

            // Start the respawn freeze loop (continues drawing but no input/collision)
            this.respawnFreezeLoop(performance.now());
            return;
        }

        this.state.isGameOver = true;
        this.state.isRunning = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Effects
        this.effects.triggerScreenShake(10, 300);
        this.effects.addDeathParticles(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            THEMES[this.state.themeIndex].obstacle
        );

        // Sound
        this.audio.playDeathSound();
        this.audio.setLowPass(true); // Muffle music on death

        // Draw death frame
        this.effects.update(16);
        this.draw();

        // Update stats
        this.state.incrementDeaths();
        this.state.updateHighScore(this.state.score);

        this._logEvent('Death count: ' + this.state.totalDeaths);

        if (this.state.shouldShowAd()) {
            this._logEvent('Ad requested');
            this.showAdThenExtraLifeOffer();
        } else {
            this.showGameOver();
        }
    }

    showAdThenExtraLifeOffer() {
        if (window.adManager && window.adManager.hasAds()) {
            this.state.isPaused = true;
            window.adManager.showAd(() => {
                this.state.isPaused = false;
                // After regular ad, show extra life offer
                this.showExtraLifeOffer();
            });
        } else {
            // No ads available, show extra life offer directly
            this.showExtraLifeOffer();
        }
    }

    showExtraLifeOffer() {
        if (this.extraLifeOverlay) {
            this.extraLifeOverlay.classList.remove('hidden');
            this._logEvent('Extra life offer shown');
        } else {
            this.showGameOver();
        }
    }

    watchExtraLifeAd() {
        this._logEvent('Watching ad for extra life...');

        // Hide the offer
        if (this.extraLifeOverlay) {
            this.extraLifeOverlay.classList.add('hidden');
        }

        // Simulate watching an ad (in real implementation, this would show a video ad)
        if (window.adManager && window.adManager.hasAds()) {
            window.adManager.showAd(() => {
                // Award extra life after watching
                this.state.addExtraLife();
                this.updateLivesDisplay();
                this._logEvent('Extra life earned! Total: ' + this.state.extraLives);
                this.showGameOver();
            });
        } else {
            // No ad available, still give the life (mock behavior)
            this.state.addExtraLife();
            this.updateLivesDisplay();
            this._logEvent('Extra life earned (mock)! Total: ' + this.state.extraLives);
            this.showGameOver();
        }
    }

    skipExtraLifeAd() {
        this._logEvent('Extra life offer skipped');
        if (this.extraLifeOverlay) {
            this.extraLifeOverlay.classList.add('hidden');
        }
        this.showGameOver();
    }

    updateLivesDisplay() {
        if (this.extraLivesEl) {
            this.extraLivesEl.textContent = this.state.extraLives;
        }
    }

    showGameOver() {
        this.finalScoreEl.textContent = this.state.score;
        this.highScoreEl.textContent = this.state.highScore;
        this.deathCountEl.textContent = this.state.totalDeaths;
        if (this.levelReachedEl) {
            this.levelReachedEl.textContent = this.state.level;
        }

        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        this._logEvent('Game over shown');
    }

    handleRestart() {
        this.gameOverScreen.classList.add('hidden');
        this.audio.setLowPass(false); // Unmuffle
        this.startGame();
    }

    _logEvent(event) {
        console.log('[GravityFlipGame]', event);
        if (typeof AndroidBridge !== 'undefined' && AndroidBridge.logEvent) {
            AndroidBridge.logEvent(event);
        }
    }

    // ==========================================
    // RESPAWN FREEZE SYSTEM
    // ==========================================

    respawnFreezeLoop(currentTime) {
        if (!this.state.isRespawnFreeze) return;

        const remaining = this.state.respawnFreezeEndTime - currentTime;

        if (remaining <= 0) {
            // Freeze complete - resume normal gameplay
            this.state.isRespawnFreeze = false;
            this.hideReadyOverlay();
            this._logEvent('Respawn freeze ended - resuming game');

            // Resume normal game loop
            this.lastTime = performance.now();
            this.lastObstacleSpawn = performance.now();
            this.gameLoop(performance.now());
            return;
        }

        // Update countdown display
        const secondsLeft = Math.ceil(remaining / 1000);
        this.updateReadyCountdown(secondsLeft);

        // Keep player completely frozen (zero velocity, no physics)
        this.player.velocityY = 0;
        this.player.isFlipping = false;

        // Continue drawing (player visible but frozen)
        this.draw();

        // Continue freeze loop
        requestAnimationFrame((t) => this.respawnFreezeLoop(t));
    }

    showReadyOverlay() {
        if (this.readyOverlay) {
            this.readyOverlay.classList.remove('hidden');
            this._logEvent('Showing Ready overlay');
        }
    }

    hideReadyOverlay() {
        if (this.readyOverlay) {
            this.readyOverlay.classList.add('hidden');
        }
    }

    updateReadyCountdown(seconds) {
        if (this.readyCountdownEl) {
            this.readyCountdownEl.textContent = seconds;
        }
    }

    // ==========================================
    // POWER-UP SYSTEM (Ring-based)
    // ==========================================

    /**
     * Power-Up Types (can stack multiple):
     * 1. SHIELD - Survive one collision (yellow aura)
     * 2. SLOWMO - Slow down time by 50% for 5 seconds (blue aura)
     * 3. MAGNET - Auto-collect score bonus items (purple aura)
     */

    initPowerUpSystem() {
        this.coins = [];
        // Single active power-up: { type, endTime } or null
        this.activePowerUp = null;
        this.lastCoinSpawn = 0;
        this.powerUpPopupEndTime = 0;
    }

    spawnCoin() {
        const now = performance.now();

        // Check cooldown
        if (now - this.lastCoinSpawn < CONFIG.COIN_SPAWN_COOLDOWN) {
            return;
        }

        // Check spawn chance
        if (Math.random() >= CONFIG.COIN_SPAWN_CHANCE) {
            return;
        }

        // Find a safe Y position (avoid recent obstacles)
        const safeY = this.findSafeCoinPosition();
        if (safeY === null) {
            return; // No safe spot found
        }

        const coin = new Coin(this.canvas, this.state.level, safeY);
        this.coins.push(coin);
        this.lastCoinSpawn = now;
        this._logEvent('Coin spawned at safe position');
    }

    findSafeCoinPosition() {
        const minY = CONFIG.CEILING_HEIGHT + 40;
        const maxY = this.canvas.height - CONFIG.FLOOR_HEIGHT - CONFIG.COIN_SIZE - 40;

        // Get recent obstacle positions
        const recentObstacles = this.obstacles.filter(o => o.x > this.canvas.width * 0.5);

        // Try to find a Y that's away from obstacles
        const segments = 5;
        const segmentHeight = (maxY - minY) / segments;

        for (let attempt = 0; attempt < 10; attempt++) {
            const segment = Math.floor(Math.random() * segments);
            const testY = minY + segment * segmentHeight + Math.random() * segmentHeight;

            // Check if this Y is clear of obstacles
            let isSafe = true;
            for (const obstacle of recentObstacles) {
                if (Math.abs(testY + CONFIG.COIN_SIZE / 2 - obstacle.y - obstacle.height / 2) < 80) {
                    isSafe = false;
                    break;
                }
            }

            if (isSafe) {
                return testY;
            }
        }

        // Fallback to middle area if no safe spot
        return minY + (maxY - minY) / 2;
    }

    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update(this.state.currentSpeed);

            // Check if player touches coin
            if (!coin.collected && this.playerTouchesCoin(coin)) {
                coin.collected = true;
                this.triggerPowerUp();
                this.coins.splice(i, 1);
                continue;
            }

            // Remove if off screen
            if (coin.isOffScreen()) {
                this.coins.splice(i, 1);
            }
        }

        // Check if active power-up expired
        if (this.activePowerUp && performance.now() > this.activePowerUp.endTime) {
            this.deactivatePowerUp();
        }
    }

    playerTouchesCoin(coin) {
        const playerBounds = this.player.getBounds();
        const coinBounds = coin.getBounds();

        // Circle-rectangle collision
        const coinCenterX = coinBounds.x + coinBounds.width / 2;
        const coinCenterY = coinBounds.y + coinBounds.height / 2;
        const coinRadius = coinBounds.width / 2;

        // Find closest point on player rectangle to coin center
        const closestX = Math.max(playerBounds.x, Math.min(coinCenterX, playerBounds.x + playerBounds.width));
        const closestY = Math.max(playerBounds.y, Math.min(coinCenterY, playerBounds.y + playerBounds.height));

        // Check distance
        const distX = coinCenterX - closestX;
        const distY = coinCenterY - closestY;

        return (distX * distX + distY * distY) < (coinRadius * coinRadius);
    }

    triggerPowerUp() {
        // If power-up already active, deactivate it first (single power-up only)
        if (this.activePowerUp) {
            this.deactivatePowerUp();
        }

        // Random power-up type
        const types = CONFIG.POWER_UP_TYPES;
        const type = types[Math.floor(Math.random() * types.length)];

        // Set single active power-up
        this.activePowerUp = {
            type: type,
            endTime: performance.now() + CONFIG.POWER_UP_DURATION
        };

        this._logEvent('Power-up activated: ' + type);
        this.applyPowerUpEffect(type);

        // Show power-up popup notification
        this.showPowerUpPopup(type);

        // Play sound effect
        this.audio.playFlipSound();
    }

    showPowerUpPopup(type) {
        const name = CONFIG.POWER_UP_NAMES[type] || type.toUpperCase();

        if (this.powerUpPopupEl) {
            this.powerUpPopupEl.textContent = name;
            this.powerUpPopupEl.classList.remove('hidden');
            this.powerUpPopupEl.classList.add('show');

            // Hide after duration
            setTimeout(() => {
                if (this.powerUpPopupEl) {
                    this.powerUpPopupEl.classList.remove('show');
                    this.powerUpPopupEl.classList.add('hidden');
                }
            }, CONFIG.POWER_UP_POPUP_DURATION);
        }
    }

    applyPowerUpEffect(type) {
        switch (type) {
            case 'shield':
                this.player.hasShield = true;
                break;
            case 'slowmo':
                this.state.currentSpeed *= 0.5;
                break;
            case 'magnet':
                this.player.hasMagnet = true;
                break;
        }
    }

    deactivatePowerUp() {
        if (!this.activePowerUp) return;

        const type = this.activePowerUp.type;
        this._logEvent('Power-up deactivated: ' + type);

        switch (type) {
            case 'shield':
                this.player.hasShield = false;
                break;
            case 'slowmo':
                // Restore speed based on level
                this.state.updateDifficultyForLevel();
                break;
            case 'magnet':
                this.player.hasMagnet = false;
                break;
        }

        this.activePowerUp = null;
    }

    hasActivePowerUp(type) {
        return this.activePowerUp && this.activePowerUp.type === type;
    }

    clearAllPowerUps() {
        this.deactivatePowerUp();
    }

    drawPowerUpAuras(ctx, theme) {
        if (!this.activePowerUp) return;

        const player = this.player;
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const baseRadius = Math.max(player.width, player.height) * 0.8;

        ctx.save();

        // Single power-up aura
        let auraColor;
        switch (this.activePowerUp.type) {
            case 'shield': auraColor = 'rgba(255, 215, 0, 0.4)'; break;  // Yellow
            case 'slowmo': auraColor = 'rgba(100, 150, 255, 0.4)'; break; // Blue
            case 'magnet': auraColor = 'rgba(200, 100, 255, 0.4)'; break; // Purple
        }

        // Pulsing effect
        const pulse = Math.sin(performance.now() / 200) * 5 + baseRadius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
        ctx.fillStyle = auraColor;
        ctx.fill();

        ctx.restore();
    }

    // ==========================================
    // SOCIAL SHARING
    // ==========================================

    async generateShareImage() {
        // Create a new canvas for the share image
        const shareCanvas = document.createElement('canvas');
        shareCanvas.width = 600;
        shareCanvas.height = 400;
        const ctx = shareCanvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 600, 400);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);

        // Title
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 20;
        ctx.fillText('GRAVITY FLIP', 300, 80);

        // Score box
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(100, 120, 400, 180);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 120, 400, 180);

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('SCORE', 300, 170);
        ctx.font = 'bold 64px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(this.state.score.toString(), 300, 240);

        // High Score
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '18px Arial';
        ctx.fillText(`High Score: ${this.state.highScore}`, 300, 285);

        // Level
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Level ${this.state.level} | Deaths: ${this.state.totalDeaths}`, 300, 340);

        // Call to action
        ctx.fillStyle = '#888888';
        ctx.font = '16px Arial';
        ctx.fillText('Can you beat my score? 🎮', 300, 380);

        return shareCanvas;
    }

    async getShareImageBlob() {
        const shareCanvas = await this.generateShareImage();
        return new Promise((resolve) => {
            shareCanvas.toBlob(resolve, 'image/png', 0.9);
        });
    }

    getShareText() {
        return `🎮 I scored ${this.state.score} points in Gravity Flip!\n` +
            `🏆 Level ${this.state.level} | High Score: ${this.state.highScore}\n` +
            `Can you beat me? 🚀`;
    }

    async shareToWhatsApp() {
        const text = this.getShareText();
        const encodedText = encodeURIComponent(text);

        // Try to download image first
        await this.downloadScoreImage();

        // Open WhatsApp with text
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    }

    async shareNative() {
        const text = this.getShareText();

        // Check if Web Share API is available
        if (navigator.share) {
            try {
                const blob = await this.getShareImageBlob();
                const file = new File([blob], 'gravity-flip-score.png', { type: 'image/png' });

                await navigator.share({
                    title: 'Gravity Flip Score',
                    text: text,
                    files: [file]
                });
                this._logEvent('Share successful');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // Fallback: share without image
                    try {
                        await navigator.share({
                            title: 'Gravity Flip Score',
                            text: text
                        });
                    } catch (e) {
                        // Final fallback: download
                        await this.downloadScoreImage();
                        alert('Image saved! Share it from your gallery.');
                    }
                }
            }
        } else {
            // Fallback for unsupported browsers
            await this.downloadScoreImage();

            // Copy text to clipboard
            try {
                await navigator.clipboard.writeText(text);
                alert('Score image downloaded! Share text copied to clipboard.');
            } catch (e) {
                alert('Score image downloaded! Share it from your gallery.');
            }
        }
    }

    async downloadScoreImage() {
        const shareCanvas = await this.generateShareImage();
        const dataUrl = shareCanvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `gravity-flip-score-${this.state.score}.png`;
        link.href = dataUrl;
        link.click();

        this._logEvent('Score image downloaded');
    }
}

// ==========================================
// COIN CLASS (Power-up trigger with rotation)
// ==========================================
class Coin {
    constructor(canvas, level, safeY = null) {
        this.canvas = canvas;
        this.size = CONFIG.COIN_SIZE;
        this.x = canvas.width + 50;
        this.rotation = 0;
        this.collected = false;

        // Use provided safe Y or random
        if (safeY !== null) {
            this.y = safeY;
        } else {
            const minY = CONFIG.CEILING_HEIGHT + 20;
            const maxY = canvas.height - CONFIG.FLOOR_HEIGHT - this.size - 20;
            this.y = minY + Math.random() * (maxY - minY);
        }
    }

    update(speed) {
        this.x -= speed;
        this.rotation += 0.15; // Rotate the coin
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }

    draw(ctx, theme) {
        if (this.collected) return;

        ctx.save();

        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const radius = this.size / 2;

        // Coin glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;

        // Rotating coin effect (ellipse width changes with rotation)
        const scaleX = Math.abs(Math.cos(this.rotation));
        const minScale = 0.3;
        const effectiveScaleX = minScale + scaleX * (1 - minScale);

        // Outer circle (gold)
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * effectiveScaleX, radius, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // Inner circle (darker gold for 3D effect)
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.7 * effectiveScaleX, radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#cc9900';
        ctx.fill();

        // Star/shine in center
        if (scaleX > 0.5) {
            ctx.fillStyle = '#ffff88';
            ctx.font = `${this.size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', centerX, centerY);
        }

        ctx.restore();
    }
}

// ==========================================
// INITIALIZE
// ==========================================
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new GravityFlipGame();
});
