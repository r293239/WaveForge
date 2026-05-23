// ============================================
// WAVEFORGE - Stats Panel
// ============================================

const StatsPanel = {
    visible: false,
    panel: null,
    
    init() {
        this.createPanel();
        this.createButton();
    },
    
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'statsPanel';
        this.panel.className = 'stats-panel-hidden';
        this.panel.innerHTML = `
            <div class="stats-header">
                <h3>Player Stats</h3>
                <button id="closeStatsBtn">✕</button>
            </div>
            <div class="stats-content">
                <div class="stat-row"><span class="stat-label">❤️ Health:</span><span class="stat-value" id="stat-health">0/0</span></div>
                <div class="stat-row"><span class="stat-label">⚔️ Damage:</span><span class="stat-value" id="stat-damage">100%</span></div>
                <div class="stat-row"><span class="stat-label">👟 Speed:</span><span class="stat-value" id="stat-speed">100%</span></div>
                <div class="stat-row"><span class="stat-label">💰 Gold:</span><span class="stat-value" id="stat-gold">0</span></div>
                <div class="stat-row"><span class="stat-label">👾 Kills:</span><span class="stat-value" id="stat-kills">0</span></div>
                <div class="stat-row"><span class="stat-label">🌊 Wave:</span><span class="stat-value" id="stat-wave">0</span></div>
                <div class="stat-divider"></div>
                <div class="stat-row"><span class="stat-label">🦇 Life Steal:</span><span class="stat-value" id="stat-lifesteal">0%</span></div>
                <div class="stat-row"><span class="stat-label">🎯 Critical:</span><span class="stat-value" id="stat-critical">0%</span></div>
                <div class="stat-row"><span class="stat-label">💰 Gold Multi:</span><span class="stat-value" id="stat-goldmulti">0%</span></div>
                <div class="stat-row"><span class="stat-label">🔄 Regen:</span><span class="stat-value" id="stat-regen">0%</span></div>
                <div class="stat-row"><span class="stat-label">🛡️ Damage Red:</span><span class="stat-value" id="stat-dmgred">0%</span></div>
                <div class="stat-row"><span class="stat-label">💨 Dodge:</span><span class="stat-value" id="stat-dodge">0%</span></div>
                <div class="stat-row"><span class="stat-label">🌵 Thorns:</span><span class="stat-value" id="stat-thorns">0%</span></div>
                <div class="stat-row"><span class="stat-label">⚡ Attack Speed:</span><span class="stat-value" id="stat-attackspeed">1.0x</span></div>
                <div class="stat-row"><span class="stat-label">⚡ Reload Speed:</span><span class="stat-value" id="stat-reload">1.0x</span></div>
                <div class="stat-divider"></div>
                <div class="stat-row"><span class="stat-label">💣 Landmines:</span><span class="stat-value" id="stat-landmines">0/5</span></div>
                <div class="stat-row"><span class="stat-label">🏥 Towers:</span><span class="stat-value" id="stat-towers">0/3</span></div>
                <div class="stat-row"><span class="stat-label">🔰 Runic Plate:</span><span class="stat-value" id="stat-runic">No</span></div>
                <div class="stat-row"><span class="stat-label">📜 Blood Contract:</span><span class="stat-value" id="stat-bloodcontract">No</span></div>
                <div class="stat-row"><span class="stat-label">😇 Guardian Angel:</span><span class="stat-value" id="stat-guardian">No</span></div>
                <div class="stat-row"><span class="stat-label">⚡ Berserker Ring:</span><span class="stat-value" id="stat-berserker">No</span></div>
                <div class="stat-row"><span class="stat-label">🏖️ Sandbox:</span><span class="stat-value" id="stat-sandbox">No</span></div>
            </div>
        `;
        document.body.appendChild(this.panel);
        
        document.getElementById('closeStatsBtn').addEventListener('click', () => this.toggle());
        document.getElementById('closeStatsBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggle();
        });
    },
    
    createButton() {
        const button = document.createElement('button');
        button.id = 'statsButton';
        button.className = 'stats-button';
        button.innerHTML = '📊 Stats';
        button.addEventListener('click', () => this.toggle());
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggle();
        });
        document.body.appendChild(button);
    },
    
    toggle() {
        this.visible = !this.visible;
        this.panel.className = this.visible ? 'stats-panel-visible' : 'stats-panel-hidden';
        if (this.visible) this.update();
    },
    
    update() {
        if (!this.visible) return;
        
        document.getElementById('stat-health').textContent = `${Math.floor(Player.health)}/${Player.maxHealth}`;
        document.getElementById('stat-damage').textContent = Math.floor(Player.damageMultiplier * 100) + '%';
        document.getElementById('stat-speed').textContent = Math.floor(Player.speedMultiplier * 100) + '%';
        document.getElementById('stat-gold').textContent = Game.gold;
        document.getElementById('stat-kills').textContent = Game.kills;
        document.getElementById('stat-wave').textContent = Game.wave;
        document.getElementById('stat-landmines').textContent = `${Towers.landmines.active.length}/${Towers.landmines.count}`;
        document.getElementById('stat-towers').textContent = `${Towers.healingTowers.length}/${CONFIG.MAX_HEALING_TOWERS}`;
        document.getElementById('stat-runic').textContent = Player.firstHitReduction ? 'Yes' : 'No';
        document.getElementById('stat-lifesteal').textContent = Math.floor(Player.lifeSteal * 100) + '%';
        document.getElementById('stat-critical').textContent = Math.floor(Player.criticalChance * 100) + '%';
        document.getElementById('stat-goldmulti').textContent = Math.floor(Player.goldMultiplier * 100) + '%';
        document.getElementById('stat-regen').textContent = Math.floor((Player.healthRegenPercent || 0) * 100) + '%';
        document.getElementById('stat-dmgred').textContent = Math.floor(Player.damageReduction * 100) + '%';
        document.getElementById('stat-dodge').textContent = Math.floor(Player.dodgeChance * 100) + '%';
        document.getElementById('stat-thorns').textContent = Math.floor(Player.thornsDamage * 100) + '%';
        document.getElementById('stat-attackspeed').textContent = Player.attackSpeedMultiplier.toFixed(1) + 'x';
        document.getElementById('stat-reload').textContent = Player.reloadSpeedMultiplier.toFixed(1) + 'x';
        document.getElementById('stat-bloodcontract').textContent = Player.bloodContract ? `Yes (${Player.bloodContractStacks})` : 'No';
        document.getElementById('stat-guardian').textContent = Player.guardianAngel ? (Player.guardianAngelUsed ? 'Used' : 'Ready') : 'No';
        document.getElementById('stat-berserker').textContent = Player.berserkerRing ? 'Yes' : 'No';
        document.getElementById('stat-sandbox').textContent = Game.sandboxMode ? 'Active' : 'No';
    }
};
