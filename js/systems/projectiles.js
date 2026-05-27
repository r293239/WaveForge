// ============================================
// WAVEFORGE - Projectile System
// ============================================

const boomerangProjImage = new Image();
boomerangProjImage.src = 'assets/boomerang.png';

const Projectiles = {
    active: [], bossProjectiles: [], monsterProjectiles: [],
    
    init() { this.active = []; this.bossProjectiles = []; this.monsterProjectiles = []; },
    reset() { this.active = []; this.bossProjectiles = []; this.monsterProjectiles = []; },
    
    spawn(data) { data.distanceTraveled = 0; data.startTime = data.startTime || Date.now(); data.targetsHit = data.targetsHit || []; this.active.push(data); return data; },
    
    shootGunner(monster) {
        if (!Player.entity) return;
        const angle = Math.atan2(Player.entity.y - monster.y, Player.entity.x - monster.x);
        this.monsterProjectiles.push({ x: monster.x, y: monster.y, angle, speed: 3, damage: monster.damage * 0.5, color: '#FF0', startTime: Date.now(), lifetime: 2000, radius: 5, type: 'monster' });
    },
    
    shootBoss(boss) {
        if (!Player.entity) return;
        const angle = Math.atan2(Player.entity.y - boss.y, Player.entity.x - boss.x);
        const count = Game.difficulty === 'impossible' ? 4 : Game.difficulty === 'easy' ? 2 : 3;
        for (let i = 0; i < count; i++) { const spreadAngle = angle + (i - (count - 1) / 2) * 0.3; this.bossProjectiles.push({ x: boss.x, y: boss.y, angle: spreadAngle, speed: 3, damage: 15, radius: 8, color: boss.color, startTime: Date.now(), lifetime: 3000, type: 'boss' }); }
    },
    
    update(currentTime) { this.updatePlayerProjectiles(currentTime); this.updateBossProjectiles(currentTime); this.updateMonsterProjectiles(currentTime); },
    
    updatePlayerProjectiles(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const proj = this.active[i];
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            proj.distanceTraveled = (proj.distanceTraveled || 0) + proj.speed;
            
            if (proj.isBoomerang) { this.updateBoomerang(proj, i); continue; }
            if (proj.isThrownTrident) { this.updateThrownTrident(proj, i); continue; }
            
            if (proj.distanceTraveled > proj.range || !Arena.isInBounds(proj.x, proj.y)) {
                this.active.splice(i, 1);
                continue;
            }
            
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const m = Monsters.active[j];
                if (Physics.distance(proj, m) < m.radius + (proj.size || 4)) {
                    this.applyProjectileDamage(proj, m, j, i);
                    break;
                }
            }
        }
    },
    
    updateBoomerang(proj, index) {
        if (!Player.entity) { this.active.splice(index, 1); return; }

        if (proj.state === 'thrown') {
            // Advance along the circular arc
            proj.currentArcAngle += proj.arcAngleStep * proj.arcDirection;
            proj.x = proj.arcCenterX + Math.cos(proj.currentArcAngle) * proj.arcRadius;
            proj.y = proj.arcCenterY + Math.sin(proj.currentArcAngle) * proj.arcRadius;
            proj.distanceTraveled += proj.arcAngleStep * proj.arcRadius;  // approximate

            // Check if we've passed the target angle
            if (!proj.passedTarget) {
                const diff = proj.currentArcAngle - proj.arcStartAngle;
                const targetDiff = proj.arcTargetAngle - proj.arcStartAngle;
                if (proj.arcDirection === 1 && diff >= targetDiff) proj.passedTarget = true;
                else if (proj.arcDirection === -1 && diff <= targetDiff) proj.passedTarget = true;
            }

            // Hit detection
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const m = Monsters.active[j];
                if (proj.targetsHit.includes(m)) continue;
                if (Physics.distance(proj, m) < m.radius + (proj.size || 4)) {
                    this.applyProjectileDamage(proj, m, j, index);
                    proj.targetsHit.push(m);
                    // If max targets reached, transition to returning early
                    if (proj.targetsHit.length >= (proj.maxTargets || 4)) {
                        proj.state = 'returning';
                        proj.speed = 12;
                        proj.angle = Math.atan2(Player.entity.y - proj.y, Player.entity.x - proj.x);
                        return;
                    }
                    break;
                }
            }

            // Check if boomerang has completed the full circle and is back near the player
            const dx = Player.entity.x - proj.x;
            const dy = Player.entity.y - proj.y;
            const distToPlayer = Math.hypot(dx, dy);
            // Return to player if we've passed the target and are close enough
            if (proj.passedTarget && distToPlayer < 40) {
                proj.state = 'returning';
                proj.speed = 12;
                proj.angle = Math.atan2(dy, dx);
                return;
            }

            // Safety: if it goes too far, force return
            if (proj.distanceTraveled > proj.range * 2) {
                proj.state = 'returning';
                proj.speed = 12;
                proj.angle = Math.atan2(Player.entity.y - proj.y, Player.entity.x - proj.x);
            }
            return;
        }

        if (proj.state === 'returning') {
            const dx = Player.entity.x - proj.x;
            const dy = Player.entity.y - proj.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 20) {
                // Caught – remove projectile or reset for next throw
                this.active.splice(index, 1);
                return;
            }
            proj.angle = Math.atan2(dy, dx);
            proj.speed = 12;
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;

            // Deal damage while returning
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const m = Monsters.active[j];
                if (proj.targetsHit.includes(m)) continue;
                if (Physics.distance(proj, m) < m.radius + (proj.size || 4)) {
                    this.applyProjectileDamage(proj, m, j, index);
                    proj.targetsHit.push(m);
                    break;
                }
            }
            return;
        }

        // Fallback for old orbiting state (should not be used with new creation)
        if (proj.state === 'orbiting') {
            proj.orbitAngle += proj.orbitSpeed;
            proj.x = Player.entity.x + Math.cos(proj.orbitAngle) * proj.orbitRadius;
            proj.y = Player.entity.y + Math.sin(proj.orbitAngle) * proj.orbitRadius;
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const m = Monsters.active[j];
                if (proj.targetsHit.includes(m)) continue;
                if (Physics.distance(proj, m) < m.radius + (proj.size || 4)) {
                    this.applyProjectileDamage(proj, m, j, index);
                    proj.targetsHit.push(m);
                    if (proj.targetsHit.length >= (proj.maxTargets || 4)) {
                        proj.state = 'returning';
                        proj.orbiting = false;
                        proj.speed = 15;
                        proj.angle = Math.atan2(Player.entity.y - proj.y, Player.entity.x - proj.x);
                        return;
                    }
                    break;
                }
            }
        }
    },
    
    updateThrownTrident(proj, index) {
        if (proj.distanceTraveled > proj.range || !Arena.isInBounds(proj.x, proj.y)) { this.dropTrident(proj, index); return; }
        for (let j = Monsters.active.length - 1; j >= 0; j--) { const m = Monsters.active[j]; if (proj.piercedEnemies.includes(m)) continue; if (Physics.distance(proj, m) < m.radius + (proj.size || 4)) { let dmg = proj.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage; m.health -= dmg; Effects.damageIndicator(m.x, m.y, Math.floor(dmg), false); if (proj.lightningStrike) this.applyLightningStrike(m); proj.piercedEnemies.push(m); if (proj.piercedEnemies.length > proj.pierceCount) { this.dropTrident(proj, index); return; } if (m.health <= 0) Monsters.handleDeath(m, j); } }
    },
    
    dropTrident(proj, index) { proj.speed = 0; if (proj.weaponRef) { proj.weaponRef.isThrown = true; proj.weaponRef.thrownX = proj.x; proj.weaponRef.thrownY = proj.y; } this.active.splice(index, 1); },
    
    applyLightningStrike(monster) { const targets = [monster]; for (let i = 0; i < 3; i++) { const last = targets[targets.length-1]; let nearest = null, nd = 100; for (let o of Monsters.active) { if (targets.includes(o)) continue; const d = Physics.distance(last, o); if (d < nd) { nd = d; nearest = o; } } if (nearest) targets.push(nearest); else break; } for (let i = 0; i < targets.length; i++) { targets[i].health -= 25; Effects.damageIndicator(targets[i].x, targets[i].y, 25, true); if (i > 0) Effects.lightningBolt(targets[i-1].x, targets[i-1].y, targets[i].x, targets[i].y); } },
    
    applyProjectileDamage(proj, monster, mi, pi) {
        let dmg = proj.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage;
        if (Math.random() < Player.criticalChance) { dmg *= 2; Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), true); } else Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), false);
        monster.health -= dmg; if (Player.lifeSteal > 0) { const h = Math.floor(dmg * Player.lifeSteal); if (h > 0) Player.heal(h); }
        if (proj.weaponRef && proj.weaponRef.isThrowable) proj.weaponRef.trackKnifeHit(monster);
        if (proj.weaponRef && proj.weaponRef.explosiveShot) { const er = proj.weaponRef.explosiveRadius || 50, ed = proj.weaponRef.explosiveDamage || 25; Effects.explosion(monster.x, monster.y, er, '#FF6600'); for (let k = Monsters.active.length - 1; k >= 0; k--) { if (k === mi) continue; const o = Monsters.active[k]; if (Physics.distance(monster, o) < er + o.radius) { o.health -= ed; Effects.damageIndicator(o.x, o.y, ed, false); if (o.health <= 0) Monsters.handleDeath(o, k); } } }
        if (!proj.isBoomerang && !proj.bounceCount && !proj.isThrownTrident) this.active.splice(pi, 1);
        else if (proj.bounceCount > 0) { proj.bounceCount--; proj.targetsHit.push(monster); if (proj.bounceCount <= 0) this.active.splice(pi, 1); else { let nearest = null, nd = proj.bounceRange || 100; for (let k = 0; k < Monsters.active.length; k++) { if (k === mi || proj.targetsHit.includes(Monsters.active[k])) continue; const d = Physics.distance(monster, Monsters.active[k]); if (d < nd) { nd = d; nearest = Monsters.active[k]; } } if (nearest) { proj.angle = Math.atan2(nearest.y - monster.y, nearest.x - monster.x); proj.x = monster.x; proj.y = monster.y; proj.distanceTraveled = 0; } else this.active.splice(pi, 1); } }
        if (monster.health <= 0) Monsters.handleDeath(monster, mi);
    },
    
    updateBossProjectiles(currentTime) { for (let i = this.bossProjectiles.length - 1; i >= 0; i--) { const p = this.bossProjectiles[i]; p.x += Math.cos(p.angle) * p.speed; p.y += Math.sin(p.angle) * p.speed; if (currentTime - p.startTime > p.lifetime) { this.bossProjectiles.splice(i, 1); continue; } if (Player.entity && Physics.distance(p, Player.entity) < p.radius + Player.entity.radius) { Player.takeDamage(p.damage); this.bossProjectiles.splice(i, 1); } } },
    updateMonsterProjectiles(currentTime) { for (let i = this.monsterProjectiles.length - 1; i >= 0; i--) { const p = this.monsterProjectiles[i]; p.x += Math.cos(p.angle) * p.speed; p.y += Math.sin(p.angle) * p.speed; if (currentTime - p.startTime > p.lifetime) { this.monsterProjectiles.splice(i, 1); continue; } if (Player.entity && Physics.distance(p, Player.entity) < 5 + Player.entity.radius) { Player.takeDamage(p.damage); this.monsterProjectiles.splice(i, 1); } } },
    
    draw() {
        const ctx = Game.ctx;
        for (let proj of this.active) { ctx.save(); if (proj.isBoomerang) this.drawBoomerang(ctx, proj); else if (proj.isThrownTrident) this.drawThrownTridentProjectile(ctx, proj); else if (proj.animation === 'knife') this.drawKnife(ctx, proj); else if (proj.animation === 'laser') this.drawLaser(ctx, proj); else if (proj.animation === 'sniper') this.drawSniper(ctx, proj); else if (proj.animation === 'bolt') this.drawCrossbowBolt(ctx, proj); else this.drawBullet(ctx, proj); ctx.restore(); }
        for (let weapon of Player.weapons) { if (weapon.id === 'spear' && weapon.isThrown) this.drawDroppedTrident(weapon); }
        for (let proj of this.bossProjectiles) { const age = Date.now() - proj.startTime, alpha = Math.min(1, 1 - age / proj.lifetime); ctx.save(); ctx.translate(proj.x, proj.y); ctx.shadowColor = proj.color; ctx.shadowBlur = 15 * alpha; ctx.fillStyle = proj.color; ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(0, 0, proj.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        for (let proj of this.monsterProjectiles) { ctx.save(); ctx.translate(proj.x, proj.y); ctx.shadowColor = proj.color; ctx.shadowBlur = 10; ctx.fillStyle = proj.color; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    },
    
    drawBullet(ctx, proj) { ctx.shadowColor = proj.color; ctx.shadowBlur = 10; ctx.fillStyle = proj.color; ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.size || 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = proj.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(proj.x - Math.cos(proj.angle) * 8, proj.y - Math.sin(proj.angle) * 8); ctx.lineTo(proj.x, proj.y); ctx.stroke(); },
    drawCrossbowBolt(ctx, proj) { ctx.save(); ctx.translate(proj.x, proj.y); ctx.rotate(proj.angle); ctx.fillStyle = '#8B4513'; ctx.fillRect(-15, -1, 30, 2); ctx.fillStyle = '#C0C0C0'; ctx.beginPath(); ctx.moveTo(15, -4); ctx.lineTo(25, 0); ctx.lineTo(15, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#F00'; ctx.beginPath(); ctx.moveTo(-15, -3); ctx.lineTo(-25, -6); ctx.lineTo(-15, -1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-15, 3); ctx.lineTo(-25, 6); ctx.lineTo(-15, 1); ctx.closePath(); ctx.fill(); ctx.restore(); },
    drawThrownTridentProjectile(ctx, proj) {
        // FIX: Tip points in movement direction (no more + Math.PI/2)
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);
        ctx.shadowColor = '#CD7F32';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-15, -2, 30, 4);   // shaft from -15 to +15
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        // Prongs at the tip (right end)
        ctx.beginPath();
        ctx.moveTo(15, 0); ctx.lineTo(8, -6);
        ctx.moveTo(15, 0); ctx.lineTo(8, 6);
        ctx.moveTo(15, 0); ctx.lineTo(5, 0); ctx.lineTo(-2, -3);
        ctx.moveTo(15, 0); ctx.lineTo(5, 0); ctx.lineTo(-2, 3);
        ctx.stroke();
        ctx.restore();
    },
    drawDroppedTrident(weapon) { const ctx = Game.ctx; if (!Player.entity) return; const dist = Physics.distance(Player.entity, { x: weapon.thrownX, y: weapon.thrownY }); ctx.save(); ctx.translate(weapon.thrownX, weapon.thrownY); ctx.rotate(-0.3 + Math.sin(Date.now() * 0.002) * 0.1); ctx.shadowColor = dist < weapon.pickupRange ? '#FFD700' : '#CD7F32'; ctx.shadowBlur = dist < weapon.pickupRange ? 15 : 5; ctx.fillStyle = '#8B4513'; ctx.fillRect(-2, -25, 4, 35); ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-8, -35); ctx.moveTo(0, -25); ctx.lineTo(8, -35); ctx.moveTo(0, -25); ctx.lineTo(0, -38); ctx.stroke(); ctx.restore(); if (dist < weapon.pickupRange) { weapon.isThrown = false; weapon.thrownX = 0; weapon.thrownY = 0; Messages.show('Trident retrieved!', 1000); } },
    drawBoomerang(ctx, proj) {
        proj.rotation = (proj.rotation || 0) + (proj.state === 'thrown' ? 0.2 : 0.15);
        if (boomerangProjImage.complete && boomerangProjImage.naturalWidth > 0) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(proj.rotation);
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 10;
            ctx.drawImage(boomerangProjImage, -20, -20, 40, 40);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(proj.rotation);
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(20, -10);
            ctx.lineTo(25, 0);
            ctx.lineTo(20, 10);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    },
    drawKnife(ctx, proj) { proj.rotation = (proj.rotation || 0) + (proj.spinSpeed || 0.3); ctx.save(); ctx.translate(proj.x, proj.y); ctx.rotate(proj.rotation); ctx.fillStyle = '#C0C0C0'; ctx.strokeStyle = '#808080'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -proj.size); ctx.lineTo(proj.size, 0); ctx.lineTo(0, proj.size); ctx.lineTo(-proj.size, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); },
    drawLaser(ctx, proj) { const pulse = Math.sin(Date.now() * 0.02) * 2; ctx.shadowColor = '#0FF'; ctx.shadowBlur = 20; ctx.strokeStyle = '#0FF'; ctx.lineWidth = 4 + pulse; ctx.beginPath(); ctx.moveTo(proj.x - Math.cos(proj.angle) * 10, proj.y - Math.sin(proj.angle) * 10); ctx.lineTo(proj.x, proj.y); ctx.stroke(); ctx.fillStyle = 'rgba(0,255,255,0.3)'; ctx.beginPath(); ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2); ctx.fill(); },
    drawSniper(ctx, proj) { ctx.save(); ctx.translate(proj.x, proj.y); ctx.shadowColor = '#FF4500'; ctx.shadowBlur = 20; ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-Math.cos(proj.angle) * 15, -Math.sin(proj.angle) * 15); ctx.lineTo(0, 0); ctx.stroke(); ctx.restore(); }
};
