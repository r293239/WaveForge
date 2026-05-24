// ============================================
// WAVEFORGE - Melee Weapons
// ============================================

const MeleeWeapons = {
    createAttack(weapon, playerX, playerY, angle, currentTime) {
        // Dual daggers
        if (weapon.dualStrike) {
            return {
                type: 'melee', x: playerX, y: playerY,
                radius: weapon.range, damage: weapon.baseDamage,
                color: weapon.swingColor, startTime: currentTime,
                duration: 200, swingAngle: weapon.swingAngle,
                meleeType: 'dual', angle: angle,
                pierceCount: weapon.pierceCount,
                weaponId: weapon.id, animation: weapon.animation,
                trailColor: weapon.trailColor, sparkleColor: weapon.sparkleColor,
                bladeColor: weapon.bladeColor, hiltColor: weapon.hiltColor,
                gripColor: weapon.gripColor, dualStrike: true,
                weaponRef: weapon, attackedMonsters: new Set()
            };
        }
        
        // Spear/Trident throw mechanic
        if (weapon.id === 'spear') {
            if (!weapon.isThrown) {
                // Throw the trident
                weapon.isThrown = true;
                const projectile = {
                    type: 'ranged',
                    x: playerX, y: playerY,
                    startX: playerX, startY: playerY,
                    angle: angle,
                    speed: 12,
                    range: weapon.range * 1.5,
                    damage: weapon.baseDamage * 1.5,
                    color: '#CD7F32',
                    weaponId: weapon.id,
                    animation: 'trident',
                    isThrownTrident: true,
                    pierceCount: weapon.pierceCount,
                    piercedEnemies: [],
                    distanceTraveled: 0,
                    startTime: currentTime,
                    size: 8,
                    weaponRef: weapon,
                    lightningStrike: weapon.lightningStrike
                };
                Projectiles.active.push(projectile);
                return null;
            } else {
                // Trident is thrown - use weak melee instead
                return {
                    type: 'melee', x: playerX, y: playerY,
                    radius: 30,
                    damage: weapon.baseDamage * 0.3,
                    color: weapon.swingColor,
                    startTime: currentTime,
                    duration: 200,
                    swingAngle: 45,
                    meleeType: 'single',
                    angle: angle,
                    pierceCount: 0,
                    weaponId: weapon.id,
                    weaponRef: weapon,
                    attackedMonsters: new Set()
                };
            }
        }
        
        // Normal melee attack
        return {
            type: 'melee', x: playerX, y: playerY,
            radius: weapon.range, damage: weapon.baseDamage,
            color: weapon.swingColor, startTime: currentTime,
            duration: 300, swingAngle: weapon.swingAngle,
            meleeType: weapon.meleeType, angle: angle,
            pierceCount: weapon.pierceCount,
            weaponId: weapon.id, animation: weapon.animation,
            trailColor: weapon.trailColor, sparkleColor: weapon.sparkleColor,
            shockwaveColor: weapon.shockwaveColor, shockwaveIntensity: weapon.shockwaveIntensity,
            tier: weapon.tier, bladeColor: weapon.bladeColor,
            hiltColor: weapon.hiltColor, handleColor: weapon.handleColor,
            headColor: weapon.headColor, edgeColor: weapon.edgeColor,
            shaftColor: weapon.shaftColor, prongColor: weapon.prongColor,
            tipColor: weapon.tipColor, gripColor: weapon.gripColor,
            weaponRef: weapon, attackedMonsters: new Set()
        };
    },
    
    drawAttack(attack) {
        const ctx = Game.ctx;
        const currentTime = Date.now();
        const progress = (currentTime - attack.startTime) / attack.duration;
        if (progress < 0 || progress > 1) return;
        
        ctx.save();
        ctx.translate(attack.x, attack.y);
        const distance = attack.radius * (progress * 1.2);
        const alpha = 1 - progress * 0.7;
        
        switch (attack.weaponId) {
            case 'sword': this.drawSword(ctx, attack, distance, progress, alpha); break;
            case 'axe': this.drawBattleAxe(ctx, attack, distance, progress, alpha); break;
            case 'dagger': this.drawDagger(ctx, attack, attack.angle, distance, progress, alpha); break;
            case 'hammer': this.drawHammer(ctx, attack, attack.angle, distance, progress, alpha); break;
            case 'spear': this.drawTrident(ctx, attack, attack.angle, distance, progress, alpha); break;
            case 'dual_daggers': this.drawDualDaggers(ctx, attack, attack.angle, distance, progress, alpha); break;
            default: this.drawDefault(ctx, attack, distance, progress, alpha); break;
        }
        
        ctx.restore();
    },
    
    drawSword(ctx, attack, distance, progress, alpha) {
        const swingProgress = Math.sin(progress * Math.PI);
        const currentAngle = attack.angle - 0.5 + swingProgress * 1;
        ctx.rotate(currentAngle);
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 10 * alpha;
        
        ctx.save();
        ctx.translate(10, 0);
        const gradient = ctx.createLinearGradient(0, -5, attack.radius * 0.9, -5);
        gradient.addColorStop(0, '#C0C0C0');
        gradient.addColorStop(1, '#E8E8E8');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(192,192,192,0.5)';
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(attack.radius * 0.9, -2);
        ctx.lineTo(attack.radius * 0.9, 2);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-5, -4, 15, 8);
        ctx.fillStyle = '#B87333';
        ctx.fillRect(-8, -8, 8, 16);
    },
    
    drawBattleAxe(ctx, attack, distance, progress, alpha) {
        const spinAngle = progress * Math.PI * 4;
        ctx.rotate(spinAngle);
        ctx.shadowColor = 'rgba(139,69,19,0.5)';
        ctx.shadowBlur = 15 * alpha;
        
        ctx.fillStyle = attack.handleColor || '#654321';
        ctx.fillRect(-3, -attack.radius * 0.8, 6, attack.radius * 1.6);
        
        ctx.save();
        ctx.translate(0, -attack.radius * 0.4);
        ctx.rotate(-0.3);
        const bladeGradient = ctx.createLinearGradient(0, -15, 35, -15);
        bladeGradient.addColorStop(0, attack.bladeColor || '#8B4513');
        bladeGradient.addColorStop(1, attack.edgeColor || '#CD7F32');
        ctx.fillStyle = bladeGradient;
        ctx.shadowColor = 'rgba(205,127,50,0.7)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(35, -15);
        ctx.lineTo(35, -3);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        if (progress > 0.3 && progress < 0.7) {
            ctx.save();
            ctx.rotate(0);
            ctx.strokeStyle = `rgba(255,165,0,${alpha * 0.5})`;
            ctx.lineWidth = 3;
            const ringScale = 1 + (progress - 0.3) * 3;
            ctx.beginPath();
            ctx.arc(0, 0, attack.radius * ringScale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },
    
    drawDagger(ctx, attack, angle, distance, progress, alpha) {
        const stabProgress = Math.min(progress * 2, 1);
        const stabDistance = distance * 1.5;
        ctx.rotate(angle);
        ctx.translate(stabDistance, 0);
        ctx.shadowColor = 'rgba(70,130,180,0.5)';
        ctx.shadowBlur = 10 * alpha;
        
        const bladeGradient = ctx.createLinearGradient(0, -3, 40, -3);
        bladeGradient.addColorStop(0, '#4682B4');
        bladeGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(0, -3); ctx.lineTo(40, -1); ctx.lineTo(40, 1); ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-8, -4, 12, 8);
    },
    
    drawHammer(ctx, attack, angle, distance, progress, alpha) {
        ctx.rotate(angle);
        const lift = Math.sin(progress * Math.PI) * 30;
        const smashY = progress < 0.3 ? -lift : (progress > 0.6 ? (progress - 0.6) * 40 : 0);
        ctx.translate(20, -30 + lift - smashY);
        ctx.shadowColor = 'rgba(105,105,105,0.7)';
        ctx.shadowBlur = 20 * alpha;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 0, 6, 50);
        
        ctx.save();
        ctx.translate(0, -15);
        ctx.fillStyle = '#696969';
        ctx.fillRect(-15, -15, 30, 20);
        ctx.fillStyle = '#808080';
        ctx.fillRect(-18, -15, 6, 20);
        ctx.fillRect(12, -15, 6, 20);
        ctx.restore();
    },
    
    drawTrident(ctx, attack, angle, distance, progress, alpha) {
        const thrustProgress = Math.min(progress * 1.5, 1);
        const thrustDistance = distance * 1.3 * thrustProgress;
        ctx.rotate(angle);
        ctx.translate(thrustDistance, 0);
        ctx.shadowColor = 'rgba(50,205,50,0.5)';
        ctx.shadowBlur = 15 * alpha;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, -3, attack.radius + 20, 6);
        
        ctx.save();
        ctx.translate(attack.radius + 10, 0);
        ctx.fillStyle = '#CD7F32';
        ctx.beginPath();
        ctx.moveTo(0, -2); ctx.lineTo(20, -4); ctx.lineTo(20, 4); ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    
    drawDualDaggers(ctx, attack, angle, distance, progress, alpha) {
        ctx.save();
        ctx.rotate(angle - 0.2);
        ctx.translate(distance * 0.8, 0);
        ctx.shadowColor = 'rgba(70,130,180,0.5)';
        ctx.shadowBlur = 10 * alpha;
        ctx.fillStyle = attack.bladeColor || '#4682B4';
        ctx.beginPath();
        ctx.moveTo(0, -3); ctx.lineTo(30, -1); ctx.lineTo(30, 1); ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = attack.hiltColor || '#2F4F4F';
        ctx.fillRect(-5, -4, 8, 8);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(angle + 0.2);
        ctx.translate(distance * 0.8, 0);
        ctx.shadowColor = 'rgba(70,130,180,0.5)';
        ctx.shadowBlur = 10 * alpha;
        ctx.fillStyle = attack.bladeColor || '#4682B4';
        ctx.beginPath();
        ctx.moveTo(0, -3); ctx.lineTo(30, -1); ctx.lineTo(30, 1); ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = attack.hiltColor || '#2F4F4F';
        ctx.fillRect(-5, -4, 8, 8);
        ctx.restore();
    },
    
    drawDefault(ctx, attack, distance, progress, alpha) {
        ctx.rotate(attack.angle);
        ctx.translate(distance, 0);
        ctx.fillStyle = attack.color || '#FFF';
        ctx.shadowColor = attack.color || '#FFF';
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
    }
};
