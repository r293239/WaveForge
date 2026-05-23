// ============================================
// WAVEFORGE - Projectile System
// ============================================

const Projectiles = {
    active: [],
    bossProjectiles: [],
    monsterProjectiles: [],
    
    init() {
        this.active = [];
        this.bossProjectiles = [];
        this.monsterProjectiles = [];
    },
    
    reset() {
        this.active = [];
        this.bossProjectiles = [];
        this.monsterProjectiles = [];
    },
    
    // Spawn a projectile
    spawn(data) {
        data.distanceTraveled = 0;
        data.startTime = data.startTime || Date.now();
        data.targetsHit = data.targetsHit || [];
        this.active.push(data);
        return data;
    },
    
    // Gunner monster projectile
    shootGunner(monster) {
        if (!Player.entity) return;
        const angle = Math.atan2(Player.entity.y - monster.y, Player.entity.x - monster.x);
        this.monsterProjectiles.push({
            x: monster.x, y: monster.y,
            angle, speed: 3,
            damage: monster.damage * 0.5,
            color: '#FF0',
            startTime: Date.now(),
            lifetime: 2000,
            radius: 5,
            type: 'monster'
        });
    },
    
    // Boss projectile
    shootBoss(boss) {
        if (!Player.entity) return;
        const angle = Math.atan2(Player.entity.y - boss.y, Player.entity.x - boss.x);
        const count = Game.difficulty === 'impossible' ? 4 : Game.difficulty === 'easy' ? 2 : 3;
        
        for (let i = 0; i < count; i++) {
            const spreadAngle = angle + (i - (count - 1) / 2) * 0.3;
            this.bossProjectiles.push({
                x: boss.x, y: boss.y,
                angle: spreadAngle, speed: 3,
                damage: 15,
                radius: 8,
                color: boss.color,
                startTime: Date.now(),
                lifetime: 3000,
                type: 'boss'
            });
        }
    },
    
    // Update all projectiles
    update(currentTime) {
        this.updatePlayerProjectiles(currentTime);
        this.updateBossProjectiles(currentTime);
        this.updateMonsterProjectiles(currentTime);
    },
    
    // Update player projectiles
    updatePlayerProjectiles(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const proj = this.active[i];
            
            // Move
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            proj.distanceTraveled = (proj.distanceTraveled || 0) + proj.speed;
            
            // Boomerang logic
            if (proj.isBoomerang) {
                this.updateBoomerang(proj, i);
                continue;
            }
            
            // Out of bounds / range
            if (proj.distanceTraveled > proj.range || 
                !Arena.isInBounds(proj.x, proj.y)) {
                this.active.splice(i, 1);
                continue;
            }
            
            // Check hits
            let hit = false;
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const monster = Monsters.active[j];
                const dist = Physics.distance(proj, monster);
                
                if (dist < monster.radius + (proj.size || 4)) {
                    hit = true;
                    this.applyProjectileDamage(proj, monster, j, i);
                    break;
                }
            }
        }
    },
    
    // Boomerang update
    updateBoomerang(proj, index) {
        if (proj.state === 'outgoing' && 
            (proj.distanceTraveled >= proj.range || !Arena.isInBounds(proj.x, proj.y))) {
            proj.state = 'returning';
        }
        
        if (proj.state === 'returning') {
            const dx = proj.startX - proj.x;
            const dy = proj.startY - proj.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 20) {
                // Orbital mode
                if (proj.weaponRef && proj.weaponRef.orbitalMode && !proj.orbiting) {
                    proj.orbiting = true;
                    proj.orbitAngle = 0;
                    proj.orbitRadius = 50;
                    proj.orbitSpeed = 0.05;
                    proj.speed = 0;
                    return;
                }
                this.active.splice(index, 1);
                return;
            }
            proj.angle = Math.atan2(dy, dx);
            proj.speed = proj.returnSpeed;
        }
        
        // Orbital mode
        if (proj.orbiting && Player.entity) {
            proj.orbitAngle += proj.orbitSpeed;
            proj.x = Player.entity.x + Math.cos(proj.orbitAngle) * proj.orbitRadius;
            proj.y = Player.entity.y + Math.sin(proj.orbitAngle) * proj.orbitRadius;
        }
        
        // Check hits
        for (let j = Monsters.active.length - 1; j >= 0; j--) {
            const monster = Monsters.active[j];
            if (proj.targetsHit.includes(monster)) continue;
            
            const dist = Physics.distance(proj, monster);
            if (dist < monster.radius + (proj.size || 4)) {
                this.applyProjectileDamage(proj, monster, j, index);
                
                if (proj.targetsHit.length >= (proj.maxTargets || 4)) {
                    proj.state = 'returning';
                }
                break;
            }
        }
    },
    
    // Apply projectile damage
    applyProjectileDamage(proj, monster, monsterIndex, projIndex) {
        let dmg = proj.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage;
        
        if (Math.random() < Player.criticalChance) {
            dmg *= 2;
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), true);
        } else {
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), false);
        }
        
        monster.health -= dmg;
        
        // Life steal
        if (Player.lifeSteal > 0) {
            const healAmount = Math.floor(dmg * Player.lifeSteal);
            if (healAmount > 0) Player.heal(healAmount);
        }
        
        // Throwing knife tracking
        if (proj.weaponRef && proj.weaponRef.isThrowable) {
            proj.weaponRef.trackKnifeHit(monster);
        }
        
        // Explosive shot
        if (proj.weaponRef && proj.weaponRef.explosiveShot) {
            const exRadius = proj.weaponRef.explosiveRadius || 50;
            const exDamage = proj.weaponRef.explosiveDamage || 25;
            Effects.explosion(monster.x, monster.y, exRadius, '#FF6600');
            
            for (let k = Monsters.active.length - 1; k >= 0; k--) {
                if (k === monsterIndex) continue;
                const other = Monsters.active[k];
                if (Physics.distance(monster, other) < exRadius + other.radius) {
                    other.health -= exDamage;
                    Effects.damageIndicator(other.x, other.y, exDamage, false);
                    if (other.health <= 0) Monsters.handleDeath(other, k);
                }
            }
        }
        
        // Remove projectile (unless bouncing/boomerang)
        if (!proj.isBoomerang && !proj.bounceCount) {
            this.active.splice(projIndex, 1);
        } else if (proj.bounceCount > 0) {
            proj.bounceCount--;
            proj.targetsHit.push(monster);
            
            if (proj.bounceCount <= 0) {
                this.active.splice(projIndex, 1);
            } else {
                // Find next bounce target
                let nearest = null;
                let nearestDist = proj.bounceRange || 100;
                for (let k = 0; k < Monsters.active.length; k++) {
                    if (k === monsterIndex || proj.targetsHit.includes(Monsters.active[k])) continue;
                    const d = Physics.distance(monster, Monsters.active[k]);
                    if (d < nearestDist) { nearestDist = d; nearest = Monsters.active[k]; }
                }
                if (nearest) {
                    proj.angle = Math.atan2(nearest.y - monster.y, nearest.x - monster.x);
                    proj.x = monster.x;
                    proj.y = monster.y;
                    proj.distanceTraveled = 0;
                } else {
                    this.active.splice(projIndex, 1);
                }
            }
        }
        
        if (monster.health <= 0) {
            Monsters.handleDeath(monster, monsterIndex);
        }
    },
    
    // Update boss projectiles
    updateBossProjectiles(currentTime) {
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const proj = this.bossProjectiles[i];
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            
            if (currentTime - proj.startTime > proj.lifetime) {
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            if (Player.entity && Physics.distance(proj, Player.entity) < proj.radius + Player.entity.radius) {
                Player.takeDamage(proj.damage);
                this.bossProjectiles.splice(i, 1);
            }
        }
    },
    
    // Update monster projectiles
    updateMonsterProjectiles(currentTime) {
        for (let i = this.monsterProjectiles.length - 1; i >= 0; i--) {
            const proj = this.monsterProjectiles[i];
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            
            if (currentTime - proj.startTime > proj.lifetime) {
                this.monsterProjectiles.splice(i, 1);
                continue;
            }
            
            if (Player.entity && Physics.distance(proj, Player.entity) < 5 + Player.entity.radius) {
                Player.takeDamage(proj.damage);
                this.monsterProjectiles.splice(i, 1);
            }
        }
    },
    
    // Draw all projectiles
    draw() {
        const ctx = Game.ctx;
        
        // Player projectiles
        for (let proj of this.active) {
            ctx.save();
            if (proj.isBoomerang) {
                this.drawBoomerang(ctx, proj);
            } else if (proj.animation === 'knife') {
                this.drawKnife(ctx, proj);
            } else if (proj.animation === 'laser') {
                this.drawLaser(ctx, proj);
            } else if (proj.animation === 'sniper') {
                this.drawSniper(ctx, proj);
            } else {
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = proj.color;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size || 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        
        // Boss projectiles
        for (let proj of this.bossProjectiles) {
            const age = Date.now() - proj.startTime;
            const alpha = Math.min(1, 1 - age / proj.lifetime);
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 15 * alpha;
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Monster projectiles
        for (let proj of this.monsterProjectiles) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    
    drawBoomerang(ctx, proj) {
        proj.rotation = (proj.rotation || 0) + 0.1;
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);
        ctx.shadowColor = '#8B4513';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(20, -10); ctx.lineTo(25, 0);
        ctx.lineTo(20, 10); ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },
    
    drawKnife(ctx, proj) {
        proj.rotation = (proj.rotation || 0) + (proj.spinSpeed || 0.3);
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);
        ctx.fillStyle = '#C0C0C0';
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -proj.size); ctx.lineTo(proj.size, 0);
        ctx.lineTo(0, proj.size); ctx.lineTo(-proj.size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },
    
    drawLaser(ctx, proj) {
        const pulse = Math.sin(Date.now() * 0.02) * 2;
        ctx.shadowColor = '#0FF';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#0FF';
        ctx.lineWidth = 4 + pulse;
        ctx.beginPath();
        ctx.moveTo(proj.x - Math.cos(proj.angle) * 10, proj.y - Math.sin(proj.angle) * 10);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawSniper(ctx, proj) {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(proj.angle) * 15, -Math.sin(proj.angle) * 15);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
    }
};
