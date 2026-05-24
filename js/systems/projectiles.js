// ============================================
// WAVEFORGE - Projectile System
// ============================================

// Preload weapon images
const projectileImages = {};
const imagePaths = {
    handgun: 'assets/handgun.png',
    shotgun: 'assets/shotgun.png',
    machinegun: 'assets/machine-gun.png',
    sniper: 'assets/sniper.png',
    crossbow: 'assets/crossbow.png',
    scythe: 'assets/scythe.png'
};

// Load images safely
try {
    for (let [key, path] of Object.entries(imagePaths)) {
        const img = new Image();
        img.onerror = () => console.log(`Image not found: ${path} (using fallback drawing)`);
        img.src = path;
        projectileImages[key] = img;
    }
} catch(e) {
    console.log('Image loading error:', e.message);
}

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
    
    spawn(data) {
        data.distanceTraveled = 0;
        data.startTime = data.startTime || Date.now();
        data.targetsHit = data.targetsHit || [];
        this.active.push(data);
        return data;
    },
    
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
    
    update(currentTime) {
        this.updatePlayerProjectiles(currentTime);
        this.updateBossProjectiles(currentTime);
        this.updateMonsterProjectiles(currentTime);
    },
    
    updatePlayerProjectiles(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const proj = this.active[i];
            
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            proj.distanceTraveled = (proj.distanceTraveled || 0) + proj.speed;
            
            if (proj.isBoomerang) {
                this.updateBoomerang(proj, i);
                continue;
            }
            
            if (proj.isThrownTrident) {
                this.updateThrownTrident(proj, i);
                continue;
            }
            
            if (proj.distanceTraveled > proj.range || !Arena.isInBounds(proj.x, proj.y)) {
                this.active.splice(i, 1);
                continue;
            }
            
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
    
    updateThrownTrident(proj, index) {
        if (proj.distanceTraveled > proj.range || !Arena.isInBounds(proj.x, proj.y)) {
            this.dropTrident(proj, index);
            return;
        }
        
        for (let j = Monsters.active.length - 1; j >= 0; j--) {
            const monster = Monsters.active[j];
            if (proj.piercedEnemies.includes(monster)) continue;
            
            const dist = Physics.distance(proj, monster);
            if (dist < monster.radius + (proj.size || 4)) {
                let dmg = proj.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage;
                monster.health -= dmg;
                Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), false);
                
                if (proj.lightningStrike) {
                    this.applyLightningStrike(monster);
                }
                
                proj.piercedEnemies.push(monster);
                
                if (proj.piercedEnemies.length > proj.pierceCount) {
                    this.dropTrident(proj, index);
                    return;
                }
                
                if (monster.health <= 0) {
                    Monsters.handleDeath(monster, j);
                }
            }
        }
    },
    
    dropTrident(proj, index) {
        proj.speed = 0;
        if (proj.weaponRef) {
            proj.weaponRef.isThrown = true;
            proj.weaponRef.thrownX = proj.x;
            proj.weaponRef.thrownY = proj.y;
        }
        this.active.splice(index, 1);
    },
    
    applyLightningStrike(monster) {
        const targets = [monster];
        const chainRange = 100;
        const maxChains = 3;
        
        for (let i = 0; i < maxChains; i++) {
            const lastTarget = targets[targets.length - 1];
            let nearest = null;
            let nearestDist = chainRange;
            
            for (let other of Monsters.active) {
                if (targets.includes(other)) continue;
                const dist = Physics.distance(lastTarget, other);
                if (dist < nearestDist) { nearestDist = dist; nearest = other; }
            }
            
            if (nearest) { targets.push(nearest); }
            else { break; }
        }
        
        const lightningDamage = 25;
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            target.health -= lightningDamage;
            Effects.damageIndicator(target.x, target.y, lightningDamage, true);
            
            if (i > 0) {
                Effects.lightningBolt(targets[i-1].x, targets[i-1].y, target.x, target.y);
            }
        }
    },
    
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
        
        if (proj.orbiting && Player.entity) {
            proj.orbitAngle += proj.orbitSpeed;
            proj.x = Player.entity.x + Math.cos(proj.orbitAngle) * proj.orbitRadius;
            proj.y = Player.entity.y + Math.sin(proj.orbitAngle) * proj.orbitRadius;
        }
        
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
    
    applyProjectileDamage(proj, monster, monsterIndex, projIndex) {
        let dmg = proj.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage;
        
        if (Math.random() < Player.criticalChance) {
            dmg *= 2;
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), true);
        } else {
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), false);
        }
        
        monster.health -= dmg;
        
        if (Player.lifeSteal > 0) {
            const healAmount = Math.floor(dmg * Player.lifeSteal);
            if (healAmount > 0) Player.heal(healAmount);
        }
        
        if (proj.weaponRef && proj.weaponRef.isThrowable) {
            proj.weaponRef.trackKnifeHit(monster);
        }
        
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
        
        if (!proj.isBoomerang && !proj.bounceCount && !proj.isThrownTrident) {
            this.active.splice(projIndex, 1);
        } else if (proj.bounceCount > 0) {
            proj.bounceCount--;
            proj.targetsHit.push(monster);
            
            if (proj.bounceCount <= 0) {
                this.active.splice(projIndex, 1);
            } else {
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
    
    // ============================================
    // DRAWING
    // ============================================
    
    draw() {
        const ctx = Game.ctx;
        
        for (let proj of this.active) {
            ctx.save();
            if (proj.isBoomerang) {
                this.drawBoomerang(ctx, proj);
            } else if (proj.isThrownTrident) {
                this.drawThrownTridentProjectile(ctx, proj);
            } else if (proj.animation === 'knife') {
                this.drawKnife(ctx, proj);
            } else if (proj.animation === 'laser') {
                this.drawLaser(ctx, proj);
            } else if (proj.animation === 'sniper') {
                this.drawSniper(ctx, proj);
            } else if (proj.animation === 'bolt') {
                this.drawCrossbowBolt(ctx, proj);
            } else if (proj.animation === 'bullet' || proj.animation === 'shotgun') {
                this.drawBullet(ctx, proj);
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
        
        // Draw dropped tridents on ground
        for (let weapon of Player.weapons) {
            if (weapon.id === 'spear' && weapon.isThrown) {
                this.drawDroppedTrident(weapon);
            }
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
    
    drawBullet(ctx, proj) {
        const imgKey = proj.weaponId || 'handgun';
        const img = projectileImages[imgKey];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(proj.angle);
            ctx.drawImage(img, -8, -4, 16, 8);
            ctx.restore();
        } else {
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size || 3, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    drawCrossbowBolt(ctx, proj) {
        const img = projectileImages['crossbow'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(proj.angle);
            ctx.drawImage(img, -15, -4, 30, 8);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(proj.angle);
            // Arrow shaft
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-15, -1, 30, 2);
            // Arrow head
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(15, -4); ctx.lineTo(25, 0); ctx.lineTo(15, 4);
            ctx.closePath();
            ctx.fill();
            // Fletching
            ctx.fillStyle = '#F00';
            ctx.beginPath();
            ctx.moveTo(-15, -3); ctx.lineTo(-25, -6); ctx.lineTo(-15, -1);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-15, 3); ctx.lineTo(-25, 6); ctx.lineTo(-15, 1);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },
    
    drawThrownTridentProjectile(ctx, proj) {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);
        ctx.shadowColor = '#CD7F32';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -15, 4, 30);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(-6, -25); ctx.lineTo(0, -20);
        ctx.moveTo(0, -15); ctx.lineTo(6, -25); ctx.lineTo(0, -20);
        ctx.moveTo(0, -15); ctx.lineTo(0, -28);
        ctx.stroke();
        
        ctx.restore();
    },
    
    drawDroppedTrident(weapon) {
        const ctx = Game.ctx;
        if (!Player.entity) return;
        
        const dist = Physics.distance(Player.entity, { x: weapon.thrownX, y: weapon.thrownY });
        
        ctx.save();
        ctx.translate(weapon.thrownX, weapon.thrownY);
        ctx.rotate(Math.sin(Date.now() * 0.002) * 0.1);
        
        if (dist < weapon.pickupRange) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.01) * 5;
        } else {
            ctx.shadowColor = '#CD7F32';
            ctx.shadowBlur = 5;
        }
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -20, 4, 40);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(-8, -30); ctx.lineTo(0, -25);
        ctx.moveTo(0, -20); ctx.lineTo(8, -30); ctx.lineTo(0, -25);
        ctx.moveTo(0, -20); ctx.lineTo(0, -32);
        ctx.stroke();
        
        ctx.restore();
        
        if (dist < weapon.pickupRange) {
            weapon.isThrown = false;
            weapon.thrownX = 0;
            weapon.thrownY = 0;
            Messages.show('Trident retrieved!', 1000);
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
