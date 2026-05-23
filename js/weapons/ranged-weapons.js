// ============================================
// WAVEFORGE - Ranged Weapons
// ============================================

const RangedWeapons = {
    // Create projectile(s) from ranged weapon
    createProjectile(weapon, playerX, playerY, angle, currentTime) {
        switch (weapon.id) {
            case 'shotgun':
                return this.createShotgun(weapon, playerX, playerY, angle, currentTime);
            case 'boomerang':
                return this.createBoomerang(weapon, playerX, playerY, angle, currentTime);
            case 'throwing_knives':
                return this.createThrowingKnife(weapon, playerX, playerY, angle, currentTime);
            case 'sniper':
                return this.createSniper(weapon, playerX, playerY, angle, currentTime);
            case 'crossbow':
                return this.createCrossbow(weapon, playerX, playerY, angle, currentTime);
            case 'laser':
                return this.createLaser(weapon, playerX, playerY, angle, currentTime);
            case 'machinegun':
                return this.createMachinegun(weapon, playerX, playerY, angle, currentTime);
            default:
                return this.createDefault(weapon, playerX, playerY, angle, currentTime);
        }
    },
    
    createShotgun(weapon, x, y, angle, time) {
        const projectiles = [];
        for (let i = 0; i < weapon.pelletCount; i++) {
            const spread = (Math.random() - 0.5) * (weapon.spreadAngle * Math.PI / 180);
            projectiles.push({
                type: 'ranged', x, y,
                angle: angle + spread,
                speed: weapon.projectileSpeed,
                range: weapon.range,
                damage: weapon.baseDamage,
                color: weapon.projectileColor,
                weaponId: weapon.id,
                animation: 'shotgun',
                isPellet: true,
                startTime: time,
                size: 3,
                weaponRef: weapon
            });
        }
        return projectiles;
    },
    
    createBoomerang(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            startX: x, startY: y,
            angle: angle,
            speed: weapon.projectileSpeed,
            returnSpeed: weapon.returnSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'boomerang',
            isBoomerang: true,
            state: 'outgoing',
            distanceTraveled: 0,
            targetsHit: [],
            maxTargets: weapon.maxTargets,
            rotation: 0,
            startTime: time,
            hitThisFrame: false,
            size: 4,
            weaponRef: weapon
        };
    },
    
    createThrowingKnife(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle + (Math.random() - 0.5) * weapon.spread,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'knife',
            isThrowable: true,
            startTime: time,
            size: weapon.projectileSize || 6,
            spinSpeed: weapon.spinSpeed || 0,
            rotation: 0,
            weaponRef: weapon
        };
    },
    
    createSniper(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'sniper',
            startTime: time,
            size: 6,
            weaponRef: weapon,
            sniper: true
        };
    },
    
    createCrossbow(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'bolt',
            startTime: time,
            size: 5,
            weaponRef: weapon,
            pierceCount: weapon.pierceCount,
            piercedEnemies: []
        };
    },
    
    createLaser(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'laser',
            bounceCount: weapon.bounceCount,
            bounceRange: weapon.bounceRange,
            targetsHit: [],
            startTime: time,
            size: 4,
            weaponRef: weapon
        };
    },
    
    createMachinegun(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle + (Math.random() - 0.5) * weapon.spread,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: 'bullet',
            startTime: time,
            size: 3,
            weaponRef: weapon
        };
    },
    
    createDefault(weapon, x, y, angle, time) {
        return {
            type: 'ranged', x, y,
            angle: angle + (Math.random() - 0.5) * weapon.spread,
            speed: weapon.projectileSpeed,
            range: weapon.range,
            damage: weapon.baseDamage,
            color: weapon.projectileColor,
            weaponId: weapon.id,
            animation: weapon.animation,
            bounceCount: weapon.bounceCount,
            bounceRange: weapon.bounceRange,
            targetsHit: [],
            startTime: time,
            size: 4,
            weaponRef: weapon
        };
    }
};
