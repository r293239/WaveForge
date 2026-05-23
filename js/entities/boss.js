// ============================================
// WAVEFORGE - Boss System
// ============================================

const Boss = {
    // Boss ability state
    abilities: {
        shotgun: false,
        asteroids: [],
        slowField: null,
        enraged: false,
        weapon: null,
        weaponAttack: null,
        dash: false,
        dashTarget: { x: 0, y: 0 },
        dashStart: 0,
        dashCooldown: 0,
        dashDirection: { x: 0, y: 0 },
        dashDistance: 0,
        minionSpawnTimer: 0,
        voidZones: [],
        teleportTimer: 0
    },
    
    // Timers
    asteroidTimer: null,
    minionSpawnInterval: null,
    
    init() {
        this.reset();
    },
    
    reset() {
        this.abilities = {
            shotgun: false,
            asteroids: [],
            slowField: null,
            enraged: false,
            weapon: null,
            weaponAttack: null,
            dash: false,
            dashTarget: { x: 0, y: 0 },
            dashStart: 0,
            dashCooldown: 0,
            dashDirection: { x: 0, y: 0 },
            dashDistance: 0,
            minionSpawnTimer: 0,
            voidZones: [],
            teleportTimer: 0
        };
        
        if (this.asteroidTimer) clearInterval(this.asteroidTimer);
        if (this.minionSpawnInterval) clearInterval(this.minionSpawnInterval);
        this.asteroidTimer = null;
        this.minionSpawnInterval = null;
    },
    
    // Setup boss based on wave number
    setupBoss(boss, waveNum) {
        this.reset();
        
        switch (waveNum) {
            case 10:
                this.abilities.weapon = { ...BOSS_WEAPONS.DAGGER, lastAttack: 0 };
                this.abilities.shotgun = true;
                boss.color = '#8B0000';
                boss.attackCooldown = 3500;
                break;
                
            case 20:
                this.abilities.weapon = { ...BOSS_WEAPONS.WAR_HAMMER, lastAttack: 0 };
                boss.color = '#8B4513';
                this.startAsteroids();
                break;
                
            case 30:
                this.abilities.weapon = { ...BOSS_WEAPONS.SCYTHE, lastAttack: 0 };
                boss.color = '#4B0082';
                this.abilities.slowField = { active: true, radius: 200, lastDamage: 0 };
                break;
                
            case 40:
                this.abilities.weapon = { ...BOSS_WEAPONS.VOID_BLADE, lastAttack: 0 };
                boss.color = '#0f0f1f';
                this.startVoidZones();
                break;
                
            default:
                // Sandbox boss
                if (Game.sandboxMode && waveNum > 40 && waveNum % 10 === 0) {
                    this.abilities.weapon = { ...BOSS_WEAPONS.VOID_BLADE, lastAttack: 0 };
                    boss.color = '#6a0dad';
                }
                break;
        }
    },
    
    // Start asteroid shower (wave 20)
    startAsteroids() {
        if (this.asteroidTimer) clearInterval(this.asteroidTimer);
        this.asteroidTimer = setInterval(() => {
            if (Game.waveActive && Monsters.active.some(m => m.isBoss)) {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (Game.waveActive) this.spawnAsteroid();
                    }, i * 200);
                }
            } else if (!Game.waveActive) {
                clearInterval(this.asteroidTimer);
                this.asteroidTimer = null;
            }
        }, 4000);
    },
    
    // Spawn a single asteroid
    spawnAsteroid() {
        if (!Game.waveActive) return;
        const boss = Monsters.active.find(m => m.isBoss);
        if (!boss) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const x = boss.x + Math.cos(angle) * distance;
        const y = boss.y + Math.sin(angle) * distance;
        const radius = 40;
        
        Effects.asteroidWarning(x, y, radius);
        
        setTimeout(() => {
            if (!Game.waveActive) return;
            
            // Damage player
            if (Player.entity && Physics.distance({x, y}, Player.entity) < radius + Player.entity.radius) {
                Player.takeDamage(25);
            }
            
            // Damage other monsters
            for (let i = Monsters.active.length - 1; i >= 0; i--) {
                const m = Monsters.active[i];
                if (m.isBoss) continue;
                if (Physics.distance({x, y}, m) < radius + m.radius) {
                    m.health -= 75;
                    Effects.damageIndicator(m.x, m.y, 75, true);
                    if (m.health <= 0) Monsters.handleDeath(m, i);
                }
            }
            
            Effects.asteroidImpact(x, y, radius);
        }, 800);
    },
    
    // Start void zones (wave 40)
    startVoidZones() {
        setInterval(() => {
            if (Game.waveActive && Monsters.active.some(m => m.isBoss)) {
                const boss = Monsters.active.find(m => m.isBoss);
                if (boss && Player.entity) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 150;
                    boss.x = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH - 50, Player.entity.x + Math.cos(angle) * dist));
                    boss.y = Math.max(50, Math.min(CONFIG.CANVAS_HEIGHT - 50, Player.entity.y + Math.sin(angle) * dist));
                    
                    Effects.teleportEffect(boss.x, boss.y);
                    
                    this.abilities.voidZones.push({
                        x: boss.x, y: boss.y,
                        radius: 80,
                        damage: BOSS_WEAPONS.VOID_BLADE.voidZoneDamage,
                        startTime: Date.now(),
                        duration: BOSS_WEAPONS.VOID_BLADE.voidZoneDuration
                    });
                }
            }
        }, 5000);
    },
    
    // Boss ranged attack
    shootProjectiles(boss) {
        if (!this.abilities.weapon || !Player.entity) return;
        
        const weaponData = this.abilities.weapon;
        const angle = Math.atan2(Player.entity.y - boss.y, Player.entity.x - boss.x);
        const projectileCount = Game.difficulty === 'impossible' ? 4 : 
                               Game.difficulty === 'easy' ? 2 : 3;
        
        for (let i = 0; i < projectileCount; i++) {
            const spreadAngle = angle + (i - (projectileCount - 1) / 2) * 0.3;
            Projectiles.spawn({
                x: boss.x,
                y: boss.y,
                angle: spreadAngle,
                speed: 3,
                damage: weaponData.baseDamage * 0.5,
                radius: 8,
                color: boss.color,
                lifetime: 3000,
                isBossProjectile: true
            });
        }
    },
    
    // Boss melee attack
    performMeleeAttack(boss, currentTime) {
        if (!this.abilities.weapon || !Player.entity) return;
        
        const weapon = this.abilities.weapon;
        const dist = Physics.distance(boss, Player.entity);
        
        if (dist <= weapon.range && currentTime - (weapon.lastAttack || 0) > 2000) {
            const angle = Math.atan2(Player.entity.y - boss.y, Player.entity.x - boss.x);
            
            this.abilities.weaponAttack = {
                type: 'melee',
                x: boss.x,
                y: boss.y,
                radius: weapon.range,
                damage: weapon.baseDamage,
                color: weapon.swingColor,
                startTime: currentTime,
                duration: 300,
                swingAngle: weapon.swingAngle,
                meleeType: weapon.meleeType,
                angle: angle,
                pierceCount: weapon.pierceCount || 1,
                voidBlade: weapon === BOSS_WEAPONS.VOID_BLADE,
                lifeSteal: weapon.lifeSteal || 0,
                attackedMonsters: new Set()
            };
            
            weapon.lastAttack = currentTime;
        }
    },
    
    // Update boss
    update(currentTime) {
        const boss = Monsters.active.find(m => m.isBoss);
        if (!boss) return;
        
        // Enrage check (wave 20)
        if (Game.wave === 20 && !this.abilities.enraged && boss.health <= boss.maxHealth / 2) {
            this.abilities.enraged = true;
            boss.attackCooldown = 800;
            boss.color = '#f44';
            boss.speed = boss.originalSpeed * 1.3;
            Messages.show('BOSS ENRAGED!');
        }
        
        // Slow field (wave 30)
        if (this.abilities.slowField && this.abilities.slowField.active && Player.entity) {
            const inField = Physics.distance(boss, Player.entity) < this.abilities.slowField.radius;
            const wasInField = Player.inSlowField;
            Player.inSlowField = inField;
            
            if (inField) {
                Player.speed = (Player.baseSpeed * Player.speedMultiplier) * 0.5;
                if (currentTime - Player.lastSlowFieldTick >= 1000) {
                    Player.baseSpeed = Math.max(1, Player.baseSpeed - 1);
                    Player.speed = (Player.baseSpeed * Player.speedMultiplier) * 0.5;
                    Player.slowFieldTicks++;
                    Player.lastSlowFieldTick = currentTime;
                    Effects.damageIndicator(Player.entity.x, Player.entity.y, 1, false);
                }
            } else if (wasInField) {
                Player.speed = Player.baseSpeed * Player.speedMultiplier;
            }
        }
        
        // Boss dash (wave 30)
        if (Game.wave === 30 && this.abilities.weapon && !this.abilities.dash && 
            currentTime - this.abilities.dashCooldown > 3000 && Player.entity) {
            const dx = Player.entity.x - boss.x;
            const dy = Player.entity.y - boss.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 0) {
                this.abilities.dash = true;
                this.abilities.dashDirection = { x: dx / dist, y: dy / dist };
                this.abilities.dashStart = currentTime;
                this.abilities.dashDistance = 0;
                
                setTimeout(() => {
                    this.abilities.dash = false;
                    this.abilities.dashCooldown = currentTime;
                }, 500);
            }
        }
        
        // Execute dash
        if (this.abilities.dash && this.abilities.dashDirection) {
            const dashSpeed = BOSS_WEAPONS.SCYTHE.dashSpeed;
            boss.x += this.abilities.dashDirection.x * dashSpeed;
            boss.y += this.abilities.dashDirection.y * dashSpeed;
            this.abilities.dashDistance += dashSpeed;
            
            // Collision damage during dash
            if (Player.entity && Physics.distance(boss, Player.entity) < boss.radius + Player.entity.radius) {
                const damage = BOSS_WEAPONS.SCYTHE.baseDamage * 0.5;
                if (Player.takeDamage(damage)) return;
                
                const healAmount = damage * BOSS_WEAPONS.SCYTHE.lifeSteal;
                boss.health = Math.min(boss.maxHealth, boss.health + healAmount);
                Effects.healthPopup(boss.x, boss.y, Math.floor(healAmount));
            }
        }
        
        // Void zones (wave 40)
        if (this.abilities.voidZones.length > 0 && Player.entity) {
            for (let i = this.abilities.voidZones.length - 1; i >= 0; i--) {
                const zone = this.abilities.voidZones[i];
                if (currentTime - zone.startTime > zone.duration) {
                    this.abilities.voidZones.splice(i, 1);
                    continue;
                }
                if (Physics.distance(zone, Player.entity) < zone.radius + Player.entity.radius) {
                    if (!Player.lastVoidTick || currentTime - Player.lastVoidTick > 500) {
                        Player.takeDamage(zone.damage);
                        Player.lastVoidTick = currentTime;
                    }
                }
            }
        }
        
        // Boss attacks
        if (Game.wave !== 30 && Game.wave !== 40) {
            this.performMeleeAttack(boss, currentTime);
        }
    },
    
    // Draw boss attack animations
    drawAttacks() {
        if (!this.abilities.weaponAttack) return;
        
        const ctx = Game.ctx;
        const attack = this.abilities.weaponAttack;
        const currentTime = Date.now();
        const progress = (currentTime - attack.startTime) / attack.duration;
        
        if (progress < 0 || progress > 1) {
            this.abilities.weaponAttack = null;
            return;
        }
        
        ctx.save();
        ctx.translate(attack.x, attack.y);
        const angle = attack.angle;
        const distance = attack.radius * (progress * 1.2);
        const alpha = 1 - progress * 0.7;
        
        // Choose animation based on wave
        switch (Game.wave) {
            case 10: this.drawDagger(ctx, attack, angle, progress, distance, alpha); break;
            case 20: this.drawHammer(ctx, attack, angle, progress, distance, alpha); break;
            case 30: this.drawScythe(ctx, attack, angle, progress, distance, alpha); break;
            case 40: this.drawVoidBlade(ctx, attack, angle, progress, distance, alpha); break;
            default: this.drawVoidBlade(ctx, attack, angle, progress, distance, alpha); break;
        }
        
        ctx.restore();
        
        // Apply damage mid-animation
        if (progress > 0.3 && progress < 0.5 && !attack.damageApplied) {
            attack.damageApplied = true;
            this.applyAttackDamage(attack);
        }
    },
    
    // Apply boss melee damage
    applyAttackDamage(attack) {
        // Damage player
        if (Player.entity && 
            Physics.distance(attack, Player.entity) < attack.radius + Player.entity.radius) {
            Player.takeDamage(attack.damage, { health: 0 });
        }
        
        // Damage other monsters (for certain attacks)
        for (let monster of Monsters.active) {
            if (monster.isBoss) continue;
            if (Physics.distance(attack, monster) < attack.radius + monster.radius) {
                monster.health -= attack.damage;
                Effects.damageIndicator(monster.x, monster.y, attack.damage, true);
            }
        }
    },
    
    // Drawing functions for boss weapons
    drawDagger(ctx, attack, angle, progress, distance, alpha) {
        const stabProgress = Math.min(progress * 2, 1);
        const stabDistance = distance * 1.5;
        ctx.rotate(angle);
        ctx.translate(stabDistance, 0);
        ctx.shadowColor = 'rgba(139,0,0,0.7)';
        ctx.shadowBlur = 20 * alpha;
        
        ctx.save();
        const bladeGradient = ctx.createLinearGradient(0, -5, 60, -5);
        bladeGradient.addColorStop(0, '#8B0000');
        bladeGradient.addColorStop(1, '#F44');
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(60, -3); ctx.lineTo(60, 3); ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(60, -3);
        ctx.moveTo(0, 5); ctx.lineTo(60, 3);
        ctx.stroke();
        ctx.restore();
    },
    
    drawHammer(ctx, attack, angle, progress, distance, alpha) {
        ctx.rotate(angle);
        const lift = Math.sin(progress * Math.PI) * 50;
        const smashY = progress < 0.3 ? -lift : (progress > 0.6 ? (progress - 0.6) * 60 : 0);
        ctx.translate(30, -50 + lift - smashY);
        ctx.shadowColor = 'rgba(105,105,105,0.7)';
        ctx.shadowBlur = 30 * alpha;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-5, 0, 10, 80);
        
        ctx.save();
        ctx.translate(0, -25);
        ctx.fillStyle = '#696969';
        ctx.fillRect(-25, -25, 50, 35);
        ctx.fillStyle = '#808080';
        ctx.fillRect(-30, -25, 10, 35);
        ctx.fillRect(20, -25, 10, 35);
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-25, -35, 50, 10);
        ctx.restore();
    },
    
    drawScythe(ctx, attack, angle, progress, distance, alpha) {
        const swingProgress = Math.sin(progress * Math.PI);
        const currentAngle = angle - 1 + swingProgress * 2;
        ctx.rotate(currentAngle);
        ctx.shadowColor = 'rgba(75,0,130,0.7)';
        ctx.shadowBlur = 20 * alpha;
        
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-5, -attack.radius * 0.8, 10, attack.radius * 1.6);
        
        ctx.save();
        ctx.translate(0, -attack.radius * 0.6);
        ctx.rotate(-0.5);
        const bladeGradient = ctx.createLinearGradient(0, -20, 80, -20);
        bladeGradient.addColorStop(0, '#4B0082');
        bladeGradient.addColorStop(1, '#9400D3');
        ctx.fillStyle = bladeGradient;
        ctx.shadowColor = 'rgba(148,0,211,0.7)';
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(80, -25); ctx.lineTo(80, -5); ctx.lineTo(0, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    
    drawVoidBlade(ctx, attack, angle, progress, distance, alpha) {
        const swingProgress = Math.sin(progress * Math.PI);
        const currentAngle = angle - 1.5 + swingProgress * 3;
        ctx.rotate(currentAngle);
        ctx.shadowColor = '#6a0dad';
        ctx.shadowBlur = 25 * alpha;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-8, -attack.radius * 0.6, 16, attack.radius * 1.2);
        
        ctx.save();
        ctx.translate(0, -attack.radius * 0.4);
        ctx.rotate(-0.4);
        const bladeGradient = ctx.createLinearGradient(0, -25, 90, -25);
        bladeGradient.addColorStop(0, '#0f0f1f');
        bladeGradient.addColorStop(1, '#6a0dad');
        ctx.fillStyle = bladeGradient;
        ctx.shadowColor = '#9b59b6';
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(90, -30); ctx.lineTo(90, -10); ctx.lineTo(0, 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
};
