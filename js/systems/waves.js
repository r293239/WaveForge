// ============================================
// WAVEFORGE - Wave Management
// ============================================

const Waves = {
    init() {},
    
    // Get wave configuration
    getWaveConfig(waveNum) {
        if (Game.sandboxMode && waveNum > 40) {
            return this.getSandboxWaveConfig(waveNum);
        }
        return WAVE_CONFIGS[waveNum - 1] || WAVE_CONFIGS[WAVE_CONFIGS.length - 1];
    },
    
    // Get monster types for a wave
    getMonsterTypesForWave(waveNum) {
        if (waveNum % 10 === 0) return ['BOSS'];
        
        const comp = this.getDifficultyComposition(waveNum);
        const types = [];
        for (let i = 0; i < comp.normal; i++) types.push('NORMAL');
        for (let i = 0; i < comp.fast; i++) types.push('FAST');
        for (let i = 0; i < comp.tank; i++) types.push('TANK');
        for (let i = 0; i < comp.explosive; i++) types.push('EXPLOSIVE');
        for (let i = 0; i < comp.gunner; i++) types.push('GUNNER');
        for (let i = 0; i < comp.splitter; i++) types.push('SPLITTER');
        for (let i = 0; i < comp.dasher; i++) types.push('DASHER');
        for (let i = 0; i < comp.vampire; i++) types.push('VAMPIRE');
        return types;
    },
    
    // Get non-boss types for boss waves
    getNonBossTypesForWave(waveNum) {
        const comp = this.getDifficultyComposition(waveNum);
        const types = [];
        for (let i = 0; i < comp.normal; i++) types.push('NORMAL');
        for (let i = 0; i < comp.fast; i++) types.push('FAST');
        for (let i = 0; i < comp.tank; i++) types.push('TANK');
        for (let i = 0; i < comp.explosive; i++) types.push('EXPLOSIVE');
        for (let i = 0; i < comp.gunner; i++) types.push('GUNNER');
        for (let i = 0; i < comp.splitter; i++) types.push('SPLITTER');
        for (let i = 0; i < comp.dasher; i++) types.push('DASHER');
        for (let i = 0; i < comp.vampire; i++) types.push('VAMPIRE');
        return types.sort(() => Math.random() - 0.5);
    },
    
    // Get difficulty-scaled composition
    getDifficultyComposition(waveNum) {
        if (Game.sandboxMode && waveNum > 40) {
            return this.getSandboxComposition(waveNum);
        }
        
        switch (Game.difficulty) {
            case 'easy': return WAVE_COMPOSITIONS_EASY[waveNum] || { normal: 3, fast: 0, tank: 0, explosive: 0, gunner: 0, splitter: 0, dasher: 0, vampire: 0 };
            case 'impossible': return WAVE_COMPOSITIONS_IMPOSSIBLE[waveNum] || { normal: 4, fast: 1, tank: 1, explosive: 0, gunner: 1, splitter: 0, dasher: 1, vampire: 0 };
            default: return WAVE_COMPOSITIONS[waveNum] || { normal: 3, fast: 0, tank: 0, explosive: 0, gunner: 0, splitter: 0, dasher: 0, vampire: 0 };
        }
    },
    
    // Sandbox wave composition (waves > 40)
    getSandboxComposition(waveNum) {
        const wavesPast = waveNum - 40;
        const scaling = Math.floor(wavesPast / 5);
        return {
            normal: 15 + wavesPast * 2,
            fast: 8 + scaling * 2,
            tank: 6 + scaling * 2,
            explosive: 5 + scaling,
            gunner: 5 + scaling * 2,
            splitter: 4 + scaling,
            dasher: 4 + scaling,
            vampire: 4 + scaling
        };
    },
    
    // Sandbox wave config
    getSandboxWaveConfig(waveNum) {
        const comp = this.getSandboxComposition(waveNum);
        const totalSpecial = comp.fast + comp.tank + comp.explosive + comp.gunner + comp.splitter + comp.dasher + comp.vampire;
        const totalMonsters = comp.normal + totalSpecial;
        const wavesPast = waveNum - 40;
        
        // Boss every 10 waves after 50
        const isBoss = waveNum >= 50 && waveNum % 10 === 0;
        const bossHealth = isBoss ? 30000 * Math.pow(1.3, Math.floor((waveNum - 50) / 10)) : 0;
        
        return {
            number: waveNum,
            monsters: isBoss ? (18 + Math.floor((waveNum - 50) / 10) * 5) : totalMonsters,
            monsterHealth: 200 + wavesPast * 35,
            monsterDamage: 40 + wavesPast * 2,
            goldReward: 300 + wavesPast * 50,
            isBoss: isBoss,
            bossHealth: Math.floor(bossHealth)
        };
    },
    
    // Start a new wave
    startWave() {
        Game.waveActive = true;
        Game.pendingSpawns = 0;
        
        // Reset per-wave states
        if (Player.firstHitReduction) Player.firstHitActive = true;
        Player.inSlowField = false;
        Player.slowFieldTicks = 0;
        Player.speed = Player.baseSpeed * Player.speedMultiplier;
        Player.weapons.forEach(w => { if (w.resetEachRound) w.resetAmmo(); });
        
        // Reset systems
        Monsters.reset();
        Boss.reset();
        Projectiles.reset();
        Physics.clear();
        
        const waveConfig = this.getWaveConfig(Game.wave);
        
        // Update wave display
        const waveDisplay = document.getElementById('waveDisplay');
        waveDisplay.classList.remove('boss-wave');
        
        if (Game.sandboxMode && Game.wave > 40) {
            waveDisplay.textContent = `🏖️ Wave ${Game.wave} (Sandbox)`;
        } else {
            waveDisplay.textContent = `Wave ${Game.wave} (${Game.difficulty.toUpperCase()})`;
        }
        
        if (waveConfig.isBoss || (Game.sandboxMode && Game.wave > 40 && Game.wave % 10 === 0)) {
            if (Game.wave === 10) waveDisplay.textContent = 'BOSS WAVE 10 - SHADOW DAGGER';
            else if (Game.wave === 20) waveDisplay.textContent = 'BOSS WAVE 20 - WAR HAMMER';
            else if (Game.wave === 30) waveDisplay.textContent = 'BOSS WAVE 30 - SOUL REAPER';
            else if (Game.wave === 40) waveDisplay.textContent = 'FINAL BOSS - VOID BLADE';
            else if (Game.sandboxMode && Game.wave > 40) waveDisplay.textContent = `🏖️ SANDSTORM BOSS ${Game.wave}`;
            waveDisplay.classList.add('boss-wave');
        }
        
        waveDisplay.style.opacity = 1;
        setTimeout(() => { waveDisplay.style.opacity = 0.5; }, 2500);
        
        // Spawn monsters
        if (waveConfig.isBoss || (Game.sandboxMode && Game.wave > 40 && Game.wave % 10 === 0)) {
            Monsters.spawnBoss();
            Monsters.spawnWave(waveConfig, true);
        } else {
            Monsters.spawnWave(waveConfig, false);
        }
        
        // ***** FIX: Deploy all towers at wave start (landmines, healing, turrets) *****
        // This replaces the old single landmine spawn.
        Towers.deployAll();
        
        HUD.updateStats();
        document.getElementById('monsterCount').textContent = `Monsters: ${Game.pendingSpawns}`;
    },
    
    // Check if wave is complete
    checkWaveEnd() {
        if (!Game.waveActive) return;
        
        if (Monsters.active.length === 0 && Game.pendingSpawns <= 0) {
            Game.wave++;
            Game.waveComplete();
        }
    },
    
    // Draw spawn indicators
    drawIndicators() {
        Monsters.drawIndicators();
    }
};
