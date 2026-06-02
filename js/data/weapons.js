// ============================================
// WAVEFORGE - Weapon Definitions
// ============================================

const WEAPON_DATA = [
    // === RANGED WEAPONS ===
    {
        id: 'handgun', name: 'Handgun', icon: '🔫', type: 'ranged',
        baseDamage: 7, attackSpeed: 1.0, range: 300, projectileSpeed: 10,
        cost: 0, description: 'Basic starting weapon',
        projectileColor: '#FFD700', animation: 'bullet',
        usesAmmo: true, magazineSize: 8, reloadTime: 1500, spread: 0.05,
        tierMultipliers: {
            damage: [1, 1.2, 1.4, 1.7, 2.1, 2.5],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            magazine: [1, 1.2, 1.4, 1.6, 1.8, 2.0]
        }
    },
    {
        id: 'shotgun', name: 'Shotgun', icon: '🔫', type: 'ranged',
        baseDamage: 4, attackSpeed: 0.8, range: 200, projectileSpeed: 8,
        cost: 95, description: '10 pellets in wide arc',
        projectileColor: '#FF6B6B', animation: 'shotgun',
        pelletCount: 10, spreadAngle: 60,
        usesAmmo: true, magazineSize: 6, reloadTime: 2000, spread: 0.2,
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
            attackSpeed: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
            pelletCount: [1, 1, 1, 1.2, 1.4, 1.6],
            magazine: [1, 1.1, 1.2, 1.3, 1.4, 1.5]
        }
    },
    {
        id: 'machinegun', name: 'Machine Gun', icon: '🔫', type: 'ranged',
        baseDamage: 3, attackSpeed: 5.0, range: 275, projectileSpeed: 15,
        cost: 120, description: 'Very fast attacks',
        projectileColor: '#4ECDC4', animation: 'bullet',
        usesAmmo: true, magazineSize: 50, reloadTime: 2500, spread: 0.75,
        tierMultipliers: {
            damage: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            attackSpeed: [1, 1.2, 1.4, 1.6, 1.8, 2.0],
            magazine: [1, 1.3, 1.6, 1.9, 2.2, 2.5]
        }
    },
    {
        id: 'laser', name: 'Energy Gun', icon: '⚡', type: 'ranged',
        baseDamage: 8, attackSpeed: 2.0, range: 400, projectileSpeed: 20,
        cost: 150, description: 'Bounces between enemies',
        projectileColor: '#00FFFF', animation: 'laser',
        bounceCount: 3, bounceRange: 100,
        usesAmmo: true, magazineSize: 15, reloadTime: 1800, spread: 0,
        tierMultipliers: {
            damage: [1, 1.2, 1.4, 1.7, 2.0, 2.4],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            bounceCount: [1, 1, 2, 2, 3, 4],
            magazine: [1, 1.2, 1.4, 1.6, 1.8, 2.0]
        }
    },
    {
        id: 'boomerang', name: 'Boomerang', icon: '🪃', type: 'ranged',
        baseDamage: 5, attackSpeed: 1.2, range: 450, projectileSpeed: 10,
        returnSpeed: 15, cost: 95, description: 'Throws a returning boomerang',
        projectileColor: '#8B4513', animation: 'boomerang',
        usesAmmo: false, maxTargets: 4, spread: 0,
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.4, 2.9],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            range: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            maxTargets: [1, 1, 2, 2, 3, 4]
        }
    },
    {
        id: 'throwing_knives', name: 'Throwing Knives', icon: '🔪', type: 'ranged',
        baseDamage: 7, attackSpeed: 2.0, range: 250, projectileSpeed: 12,
        cost: 55, description: 'Limited knives per round',
        projectileColor: '#C0C0C0', animation: 'knife',
        usesAmmo: true, magazineSize: 7, reloadTime: 0,
        isThrowable: true, resetEachRound: true, spread: 0.02,
        tierMultipliers: {
            damage: [1, 1.2, 1.4, 1.7, 2.0, 2.4],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            magazine: [1, 1.4, 1.8, 2.2, 2.6, 3.0],
            range: [1, 1.1, 1.2, 1.3, 1.4, 1.5]
        }
    },
    {
        id: 'sniper', name: 'Sniper Rifle', icon: '🎯', type: 'ranged',
        baseDamage: 35, attackSpeed: 0.5, range: 500, projectileSpeed: 20,
        cost: 180, description: 'Long range, targets highest HP',
        projectileColor: '#FF4500', animation: 'sniper',
        usesAmmo: true, magazineSize: 3, reloadTime: 2500, spread: 0,
        sniper: true,
        tierMultipliers: {
            damage: [1, 1.4, 1.8, 2.3, 2.9, 3.1],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            magazine: [1, 1, 1.2, 1.4, 1.6, 1.8]
        }
    },
    {
        id: 'crossbow', name: 'Crossbow', icon: '🏹', type: 'ranged',
        baseDamage: 18, attackSpeed: 1.2, range: 350, projectileSpeed: 15,
        cost: 120, description: 'Pierces through enemies',
        projectileColor: '#8B4513', animation: 'bolt',
        usesAmmo: true, magazineSize: 1, reloadTime: 1200, spread: 0,
        pierceCount: 3,
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            pierceCount: [1, 2, 2, 3, 3, 4]
        }
    },
    
    // === MELEE WEAPONS ===
    {
        id: 'sword', name: 'Iron Sword', icon: '⚔️', type: 'melee',
        meleeType: 'single', baseDamage: 10, attackSpeed: 1.2, range: 100,
        cost: 60, description: 'Swing a longsword in an arc',
        swingColor: '#C0C0C0', swingAngle: 90,
        trailColor: '#FFFFFF', sparkleColor: '#FFD700',
        bladeColor: '#C0C0C0', hiltColor: '#8B4513',
        usesAmmo: false,
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            range: [1, 1.1, 1.2, 1.3, 1.4, 1.5]
        }
    },
    {
        id: 'axe', name: 'Battle Axe', icon: '🪓', type: 'melee',
        meleeType: 'aoe', baseDamage: 9, attackSpeed: 0.9, range: 100,
        cost: 100, description: '360° spin with knockback',
        swingColor: '#8B4513', swingAngle: 360,
        trailColor: '#FF4500', sparkleColor: '#FFD700',
        shockwaveColor: '#FFA500', shockwaveIntensity: 1.5,
        bladeColor: '#8B4513', hiltColor: '#654321',
        edgeColor: '#CD7F32', handleColor: '#654321',
        usesAmmo: false,
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            range: [1, 1.1, 1.2, 1.3, 1.4, 1.5]
        }
    },
    {
        id: 'dual_daggers', name: 'Dual Daggers', icon: '🗡️🗡️', type: 'melee',
        meleeType: 'single', baseDamage: 5, attackSpeed: 1.5, range: 50,
        cost: 95, description: 'Two fast daggers',
        swingColor: '#4682B4', swingAngle: 60,
        trailColor: '#87CEEB', sparkleColor: '#00FFFF',
        bladeColor: '#4682B4', hiltColor: '#2F4F4F',
        usesAmmo: false, dualStrike: true,
        tierMultipliers: {
            damage: [1, 1.2, 1.4, 1.7, 2.0, 2.0],
            attackSpeed: [1, 1.2, 1.4, 1.4, 1.6, 1.8],
            range: [1, 1.05, 1.1, 1.15, 1.17, 1.2]
        }
    },
    {
        id: 'dagger', name: 'Swift Dagger', icon: '🗡️', type: 'melee',
        meleeType: 'single', baseDamage: 6, attackSpeed: 2.0, range: 50,
        cost: 70, description: 'Quick stabbing dagger',
        swingColor: '#4682B4', swingAngle: 30,
        trailColor: '#00FFFF', sparkleColor: '#00FFFF',
        bladeColor: '#4682B4', hiltColor: '#2F4F4F',
        usesAmmo: false,
        tierMultipliers: {
            damage: [1, 1.2, 1.4, 1.6, 1.8, 2.0],
            attackSpeed: [1, 1.2, 1.4, 1.6, 1.8, 2.0],
            range: [1, 1.05, 1.1, 1.15, 1.2, 1.25]
        }
    },
    {
        id: 'hammer', name: 'War Hammer', icon: '🔨', type: 'melee',
        meleeType: 'aoe', baseDamage: 15, attackSpeed: 0.5, range: 80,
        cost: 130, description: 'Massive overhead smash',
        swingColor: '#696969', swingAngle: 360,
        trailColor: '#FF4500', sparkleColor: '#FFD700',
        shockwaveColor: '#FF4500', shockwaveIntensity: 2.5,
        headColor: '#696969', handleColor: '#8B4513',
        usesAmmo: false,
        tierMultipliers: {
            damage: [1, 1.5, 2.0, 2.6, 3.3, 4.0],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            range: [1, 1.15, 1.3, 1.45, 1.6, 1.75]
        }
    },
    {
        id: 'spear', name: 'Trident', icon: '🔱', type: 'melee',
        meleeType: 'pierce', baseDamage: 10, attackSpeed: 1.0, range: 100,
        cost: 110, description: 'Throw to pierce. Weak bleed when thrown. Upgrades: Loyal/Channeling',
        swingColor: '#CD7F32', swingAngle: 45,
        trailColor: '#50C878', sparkleColor: '#FFD700',
        prongColor: '#CD7F32', shaftColor: '#8B4513', tipColor: '#FFD700',
        usesAmmo: true,            // <-- now uses ammo for the throw
        magazineSize: 1,           // one throw
        resetEachRound: true,      // ammo resets each wave
        pierceCount: 3,
        pickupRange: 80,           // larger pickup range
        tierMultipliers: {
            damage: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
            attackSpeed: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
            pierceCount: [1, 1, 2, 2, 3, 4],
            range: [1, 1.1, 1.2, 1.3, 1.4, 1.5]
        }
    }
];
