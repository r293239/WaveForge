// ============================================
// WAVEFORGE - Effects System
// ============================================

const Effects = {
    active: [],
    groundFire: [],
    poisonClouds: [],
    activeTraps: [],
    voidZones: [],
    
    init() {
        this.active = [];
        this.groundFire = [];
        this.poisonClouds = [];
        this.activeTraps = [];
        this.voidZones = [];
    },
    
    reset() {
        this.active = [];
        this.groundFire = [];
        this.poisonClouds = [];
        this.activeTraps = [];
        this.voidZones = [];
    },
    
    add(effect) {
        effect.startTime = effect.startTime || Date.now();
        this.active.push(effect);
    },
    
    spawnEffect(x, y, color) {
        this.add({ type: 'spawn', x, y, color, duration: 300 });
    },
    
    deathEffect(x, y) {
        this.add({ type: 'death', x, y, color: '#FF0000', duration: 300 });
    },
    
    explosion(x, y, radius, color = '#FF4500') {
        this.add({ type: 'explosion', x, y, radius, color, duration: 400 });
    },
    
    shockwave(x, y, radius, color = '#0FF') {
        this.add({ type: 'shockwave', x, y, radius, color, duration: 200 });
    },
    
    asteroidWarning(x, y, radius) {
        this.add({ type: 'asteroidWarning', x, y, radius, duration: 800 });
    },
    
    asteroidImpact(x, y, radius) {
        this.add({ type: 'asteroid', x, y, radius, duration: 500 });
    },
    
    teleportEffect(x, y) {
        this.add({ type: 'teleport', x, y, radius: 50, color: '#6a0dad', duration: 300 });
    },
    
    guardianAngel(x, y) {
        this.add({ type: 'guardianAngel', x, y, radius: 50, color: '#FF0', duration: 1000 });
    },
    
    bossSpawn(x, y, color) {
        this.add({ type: 'bossSpawn', x, y, radius: 100, color, duration: 800 });
    },
    
    groundFire(x, y, radius, damage, duration) {
        this.groundFire.push({ x, y, radius, damage, startTime: Date.now(), duration });
    },
    
    lightningBolt(x1, y1, x2, y2) {
        this.add({ type: 'lightning', x1, y1, x2, y2, duration: 300 });
    },
    
    damageIndicator(x, y, damage, isCritical) {
        const indicator = document.createElement('div');
        indicator.className = 'damage-indicator';
        indicator.textContent = isCritical ? 'CRIT! ' + damage : Math.floor(damage).toString();
        if (isCritical) {
            indicator.style.color = '#FFD700';
            indicator.style.fontSize = '1.5rem';
        }
        indicator.style.left = (x + Math.random() * 20 - 10) + 'px';
        indicator.style.top = (y + Math.random() * 20 - 10) + 'px';
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.appendChild(indicator);
            setTimeout(() => {
                if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
            }, 1000);
        }
    },
    
    goldPopup(x, y, amount) {
        const popup = document.createElement('div');
        popup.className = 'gold-popup';
        popup.textContent = '+' + amount + 'g';
        popup.style.left = (x + Math.random() * 20 - 10) + 'px';
        popup.style.top = (y + Math.random() * 20 - 10) + 'px';
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.appendChild(popup);
            setTimeout(() => {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 1000);
        }
    },
    
    healthPopup(x, y, amount) {
        const popup = document.createElement('div');
        popup.className = 'health-popup';
        popup.textContent = '+' + amount + ' HP';
        popup.style.left = (x + Math.random() * 20 - 10) + 'px';
        popup.style.top = (y + Math.random() * 20 - 10) + 'px';
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.appendChild(popup);
            setTimeout(() => {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 1000);
        }
    },
    
    update(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            if (currentTime - this.active[i].startTime > this.active[i].duration) {
                this.active.splice(i, 1);
            }
        }
        
        for (let i = this.groundFire.length - 1; i >= 0; i--) {
            const fire = this.groundFire[i];
            if (currentTime - fire.startTime > fire.duration) {
                this.groundFire.splice(i, 1);
                continue;
            }
            for (let monster of Monsters.active) {
                if (Physics.distance(fire, monster) < fire.radius + monster.radius) {
                    if (!monster.lastFireTick || currentTime - monster.lastFireTick > 500) {
                        monster.health -= fire.damage;
                        this.damageIndicator(monster.x, monster.y, fire.damage, false);
                        monster.lastFireTick = currentTime;
                    }
                }
            }
        }
    },
    
    draw() {
        const ctx = Game.ctx;
        const currentTime = Date.now();
        
        for (let effect of this.active) {
            const progress = (currentTime - effect.startTime) / effect.duration;
            if (progress > 1) continue;
            const alpha = 1 - progress;
            
            ctx.save();
            
            switch (effect.type) {
                case 'death':
                    ctx.fillStyle = `rgba(255,0,0,${alpha})`;
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 * i) / 8 + progress * Math.PI;
                        const dist = progress * 30;
                        ctx.beginPath();
                        ctx.arc(effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                    
                case 'spawn':
                    ctx.strokeStyle = effect.color || '#fff';
                    ctx.lineWidth = 3 * (1 - progress);
                    ctx.shadowColor = effect.color || '#fff';
                    ctx.shadowBlur = 15 * alpha;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, 15 + i * 10 + progress * 30, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;
                    
                case 'bossSpawn':
                    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.radius);
                    gradient.addColorStop(0, `rgba(255,215,0,${alpha})`);
                    gradient.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.7})`);
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 50;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'explosion':
                    const exSize = (effect.radius || 40) * (1 - progress * 0.5);
                    const exGrad = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, exSize);
                    exGrad.addColorStop(0, `rgba(255,255,255,${alpha})`);
                    exGrad.addColorStop(0.3, `rgba(255,200,0,${alpha})`);
                    exGrad.addColorStop(0.6, `rgba(255,100,0,${alpha * 0.7})`);
                    exGrad.addColorStop(1, 'rgba(255,0,0,0)');
                    ctx.fillStyle = exGrad;
                    ctx.shadowColor = '#FF4500';
                    ctx.shadowBlur = 30;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, exSize, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'asteroidWarning':
                    ctx.strokeStyle = `rgba(255, 69, 0, ${alpha})`;
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#FF4500';
                    ctx.shadowBlur = 20 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'asteroid':
                    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                    ctx.shadowColor = '#8B4513';
                    ctx.shadowBlur = 30 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'teleport':
                    ctx.strokeStyle = `rgba(106, 13, 173, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#6a0dad';
                    ctx.shadowBlur = 20 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 - progress), 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'guardianAngel':
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.3})`;
                    ctx.shadowColor = '#FF0';
                    ctx.shadowBlur = 30 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 + progress * 2), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('😇', effect.x, effect.y - 10);
                    break;
                    
                case 'shockwave':
                    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#0FF';
                    ctx.shadowBlur = 15 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 + progress * 2), 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'lightning':
                    const boltAlpha = 1 - progress;
                    ctx.strokeStyle = `rgba(255,255,100,${boltAlpha})`;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#FFFF00';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(effect.x1, effect.y1);
                    const segments = 5;
                    for (let i = 1; i <= segments; i++) {
                        const t = i / segments;
                        const x = effect.x1 + (effect.x2 - effect.x1) * t;
                        const y = effect.y1 + (effect.y2 - effect.y1) * t + (Math.random() - 0.5) * 20;
                        ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    break;
                    
                case 'landmineSpawn':
                    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                    ctx.shadowColor = '#8B4513';
                    ctx.shadowBlur = 15 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 - progress), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'towerSpawn':
                    ctx.fillStyle = `rgba(76, 175, 80, ${alpha * 0.5})`;
                    ctx.shadowColor = '#4CAF50';
                    ctx.shadowBlur = 20 * alpha;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * (1 + progress), 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    },
    
    drawGround() {
        const ctx = Game.ctx;
        
        // Ground fire
        for (let fire of this.groundFire) {
            const progress = (Date.now() - fire.startTime) / fire.duration;
            if (progress > 1) continue;
            ctx.save();
            ctx.globalAlpha = 1 - progress * 0.5;
            ctx.fillStyle = '#FF4500';
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(fire.x, fire.y, fire.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(fire.x, fire.y, fire.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Slow field (wave 30 boss)
        if (Boss.abilities.slowField && Boss.abilities.slowField.active) {
            const boss = Monsters.active.find(m => m.isBoss && Game.wave === 30);
            if (boss) {
                ctx.save();
                ctx.translate(boss.x, boss.y);
                const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
                ctx.fillStyle = 'rgba(100,100,255,0.3)';
                ctx.shadowColor = '#6464ff';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(0, 0, Boss.abilities.slowField.radius * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('SLOW FIELD', 0, -Boss.abilities.slowField.radius - 20);
                ctx.restore();
            }
        }
        
        // Void zones (wave 40 boss)
        for (let zone of Boss.abilities.voidZones) {
            const progress = (Date.now() - zone.startTime) / zone.duration;
            if (progress > 1) continue;
            ctx.save();
            ctx.translate(zone.x, zone.y);
            ctx.fillStyle = `rgba(106, 13, 173, ${0.3 * (1 - progress)})`;
            ctx.shadowColor = '#6a0dad';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
};
