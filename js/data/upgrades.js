// ============================================
// WAVEFORGE - Weapon Upgrade Definitions
// ============================================

const WEAPON_UPGRADES = [
    // === MELEE UPGRADES ===
    { id: 'sword_poison', name: 'Toxic Edge', description: 'Sword applies poison (5 dmg/sec for 3s)', icon: '☠️', weaponId: 'sword', effect: { poisonDamage: 5, poisonDuration: 3000 } },
    { id: 'sword_fire', name: 'Flaming Blade', description: 'Sword leaves fire on ground (10 dmg/sec)', icon: '🔥', weaponId: 'sword', effect: { fireDamage: 10, fireDuration: 2000 } },
    { id: 'axe_bleed', name: 'Serrated Edge', description: 'Axe causes bleeding (8 dmg/sec for 4s)', icon: '🩸', weaponId: 'axe', effect: { bleedDamage: 8, bleedDuration: 4000 } },
    { id: 'dagger_speed', name: 'Shadow Strike', description: 'Dagger attacks 30% faster', icon: '💨', weaponId: 'dagger', effect: { attackSpeedMult: 1.3 } },
    { id: 'dual_crits', name: 'Precision Blades', description: 'Dual daggers gain +15% crit chance', icon: '🎯', weaponId: 'dual_daggers', effect: { critChance: 0.15 } },
    { id: 'hammer_stun', name: 'Concussive Blow', description: 'Hammer stuns enemies for 1 second', icon: '💫', weaponId: 'hammer', effect: { stunDuration: 1000 } },
    { id: 'spear_return', name: 'Loyal Trident', description: 'Trident returns to you after thrusting', icon: '🔱', weaponId: 'spear', effect: { returningWeapon: true } },
    { id: 'spear_lightning', name: 'Channeling Trident', description: 'Trident pierce removed, but strikes lightning on hit', icon: '⚡', weaponId: 'spear', effect: { lightningStrike: true, removePierce: true } },
    
    // === RANGED UPGRADES ===
    { id: 'handgun_double', name: 'Double Tap', description: 'Handgun fires 2 bullets per shot', icon: '🔫🔫', weaponId: 'handgun', effect: { pelletCount: 2, spreadAngle: 15 } },
    { id: 'shotgun_choke', name: 'Choke Mod', description: 'Shotgun spread reduced by 50%', icon: '🔧', weaponId: 'shotgun', effect: { spreadMult: 0.5 } },
    { id: 'shotgun_slug', name: 'Slug Rounds', description: 'Shotgun fires a single powerful slug (+40 dmg)', icon: '🎯', weaponId: 'shotgun', effect: { slugMode: true, slugDamage: 40 } },
    { id: 'machinegun_pierce', name: 'Armor Piercing', description: 'Machine gun pierces through 2 enemies', icon: '🔩', weaponId: 'machinegun', effect: { pierceCount: 2 } },
    { id: 'laser_fork', name: 'Prism Lens', description: 'Laser splits into 2 after first hit', icon: '💎', weaponId: 'laser', effect: { forkLaser: true } },
    { id: 'boomerang_double', name: 'Twin Boomerangs', description: 'Throw 2 boomerangs instead of 1', icon: '🪃🪃', weaponId: 'boomerang', effect: { doubleThrow: true } },
    { id: 'boomerang_orbital', name: 'Orbital Path', description: 'Boomerang orbits around you after returning', icon: '🪐', weaponId: 'boomerang', effect: { orbitalMode: true } },
    { id: 'knives_ricochet', name: 'Ricochet Blades', description: 'Throwing knives bounce to 1 extra target', icon: '🔪', weaponId: 'throwing_knives', effect: { bounceCount: 1, bounceRange: 150 } },
    { id: 'sniper_explosive', name: 'Explosive Rounds', description: 'Sniper shots explode on impact (30 dmg AOE)', icon: '💥', weaponId: 'sniper', effect: { explosiveShot: true, explosiveDamage: 30, explosiveRadius: 60 } },
    { id: 'sniper_fast', name: 'Quick Scope', description: 'Sniper attacks 40% faster', icon: '⚡', weaponId: 'sniper', effect: { attackSpeedMult: 1.4 } },
    { id: 'crossbow_triple', name: 'Triple Shot', description: 'Crossbow fires 3 bolts in a spread', icon: '🏹🏹🏹', weaponId: 'crossbow', effect: { tripleShot: true } },
    { id: 'crossbow_explosive', name: 'Blasting Bolts', description: 'Crossbow bolts explode on impact', icon: '🧨', weaponId: 'crossbow', effect: { explosiveShot: true, explosiveDamage: 25, explosiveRadius: 50 } }
];
