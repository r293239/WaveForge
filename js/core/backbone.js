// ============================================
// WAVEFORGE - Monster System
// ============================================

const Monsters = {
    active: [],
    spawnIndicators: [],
    
    init() {
        this.active = [];
        this.spawnIndicators = [];
    },
    
    reset() {
        this.active = [];
        this.spawnIndicators = [];
    },
    
    // Create a monster from type
    create(typeKey, isBoss = false, spawnX = null, spawnY = null) {
        const type = MONSTER_TYPES[typeKey];
        if (!type) return null;
        
        const waveConfig = Waves.getWaveConfig(Game.wave);
        let health, damage;
        
        if (isBoss) {
            health = waveConfig.bossHealth || (waveConfig.monsterHealth * type.healthMultiplier);
            damage = waveConfig.monsterDamage * type.damageMultiplier;
        } else {
            health = Math.floor(waveConfig.monsterHealth * type.healthMultiplier * Game.difficultyMultipliers.monsterHealth);
            damage = Math.floor(waveConfig.monsterDamage * type.damageMultiplier);
        }
        
        // Get spawn position
        let x, y;
        if (spawnX !== null && spawnY !== null) {
            x = spawnX;
            y = spawnY;
        } else {
            const pos = Arena.getRandomSpawnPosition();
            x = pos.x;
            y = pos.y;
        }
        
        const radius = (isBoss ? 45 : (15 + Math.random() * 10)) * type.sizeMultiplier;
        
        const monster = {
            x, y, radius,
            hitboxRadius: radius * CONFIG.HITBOX.MONSTER,
            health, maxHealth: health,
            damage,
            speed: (isBoss ? 0.7 : (1 + Game.wave * 0.05)) * type.speed,
            originalSpeed: (isBoss ? 0.7 : (1 + Game.wave * 0.05)) * type.speed,
            color: type.color,
            type: typeKey,
            monsterType: type,
            lastAttack: 0,
            attackCooldown: type.attackCooldown || CONFIG.MONSTER_ATTACK_COOLDOWN,
            isBoss: isBoss || false,
            isMinion: type.isMinion || false,
            isSplitter: type.isSplitter || false,
            isDasher: type.isDasher || false,
            isVampire: type.isVampire || false,
            isGunner: typeKey === 'GUNNER',
            lifeSteal: type.lifeSteal || 0,
            splitCount: type.splitCount || 0,
            splitHealthPercent: type.splitHealthPercent || 0.5,
            dashSpeed: type.dashSpeed || 1.5,
            dashCooldown: type.dashCooldown || 3000,
            lastDash: 0,
            isDashing: false,
            dashTarget: null,
            explosive: type.explosive || false,
            explosionRadius: type.explosionRadius || 100,
            explosionDamage: type.explosionDamage || 3.0,
            attackRange: type.attackRange || 25,
            attackAnimation: null,
            attackAnimStart: 0,
            attackAnimDuration: 300,
            slowed: false,
            slowUntil: 0,
            frozen: false,
            frozenUntil: 0,
            stunned: false,
            stunnedUntil: 0,
            poisoned: false,
            poisonDmg: 0,
            poisonEnd: 0,
            bleeding: false,
            bleedDmg: 0,
            bleedEnd: 0,
            lastPoisonTick: 0,
            lastBleedTick: 0,
            lastFireTick: 0,
            // Monster brain properties
            targetX: x,
            targetY: y,
            flockId: null,
            role: null
        };
        
        Effects.spawnEffect(x, y, type.color);
        this.active.push(monster);
        return monster;
    },
    
    // Spawn monsters for a wave
    spawnWave(waveConfig, isBossWave) {
        const totalMonsters = waveConfig.monsters;
        const monsterTypes = isBossWave ? 
            Waves.getNonBossTypesForWave(Game.wave) : 
            Waves.getMonsterTypesForWave(Game.wave);
        
        const tasks = [];
        for (let i = 0; i < totalMonsters; i++) {
            const typeKey = monsterTypes[i % monsterTypes.length];
            const pos = Arena.getRandomSpawnPosition();
            const delay = Math.random() * 3000;
            tasks.push({ typeKey, x: pos.x, y: pos.y, delay });
        }
        
        tasks.sort((a, b) => a.delay - b.delay);
        
        tasks.forEach(task => {
            Game.pendingSpawns++;
            setTimeout(() => {
                if (Game.state !== GAME_STATE.WAVE) {
                    Game.pendingSpawns--;
                    return;
                }
                
                // Add spawn indicator
                const indicator = {
                    x: task.x, y: task.y,
                    timer: 1000,
                    startTime: Date.now(),
                    isBoss: false
                };
                this.spawnIndicators.push(indicator);
                
                setTimeout(() => {
                    if (Game.state !== GAME_STATE.WAVE) {
                        Game.pendingSpawns--;
                        return;
                    }
                    
                    // Remove indicator
                    const idx = this.spawnIndicators.indexOf(indicator);
                    if (idx > -1) this.spawnIndicators.splice(idx, 1);
                    
                    this.create(task.typeKey, false, task.x, task.y);
                    Game.pendingSpawns--;
                }, 1000);
            }, task.delay);
        });
    },
    
    // Spawn boss
    spawnBoss() {
        const bossX = CONFIG.CANVAS_WIDTH / 2;
        const bossY = CONFIG.CANVAS_HEIGHT / 2;
        
        Game.pendingSpawns++;
        const indicator = {
            x: bossX, y: bossY,
            timer: 2000,
            startTime: Date.now(),
            isBoss: true
        };
        this.spawnIndicators.push(indicator);
        
        setTimeout(() => {
            if (Game.state !== GAME_STATE.WAVE) {
                Game.pendingSpawns--;
                return;
            }
            
            const idx = this.spawnIndicators.indexOf(indicator);
            if (idx > -1) this.spawnIndicators.splice(idx, 1);
            
            const boss = this.create('BOSS', true, bossX, bossY);
            if (boss) {
                boss.lifeSteal = 0.1;
                Boss.setupBoss(boss, Game.wave);
            }
            Game.pendingSpawns--;
        }, 2000);
    },
    
    // Remove a monster
    remove(monster, index) {
        if (index === undefined) {
            index = this.active.indexOf(monster);
        }
        if (index > -1) {
            this.active.splice(index, 1);
        }
        Physics.unregister(monster);
    },
    
    // Handle monster death
    handleDeath(monster, index) {
        // Award gold
        let goldDrop = 0;
        if (monster.monsterType && monster.monsterType.goldDrop) {
            goldDrop = Math.floor(
                (Math.random() * (monster.monsterType.goldDrop.max - monster.monsterType.goldDrop.min + 1) + 
                 monster.monsterType.goldDrop.min) * 
                (1 + Player.goldMultiplier) * 
                Game.difficultyMultipliers.goldGain
            );
        } else {
            goldDrop = Math.floor((5 + Math.random() * 10) * (1 + Player.goldMultiplier) * Game.difficultyMultipliers.goldGain);
        }
        
        Player.addGold(goldDrop);
        Game.addKill();
        Effects.deathEffect(monster.x, monster.y);
        
        // Return throwing knives
        Player.weapons.forEach(weapon => {
            if (weapon.isThrowable) {
                const returned = weapon.returnKnives?.(monster) || 0;
                if (returned > 0) Effects.healthPopup(monster.x, monster.y, returned);
            }
        });
        
        // Explosive death
        if (monster.explosive) {
            this.explode(monster);
        }
        
        // Player explosive kills upgrade
        if (Player.explosiveKills && !monster.isBoss) {
            Effects.explosion(monster.x, monster.y, 80, '#FF6600');
            for (let i = this.active.length - 1; i >= 0; i--) {
                if (i === index) continue;
                const other = this.active[i];
                if (Physics.distance(monster, other) < 80 + other.radius) {
                    other.health -= 50;
                    Effects.damageIndicator(other.x, other.y, 50, false);
                    if (other.health <= 0) this.handleDeath(other, i);
                }
            }
        }
        
        // Splitter death
        if (monster.isSplitter) {
            this.split(monster);
        }
        
        // Cleanup
        MonsterBrain.onMonsterDeath(monster);
        this.remove(monster, index);
    },
    
    // Explode a monster
    explode(monster) {
        const radius = monster.explosionRadius;
        const damage = monster.damage * (monster.explosionDamage || 2);
        Effects.explosion(monster.x, monster.y, radius, '#FF4500');
        
        for (let i = this.active.length - 1; i >= 0; i--) {
            const other = this.active[i];
            if (other === monster) continue;
            if (Physics.distance(monster, other) < radius + other.radius) {
                other.health -= damage;
                Effects.damageIndicator(other.x, other.y, damage, false);
                if (other.health <= 0) this.handleDeath(other, i);
            }
        }
        
        // Damage player if in range
        if (Player.entity && Physics.distance(monster, Player.entity) < radius + Player.entity.radius) {
            Player.takeDamage(damage, monster);
        }
    },
    
    // Split a splitter monster
    split(monster) {
        const count = monster.splitCount || 2;
        const health = Math.floor(monster.maxHealth * (monster.splitHealthPercent || 0.5));
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 30;
            const child = this.create(monster.type, false,
                monster.x + Math.cos(angle) * dist,
                monster.y + Math.sin(angle) * dist
            );
            if (child) {
                child.health = health;
                child.maxHealth = health;
                child.radius = monster.radius * 0.7;
                child.hitboxRadius = child.radius * CONFIG.HITBOX.MONSTER;
                child.isSplitter = false;
                child.color = '#aaffaa';
                child.originalSpeed = monster.originalSpeed * 1.2;
                child.speed = child.originalSpeed;
            }
        }
        
        Effects.explosion(monster.x, monster.y, 50, '#0F0');
    },
    
    // Update all monsters
    update(currentTime) {
        // Update spawn indicators
        for (let i = this.spawnIndicators.length - 1; i >= 0; i--) {
            if (currentTime - this.spawnIndicators[i].startTime > this.spawnIndicators[i].timer) {
                this.spawnIndicators.splice(i, 1);
            }
        }
        
        // Update dashers
        for (let monster of this.active) {
            if (monster.isDasher) this.updateDasher(monster, currentTime);
        }
        
        // Update all monsters
        for (let i = this.active.length - 1; i >= 0; i--) {
            const monster = this.active[i];
            
            // Status effect timers
            if (monster.slowed && monster.slowUntil < currentTime) {
                monster.slowed = false;
                monster.speed = monster.originalSpeed;
            }
            if (monster.frozen && monster.frozenUntil < currentTime) {
                monster.frozen = false;
                monster.speed = monster.originalSpeed;
            }
            if (monster.stunned && monster.stunnedUntil < currentTime) {
                monster.stunned = false;
                monster.speed = monster.originalSpeed;
            }
            
            // Skip movement if frozen, stunned, or dashing
            if (monster.stunned || monster.frozen) continue;
            if (monster.isDasher && monster.isDashing) continue;
            
            // Get movement direction from brain
            const moveDir = MonsterBrain.getMovement(monster);
            
            if (moveDir.x !== 0 || moveDir.y !== 0) {
                monster.x += moveDir.x * monster.speed;
                monster.y += moveDir.y * monster.speed;
            }
            
            // Clamp to arena
            Physics.clampToArena(monster);
            
            // Gunner shooting
            if (monster.isGunner && currentTime - monster.lastAttack >= monster.attackCooldown) {
                Projectiles.shootGunner(monster);
                monster.lastAttack = currentTime;
            }
            
            // Boss shooting
            if (monster.isBoss && currentTime - monster.lastAttack >= monster.attackCooldown) {
                Boss.shootProjectiles(monster);
                monster.lastAttack = currentTime;
            }
            
            // Melee attack on player/towers
            this.checkMeleeAttack(monster, currentTime);
        }
    },
    
    // Update dasher movement
    updateDasher(dasher, currentTime) {
        if (dasher.isDashing) {
            const dx = dasher.dashTarget.x - dasher.x;
            const dy = dasher.dashTarget.y - dasher.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) {
                dasher.isDashing = false;
                dasher.speed = dasher.originalSpeed;
            } else {
                dasher.x += (dx / dist) * dasher.dashSpeed;
                dasher.y += (dy / dist) * dasher.dashSpeed;
            }
        } else if (currentTime - dasher.lastDash >= dasher.dashCooldown && 
                   Player.entity && 
                   Physics.distance(dasher, Player.entity) < 300) {
            dasher.isDashing = true;
            dasher.dashTarget = { x: Player.entity.x, y: Player.entity.y };
            dasher.lastDash = currentTime;
            Effects.shockwave(dasher.x, dasher.y, 30, '#0FF');
        }
    },
    
    // Check if monster can melee attack
    checkMeleeAttack(monster, currentTime) {
        if (currentTime - monster.lastAttack < monster.attackCooldown) return;
        
        // Check towers first
        for (let tower of Towers.healingTowers) {
            const dist = Physics.distance(monster, tower);
            if (dist < monster.attackRange + tower.radius) {
                this.performMeleeAttack(monster, tower, currentTime);
                return;
            }
        }
        
        // Check player
        if (Player.entity) {
            const dist = Physics.distance(monster, Player.entity);
            if (dist < monster.attackRange + Player.entity.radius) {
                this.performMeleeAttack(monster, Player.entity, currentTime);
            }
        }
    },
    
    // Perform melee attack
    performMeleeAttack(monster, target, currentTime) {
        monster.lastAttack = currentTime;
        monster.attackAnimation = {
            startTime: currentTime,
            duration: monster.attackAnimDuration,
            targetX: target.x,
            targetY: target.y
        };
        
        // Damage is applied through animation
    },
    
    // Update status effects (poison, bleed)
    updateStatusEffects(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const monster = this.active[i];
            
            if (monster.poisoned) {
                if (currentTime >= monster.poisonEnd) {
                    monster.poisoned = false;
                } else if (!monster.lastPoisonTick || currentTime - monster.lastPoisonTick >= 1000) {
                    monster.health -= monster.poisonDmg;
                    Effects.damageIndicator(monster.x, monster.y, monster.poisonDmg, false);
                    monster.lastPoisonTick = currentTime;
                    if (monster.health <= 0) {
                        this.handleDeath(monster, i);
                        continue;
                    }
                }
            }
            
            if (monster.bleeding) {
                if (currentTime >= monster.bleedEnd) {
                    monster.bleeding = false;
                } else if (!monster.lastBleedTick || currentTime - monster.lastBleedTick >= 1000) {
                    monster.health -= monster.bleedDmg;
                    Effects.damageIndicator(monster.x, monster.y, monster.bleedDmg, false);
                    monster.lastBleedTick = currentTime;
                    if (monster.health <= 0) {
                        this.handleDeath(monster, i);
                    }
                }
            }
        }
    },
    
    // Draw all monsters
    draw() {
        const ctx = Game.ctx;
        const currentTime = Date.now();
        
        for (let monster of this.active) {
            ctx.save();
            ctx.translate(monster.x, monster.y);
            
            // Body
            ctx.fillStyle = monster.color;
            ctx.shadowColor = monster.color;
            ctx.shadowBlur = monster.isBoss ? 20 : 10;
            ctx.beginPath();
            ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Status effects
            if (monster.stunned && monster.stunnedUntil > currentTime) {
                ctx.fillStyle = 'rgba(255,255,0,0.3)';
                ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.fill();
            }
            if (monster.frozen && monster.frozenUntil > currentTime) {
                ctx.fillStyle = 'rgba(0,255,255,0.3)';
                ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.fill();
            }
            if (monster.isDasher && monster.isDashing) {
                ctx.strokeStyle = '#0FF'; ctx.lineWidth = 3;
                ctx.shadowColor = '#0FF'; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(0, 0, monster.radius + 5, 0, Math.PI * 2); ctx.stroke();
            }
            if (monster.isVampire) {
                ctx.strokeStyle = '#F00'; ctx.lineWidth = 2;
                ctx.shadowColor = '#F00'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(0, 0, monster.radius + 3, 0, Math.PI * 2); ctx.stroke();
            }
            if (monster.poisoned) {
                ctx.strokeStyle = '#0F0'; ctx.lineWidth = 2;
                ctx.shadowColor = '#0F0'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(0, 0, monster.radius + 4, 0, Math.PI * 2); ctx.stroke();
            }
            if (monster.bleeding) {
                ctx.strokeStyle = '#F00'; ctx.lineWidth = 2;
                ctx.shadowColor = '#F00'; ctx.shadowBlur = 8;
                ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.arc(0, 0, monster.radius + 4, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            }
            
            ctx.shadowBlur = 0;
            
            // Outline
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Icon
            if (monster.monsterType && monster.monsterType.icon) {
                ctx.fillStyle = 'white';
                ctx.font = `${monster.radius}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(monster.monsterType.icon, 0, 0);
            }
            
            // Eyes
            const angleToPlayer = Player.entity ? 
                Math.atan2(Player.entity.y - monster.y, Player.entity.x - monster.x) : 0;
            const eyeRadius = monster.radius * 0.2;
            
            ctx.fillStyle = '#FFF';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(Math.cos(angleToPlayer - 0.3) * monster.radius * 0.6, 
                    Math.sin(angleToPlayer - 0.3) * monster.radius * 0.6, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(Math.cos(angleToPlayer + 0.3) * monster.radius * 0.6, 
                    Math.sin(angleToPlayer + 0.3) * monster.radius * 0.6, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(Math.cos(angleToPlayer) * monster.radius * 0.7, 
                    Math.sin(angleToPlayer) * monster.radius * 0.7, eyeRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Health bar
            const hpPercent = Math.max(0, Math.min(1, monster.health / monster.maxHealth));
            const barWidth = monster.radius * 2;
            const barHeight = 4;
            const barX = -monster.radius;
            const barY = -monster.radius - 10;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            if (hpPercent > 0) {
                ctx.fillStyle = hpPercent > 0.5 ? '#0F0' : (hpPercent > 0.2 ? '#FF0' : '#F00');
                ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            }
            
            // Attack animation
            if (monster.attackAnimation) {
                const animProgress = (currentTime - monster.attackAnimation.startTime) / monster.attackAnimation.duration;
                if (animProgress > 1) {
                    monster.attackAnimation = null;
                } else {
                    // Draw attack swipe
                    const alpha = 1 - animProgress;
                    const angle = Math.atan2(
                        monster.attackAnimation.targetY - monster.y,
                        monster.attackAnimation.targetX - monster.x
                    );
                    const swipeDist = monster.attackRange * animProgress;
                    
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(monster.radius, -5);
                    ctx.lineTo(monster.radius + swipeDist, 0);
                    ctx.lineTo(monster.radius, 5);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Apply damage at mid-animation
                    if (animProgress > 0.3 && animProgress < 0.5 && !monster.attackAnimation.damageApplied) {
                        monster.attackAnimation.damageApplied = true;
                        // Damage applied through collision check in update
                    }
                }
            }
            
            ctx.restore();
        }
    },
    
    // Draw spawn indicators
    drawIndicators() {
        const ctx = Game.ctx;
        const currentTime = Date.now();
        
        for (let indicator of this.spawnIndicators) {
            const elapsed = currentTime - indicator.startTime;
            const progress = elapsed / indicator.timer;
            if (elapsed > indicator.timer) continue;
            
            const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
            const alpha = 1 - progress * 0.5;
            
            ctx.save();
            ctx.translate(indicator.x, indicator.y);
            
            if (indicator.isBoss) {
                ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20 * alpha;
                ctx.rotate(elapsed * 0.002);
                ctx.beginPath(); ctx.arc(0, 0, 40 * pulseScale, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.rotate(-elapsed * 0.002);
                ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(30, 30); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(30, -30); ctx.lineTo(-30, 30); ctx.stroke();
            } else {
                ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = '#f00';
                ctx.shadowBlur = 10 * alpha;
                ctx.beginPath(); ctx.arc(0, 0, 25 * pulseScale, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, 15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(-15, 15); ctx.stroke();
            }
            
            ctx.restore();
        }
    }
};
