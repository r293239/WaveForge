// ============================================
// WAVEFORGE - Backbone (Game Core)
// ============================================

const Game = {
    state: GAME_STATE.START,
    wave: 1,
    gold: 50,
    kills: 0,
    refreshCount: 0,
    refreshCost: 5,
    waveActive: false,
    waveStartTime: 0,
    pendingSpawns: 0,
    sandboxMode: false,
    gameWon: false,
    difficulty: DIFFICULTY.NORMAL,
    difficultyMultipliers: { ...CONFIG.DIFFICULTY.normal },
    lastFrameTime: Date.now(),
    canvas: null,
    ctx: null,
    autoSaveInterval: null,
    purchasedItems: {},
    weaponUpgrades: {},
    currentMap: 'empty_arena',
    camera: Camera,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.lastFrameTime = Date.now();
        this.purchasedItems = {};
        this.weaponUpgrades = {};

        try {
            console.log('Initializing Physics...');
            Physics.init();

            console.log('Initializing Arena...');
            Arena.init();

            console.log('Initializing Camera...');
            this.camera.init();
            this.camera.worldWidth = CONFIG.CANVAS_WIDTH * 2;
            this.camera.worldHeight = CONFIG.CANVAS_HEIGHT * 2;

            console.log('Initializing Player...');
            Player.init();

            console.log('Initializing Monsters...');
            Monsters.init();

            console.log('Initializing MonsterBrain...');
            MonsterBrain.init();

            console.log('Initializing Boss...');
            Boss.init();

            console.log('Initializing Combat...');
            Combat.init();

            console.log('Initializing Projectiles...');
            Projectiles.init();

            console.log('Initializing Effects...');
            Effects.init();

            console.log('Initializing Towers...');
            Towers.init();

            console.log('Initializing Shop...');
            Shop.init();

            console.log('Initializing Waves...');
            Waves.init();

            console.log('Initializing Upgrades...');
            Upgrades.init();

            console.log('Initializing Abilities...');
            Abilities.init();

            console.log('Initializing Messages...');
            Messages.init();

            console.log('Initializing HUD...');
            HUD.init();

            console.log('Initializing StatsPanel...');
            StatsPanel.init();

            console.log('Initializing Overlays...');
            Overlays.init();

            console.log('Initializing Joystick...');
            Joystick.init();

            console.log('Initializing Save...');
            Save.init();

            console.log('All systems initialized successfully');

            this.setupKeyboard();
            Overlays.showStart();
            this.gameLoop();
        } catch (e) {
            console.error('Game initialization error:', e);
        }
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ' && (this.state === GAME_STATE.SHOP || this.state === GAME_STATE.WIN)) {
                e.preventDefault();
                this.startNextWave();
            }
            if (key === 's' && e.ctrlKey) {
                e.preventDefault();
                Save.saveGame();
            }
            if (key === 'l' && e.ctrlKey) {
                e.preventDefault();
                Save.loadGame();
            }
        });
    },

    gameLoop() {
        try {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            // === CRITICAL: Only update game logic when in WAVE state ===
            if (this.state === GAME_STATE.WAVE) {
                Player.update(deltaTime);
                Monsters.update(currentTime);
                MonsterBrain.update(currentTime);
                Boss.update(currentTime);
                Combat.updateWeapons(currentTime);
                Projectiles.update(currentTime);
                Combat.updateMeleeAttacks(currentTime);
                Effects.update(currentTime);
                Towers.update(currentTime);
                Monsters.updateStatusEffects(currentTime);
                Waves.checkWaveEnd();
                Physics.resolveMonsterCollisions();
                Physics.resolvePlayerMonsterCollisions();
            }

            // === Always render ===
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Camera follows player if exists
            if (Player.entity) {
                this.camera.follow(Player.entity);
            }

            this.camera.apply(this.ctx);
            Arena.draw();
            Effects.drawGround();
            Waves.drawIndicators();
            Towers.draw();
            Monsters.draw();
            Projectiles.draw();
            Combat.drawMeleeAttacks();
            Boss.drawAttacks();
            Effects.draw();
            Player.draw();
            this.camera.restore(this.ctx);

            HUD.updateCooldowns();
        } catch (e) {
            console.error('Game loop error:', e);
        }

        requestAnimationFrame(() => this.gameLoop());
    },

    setDifficulty(mode) {
        this.difficulty = mode;
        this.sandboxMode = false;
        this.gameWon = false;
        this.difficultyMultipliers = { ...CONFIG.DIFFICULTY[mode] };
    },

    startGame() {
        console.log('🟢 startGame() called – showing map selection');
        MapSelection.show();
    },

    startGameWithMap() {
        console.log('🟢 startGameWithMap() called – starting game!');
        
        // Reset everything
        this.state = GAME_STATE.WAVE;  // <-- CRITICAL: Set state to WAVE
        this.wave = 1;
        this.gold = CONFIG.PLAYER_START.gold;
        this.kills = 0;
        this.refreshCount = 0;
        this.refreshCost = CONFIG.SHOP_REFRESH_BASE_COST;
        this.waveActive = true;       // <-- CRITICAL: Set waveActive to true
        this.pendingSpawns = 0;
        this.sandboxMode = false;
        this.gameWon = false;
        this.purchasedItems = {};
        this.weaponUpgrades = {};

        // Reset all systems
        Player.reset();
        Monsters.reset();
        Boss.reset();
        Projectiles.reset();
        Towers.reset();
        Effects.reset();
        Abilities.reset();

        // Give player starting weapon
        const handgunData = WEAPON_DATA.find(w => w.id === 'handgun');
        if (handgunData) {
            Player.addWeapon(handgunData);
            console.log('✅ Handgun added');
        } else {
            console.error('❌ Handgun data not found!');
        }

        // Generate shop items
        Shop.generateItems();

        // === CRITICAL: Start the first wave ===
        Waves.startWave();

        // Reset ability cooldowns
        Abilities.resetCooldowns();

        // Auto-save
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = setInterval(() => Save.saveGame(), CONFIG.AUTO_SAVE_INTERVAL);

        // Update HUD and hide overlays
        HUD.updateAll();
        Overlays.hideAll();

        console.log('✅ Game started successfully! Wave 1 should now spawn monsters.');
    },

    startNextWave() {
        if (this.state !== GAME_STATE.SHOP && this.state !== GAME_STATE.WIN) return;
        this.state = GAME_STATE.WAVE;
        this.waveActive = true;
        Waves.startWave();
        Abilities.resetCooldowns();
        HUD.hideWaveButton();
    },

    waveComplete() {
        if (this.wave === 40 && !this.sandboxMode) {
            this.gameWon = true;
            this.state = GAME_STATE.WIN;
            this.waveActive = false;
            Save.clearSave();
            Overlays.showWin();
            return;
        }
        if (this.sandboxMode && this.wave === 40) Messages.show('Sandbox Mode Active!', 4000);
        this.state = GAME_STATE.STAT_SELECT;
        this.waveActive = false;
        this.gold += Math.floor(Waves.getWaveConfig(this.wave).goldReward * (1 + Player.goldMultiplier));
        Player.weapons.forEach(w => {
            if (w.usesAmmo && !w.isThrowable) {
                w.currentAmmo = w.magazineSize;
                w.isReloading = false;
            }
        });
        Save.saveGame();
        Upgrades.showSelection();
        HUD.updateAll();
    },

    gameOver() {
        this.state = GAME_STATE.GAMEOVER;
        this.waveActive = false;
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        Player.inSlowField = false;
        Player.slowFieldTicks = 0;
        Player.speed = Player.baseSpeed * Player.speedMultiplier;
        Save.clearSave();
        if (Player.guardianAngel && !Player.guardianAngelUsed) {
            Player.guardianAngelUsed = true;
            Player.health = Math.max(1, Math.floor(Player.maxHealth * 0.5));
            this.state = GAME_STATE.WAVE;
            this.waveActive = true;
            Messages.show('GUARDIAN ANGEL SAVED YOU!');
            Effects.guardianAngel(Player.entity.x, Player.entity.y);
            HUD.updateStats();
            return;
        }
        Overlays.showGameOver();
    },

    addKill() {
        this.kills++;
        HUD.updateStats();
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => Game.init(), 100);
} else {
    document.addEventListener('DOMContentLoaded', () => Game.init());
}
