// ============================================
// WAVEFORGE - Towers System
// ============================================

const Towers = {
    landmines: {
        count: 0,
        max: CONFIG.MAX_LANDMINES,
        active: []
    },
    healingTowers: [],
    
    init() {
        this.landmines.count = 0;
        this.landmines.active = [];
        this.healingTowers = [];
    },
    
    reset() {
        this.landmines.active = [];
        this.healingTowers = [];
    },
    
    // Spawn a random landmine
    spawnLandmine() {
        if (this.landmines.count <= 0 || this.landmines.active.length >= this.landmines.count) return;
        
        let x, y, valid = false;
        for (let attempts = 0; attempts < 100; attempts++) {
            x = 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CONFIG.CANVAS_HEIGHT - 100);
            
            // Not too close to player
            if (Player.entity && Physics.distance({x, y}, Player.entity) < 100) continue;
            
            // Not too close to other mines
            let tooClose = false;
            for (let mine of this.landmines.active) {
                if (Physics.distance({x, y}, mine) < 50 + mine.radius) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) { valid = true; break; }
        }
        
        if (!valid) {
            x = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);
            y = 100 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200);
        }
        
        this.landmines.active.push({
            x, y,
            radius: 15,
            damage: 80,
            explosionRadius: 60,
            active: true,
            startTime: Date.now(),
            color: '#8B4513'
        });
        
        Effects.add({ type: 'landmineSpawn', x, y, radius: 20, color: '#8B4513', duration: 500 });
        Messages.show(`Landmine deployed! (${this.landmines.active.length}/${this.landmines.count})`);
    },
    
    // Place a healing tower
    placeHealingTower() {
        if (this.healingTowers.length >= CONFIG.MAX_HEALING_TOWERS) {
            Messages.show('Maximum towers reached (3)!');
            return false;
        }
        
        if (!Player.entity) return false;
        
        this.healingTowers.push({
            x: Player.entity.x,
            y: Player.entity.y,
            radius: 20,
            health: 30,
            healAmount: CONFIG.HEALING_TOWER_AMOUNT,
            lastHeal: Date.now(),
            id: Date.now() + Math.random()
        });
        
        Effects.add({ type: 'towerSpawn', x: Player.entity.x, y: Player.entity.y, radius: 30, color: '#4CAF50', duration: 500 });
        Messages.show(`Healing Tower placed! (${this.healingTowers.length}/${CONFIG.MAX_HEALING_TOWERS})`);
        return true;
    },
    
    // Check landmine triggers
    checkTriggers() {
        for (let i = this.landmines.active.length - 1; i >= 0; i--) {
            const mine = this.landmines.active[i];
            
            for (let j = 0; j < Monsters.active.length; j++) {
                const monster = Monsters.active[j];
                
                if (Physics.distance(mine, monster) < mine.radius + monster.radius) {
                    // Explode!
                    for (let k = Monsters.active.length - 1; k >= 0; k--) {
                        const other = Monsters.active[k];
                        if (Physics.distance(mine, other) < mine.explosionRadius + other.radius) {
                            other.health -= mine.damage;
                            Effects.damageIndicator(other.x, other.y, mine.damage, true);
                            if (other.health <= 0) Monsters.handleDeath(other, k);
                        }
                    }
                    
                    Effects.explosion(mine.x, mine.y, mine.explosionRadius, '#FF4500');
                    this.landmines.active.splice(i, 1);
                    break;
                }
            }
        }
    },
    
    // Update healing towers
    update(currentTime) {
        this.checkTriggers();
        
        for (let tower of this.healingTowers) {
            if (currentTime - tower.lastHeal >= CONFIG.HEALING_TOWER_INTERVAL && 
                Player.health < Player.maxHealth) {
                Player.heal(tower.healAmount);
                tower.lastHeal = currentTime;
            }
        }
    },
    
    // Draw towers
    draw() {
        const ctx = Game.ctx;
        
        // Draw landmines
        for (let mine of this.landmines.active) {
            ctx.save();
            ctx.translate(mine.x, mine.y);
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#F00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, mine.radius * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = mine.color;
            ctx.beginPath();
            ctx.arc(0, 0, mine.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(0, 0, mine.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💣', 0, 0);
            ctx.restore();
        }
        
        // Draw healing towers
        for (let tower of this.healingTowers) {
            ctx.save();
            ctx.translate(tower.x, tower.y);
            ctx.fillStyle = '#2E7D32';
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, tower.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            
            // Health bar
            const hpPercent = tower.health / 30;
            ctx.fillStyle = '#000';
            ctx.fillRect(-tower.radius, -tower.radius - 10, tower.radius * 2, 5);
            ctx.fillStyle = '#0F0';
            ctx.fillRect(-tower.radius, -tower.radius - 10, tower.radius * 2 * hpPercent, 5);
            ctx.restore();
        }
    }
};
