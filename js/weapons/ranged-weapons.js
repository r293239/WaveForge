// ============================================
// WAVEFORGE - Ranged Weapons
// ============================================

const RangedWeapons = {
    createProjectile(weapon, playerX, playerY, angle, currentTime) {
        switch (weapon.id) {
            case 'shotgun': return this.createShotgun(weapon, playerX, playerY, angle, currentTime);
            case 'boomerang': return this.createBoomerang(weapon, playerX, playerY, angle, currentTime);
            case 'throwing_knives': return this.createThrowingKnife(weapon, playerX, playerY, angle, currentTime);
            case 'sniper': return this.createSniper(weapon, playerX, playerY, angle, currentTime);
            case 'crossbow': return this.createCrossbow(weapon, playerX, playerY, angle, currentTime);
            case 'laser': return this.createLaser(weapon, playerX, playerY, angle, currentTime);
            case 'machinegun': return this.createMachinegun(weapon, playerX, playerY, angle, currentTime);
            default: return this.createDefault(weapon, playerX, playerY, angle, currentTime);
        }
    },
    
    createShotgun(weapon, x, y, angle, time) {
        const projectiles = [];
        for (let i = 0; i < weapon.pelletCount; i++) {
            const spread = (Math.random() - 0.5) * (weapon.spreadAngle * Math.PI / 180);
            projectiles.push({ type: 'ranged', x, y, angle: angle + spread, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'shotgun', isPellet: true, startTime: time, size: 3, weaponRef: weapon });
        }
        return projectiles;
    },
    
    createBoomerang(weapon, x, y, angle, time) {
        // Limit to one boomerang unless doubleThrow
        if (!weapon.doubleThrow) {
            const existing = Projectiles.active.find(p => p.weaponId === 'boomerang' && !p.orbiting);
            if (existing) return null;
        }

        // Determine target position (nearest monster or a point in the thrown direction)
        let targetX, targetY;
        if (Monsters.active.length > 0 && Player.entity) {
            let nearest = null, nd = Infinity;
            for (const m of Monsters.active) {
                const d = Physics.distance(Player.entity, m);
                if (d < nd) { nd = d; nearest = m; }
            }
            if (nearest) {
                targetX = nearest.x;
                targetY = nearest.y;
            } else {
                targetX = x + Math.cos(angle) * weapon.range;
                targetY = y + Math.sin(angle) * weapon.range;
            }
        } else {
            targetX = x + Math.cos(angle) * weapon.range;
            targetY = y + Math.sin(angle) * weapon.range;
        }

        // Build circular arc from player (P) to target (T) and back
        const px = x, py = y;
        const tx = targetX, ty = targetY;
        const midX = (px + tx) / 2, midY = (py + ty) / 2;
        const dx = tx - px, dy = ty - py;
        const dist = Math.hypot(dx, dy) || 1;

        // Perpendicular direction (choose one side for the arc)
        const perpX = -dy / dist, perpY = dx / dist;
        // Arc curvature (higher = tighter circle)
        const arcFactor = 0.7;
        const offset = dist * arcFactor;
        const cx = midX + perpX * offset;
        const cy = midY + perpY * offset;
        const radius = Math.hypot(px - cx, py - cy);

        const startAngle = Math.atan2(py - cy, px - cx);
        const targetAngle = Math.atan2(ty - cy, tx - cx);

        // Determine the shortest angular direction to sweep from start to target
        let angleDiff = targetAngle - startAngle;
        angleDiff = ((angleDiff % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
        const direction = angleDiff <= Math.PI ? 1 : -1;

        // Angular speed – based on linear speed and radius
        const linearSpeed = 8;
        const angleStep = linearSpeed / radius;

        return {
            type: 'ranged',
            x, y,
            startX: x, startY: y,
            angle: 0,
            speed: 0,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'boomerang',
            isBoomerang: true,
            state: 'thrown',           // 'thrown' → once it passes target it's returning
            orbiting: false,
            distanceTraveled: 0,
            targetsHit: [],
            maxTargets: weapon.maxTargets || 4,
            rotation: 0,
            startTime: time,
            size: 4,
            weaponRef: weapon,
            // Arc data
            arcCenterX: cx,
            arcCenterY: cy,
            arcRadius: radius,
            arcStartAngle: startAngle,
            arcTargetAngle: targetAngle,
            arcDirection: direction,
            arcAngleStep: angleStep,
            currentArcAngle: startAngle,
            passedTarget: false
        };
    },
    
    createThrowingKnife(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle: angle + (Math.random() - 0.5) * weapon.spread, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'knife', isThrowable: true, startTime: time, size: weapon.projectileSize || 6, spinSpeed: weapon.spinSpeed || 0, rotation: 0, weaponRef: weapon };
    },
    
    createSniper(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'sniper', startTime: time, size: 6, weaponRef: weapon, sniper: true };
    },
    
    createCrossbow(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'bolt', startTime: time, size: 5, weaponRef: weapon, pierceCount: weapon.pierceCount, piercedEnemies: [] };
    },
    
    createLaser(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'laser', bounceCount: weapon.bounceCount, bounceRange: weapon.bounceRange, targetsHit: [], startTime: time, size: 4, weaponRef: weapon };
    },
    
    createMachinegun(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle: angle + (Math.random() - 0.5) * weapon.spread, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: 'bullet', startTime: time, size: 3, weaponRef: weapon };
    },
    
    createDefault(weapon, x, y, angle, time) {
        return { type: 'ranged', x, y, angle: angle + (Math.random() - 0.5) * weapon.spread, speed: weapon.projectileSpeed, range: weapon.range, damage: weapon.baseDamage, color: weapon.projectileColor, weaponId: weapon.id, animation: weapon.animation, bounceCount: weapon.bounceCount, bounceRange: weapon.bounceRange, targetsHit: [], startTime: time, size: 4, weaponRef: weapon };
    }
};
