// ============================================
// WAVEFORGE - Overlay Screens
// ============================================

const Overlays = {
    init() {
        this.setupStartScreen();
        this.setupRestartButton();
    },
    
    setupStartScreen() {
        const startBtn = document.getElementById('startGameBtn');
        const difficultySelect = document.getElementById('difficultySelect');
        
        // Create difficulty selector if it doesn't exist
        if (!difficultySelect.innerHTML) {
            difficultySelect.innerHTML = `
                <div class="overlay-content" style="max-width: 500px;">
                    <h2 class="overlay-title">Select Difficulty</h2>
                    <button class="btn btn-success diff-btn" data-mode="easy" style="width:100%;margin:8px 0;padding:15px;">
                        🟢 Easy Mode
                    </button>
                    <button class="btn btn-primary diff-btn" data-mode="normal" style="width:100%;margin:8px 0;padding:15px;">
                        🟡 Normal Mode
                    </button>
                    <button class="btn btn-danger diff-btn" data-mode="impossible" style="width:100%;margin:8px 0;padding:15px;">
                        🔴 Impossible Mode
                    </button>
                    <div style="color:#aaa;font-size:0.8rem;margin-top:10px;">
                        Easy: +15% dmg, -15% HP, +25% gold<br>
                        Normal: Standard gameplay<br>
                        Impossible: -10% dmg, +10% HP, -50% gold, harder waves
                    </div>
                </div>
            `;
            
            difficultySelect.querySelectorAll('.diff-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.target.dataset.mode;
                    Game.setDifficulty(mode);
                    difficultySelect.style.display = 'none';
                    Game.startGame();
                });
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const mode = e.target.dataset.mode;
                    Game.setDifficulty(mode);
                    difficultySelect.style.display = 'none';
                    Game.startGame();
                });
            });
        }
        
        startBtn.addEventListener('click', () => {
            document.getElementById('startScreen').style.display = 'none';
            difficultySelect.style.display = 'flex';
        });
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            document.getElementById('startScreen').style.display = 'none';
            difficultySelect.style.display = 'flex';
        });
        
        // Continue game button - only show if save exists
        const continueBtn = document.getElementById('continueGameBtn');
        if (Save.hasSave()) {
            continueBtn.style.display = 'block';
            continueBtn.addEventListener('click', () => {
                if (Save.loadGame()) {
                    document.getElementById('startScreen').style.display = 'none';
                }
            });
            continueBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (Save.loadGame()) {
                    document.getElementById('startScreen').style.display = 'none';
                }
            });
        } else {
            continueBtn.style.display = 'none';
        }
    },
    
    setupRestartButton() {
        const restartBtn = document.getElementById('restartBtn');
        restartBtn.addEventListener('click', () => {
            this.hideAll();
            document.getElementById('difficultySelect').style.display = 'flex';
            Game.sandboxMode = false;
            Game.gameWon = false;
        });
        restartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.hideAll();
            document.getElementById('difficultySelect').style.display = 'flex';
            Game.sandboxMode = false;
            Game.gameWon = false;
        });
    },
    
    showStart() {
        document.getElementById('startScreen').style.display = 'flex';
    },
    
    showWin() {
        const overlay = document.getElementById('gameOverOverlay');
        const text = document.getElementById('gameOverText');
        
        overlay.style.display = 'flex';
        text.innerHTML = `
            <div style="font-size:2rem;color:#ffd700;margin-bottom:15px;">🎉 YOU WIN! 🎉</div>
            <div style="font-size:1.2rem;margin-bottom:10px;">You conquered all 40 waves!</div>
            <div style="font-size:1rem;color:#aaa;margin-bottom:20px;">
                Kills: ${Game.kills} | Gold: ${Game.gold} | Difficulty: ${Game.difficulty.toUpperCase()}
            </div>
        `;
        
        // Add sandbox continue button
        const sandboxBtn = document.createElement('button');
        sandboxBtn.id = 'sandboxContinueBtn';
        sandboxBtn.textContent = '🏖️ Continue in Sandbox Mode (Endless Waves)';
        sandboxBtn.style.cssText = 'display:block;width:280px;margin:15px auto;padding:15px;background:linear-gradient(45deg,#6a0dad,#9b59b6);color:white;border:none;border-radius:10px;font-size:1.1rem;cursor:pointer;';
        sandboxBtn.addEventListener('click', () => this.startSandbox());
        sandboxBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startSandbox(); });
        
        const oldBtn = document.getElementById('sandboxContinueBtn');
        if (oldBtn) oldBtn.remove();
        text.appendChild(sandboxBtn);
        
        document.getElementById('restartBtn').style.display = 'block';
        document.getElementById('restartBtn').textContent = '🔄 Play Again';
        Messages.show('CONGRATULATIONS! You beat the game!', 5000);
    },
    
    showGameOver() {
        const overlay = document.getElementById('gameOverOverlay');
        const text = document.getElementById('gameOverText');
        
        overlay.style.display = 'flex';
        text.textContent = `You survived ${Game.wave} waves with ${Game.kills} kills.`;
        
        // Remove sandbox button if present
        const sandboxBtn = document.getElementById('sandboxContinueBtn');
        if (sandboxBtn) sandboxBtn.remove();
        
        document.getElementById('restartBtn').style.display = 'block';
        document.getElementById('restartBtn').textContent = '🔄 Play Again';
    },
    
    startSandbox() {
        Game.sandboxMode = true;
        Game.gameWon = false;
        Game.state = GAME_STATE.WAVE;
        Game.waveActive = true;
        Game.waveStartTime = Date.now();
        Game.pendingSpawns = 0;
        Game.wave = 41;
        
        Player.inSlowField = false;
        Player.slowFieldTicks = 0;
        Player.speed = Player.baseSpeed * Player.speedMultiplier;
        Player.weapons.forEach(w => { if (w.resetEachRound) w.resetAmmo(); });
        
        Boss.reset();
        Monsters.reset();
        Projectiles.reset();
        Physics.clear();
        
        const waveConfig = Waves.getWaveConfig(Game.wave);
        document.getElementById('waveDisplay').textContent = `🏖️ Wave ${Game.wave} (Sandbox)`;
        document.getElementById('waveDisplay').style.opacity = 1;
        
        if (waveConfig.isBoss) {
            document.getElementById('waveDisplay').textContent = `🏖️ SANDSTORM BOSS ${Game.wave}`;
            document.getElementById('waveDisplay').classList.add('boss-wave');
            Monsters.spawnBoss();
            Monsters.spawnWave(waveConfig, true);
        } else {
            Monsters.spawnWave(waveConfig, false);
        }
        
        setTimeout(() => {
            document.getElementById('waveDisplay').style.opacity = 0.5;
        }, 2500);
        
        this.hideAll();
        Messages.show('🏖️ Sandbox Mode: Endless waves incoming!', 3000);
        HUD.updateAll();
    },
    
    hideAll() {
        document.getElementById('gameOverOverlay').style.display = 'none';
        document.getElementById('waveCompleteOverlay').style.display = 'none';
        document.getElementById('difficultySelect').style.display = 'none';
        document.getElementById('mapSelectionOverlay').style.display = 'none';
    }
};
