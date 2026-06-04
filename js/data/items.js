// ============================================
// WAVEFORGE - Item Definitions
// ============================================

const ITEM_DATA = [
    // === CONSUMABLES ===
    { id: 'health_potion', name: 'Health Potion', icon: '❤️', type: 'consumable', cost: 50, description: 'Restore 25% of max health' },
    { id: 'ammo_pack', name: 'Ammo Pack', icon: '📦', type: 'consumable', cost: 40, description: 'Fully reload all ranged weapons' },
    { id: 'rage_potion', name: 'Rage Potion', icon: '🔥', type: 'consumable', cost: 60, description: '+50% damage for 10 seconds' },
    { id: 'bomb', name: 'Bomb', icon: '💣', type: 'consumable', cost: 75, description: 'Large area explosion' },
    { id: 'exp_scroll', name: 'Experience Scroll', icon: '📜✨', type: 'consumable', cost: 500, description: 'Upgrade a random weapon' },
    
    // === TOWERS ===
    { id: 'healing_tower', name: 'Healing Tower', icon: '🏥', type: 'tower', category: 'tower', cost: 50, maxPerGame: 3, description: 'Auto-deploys each wave, heals 1 HP/2s' },
    { id: 'landmine', name: 'Landmine', icon: '💥', type: 'tower', category: 'tower', cost: 75, maxPerGame: 5, description: 'Deals 80 damage when triggered' },
    { id: 'turret', name: 'Turret', icon: '🔫', type: 'tower', category: 'tower', cost: 80, maxPerGame: 3, description: 'Auto-targets enemies, same stats as handgun' },
    
    // === PERMANENT UPGRADES ===
    { id: 'damage_orb', name: 'Damage Orb', icon: '💎', type: 'permanent', cost: 100, description: 'Permanently +15% damage', effect: { damagePercent: 0.15 } },
    { id: 'speed_boots', name: 'Speed Boots', icon: '👟', type: 'permanent', cost: 80, description: 'Permanently +15% speed', effect: { speedPercent: 0.15 } },
    { id: 'health_upgrade', name: 'Health Upgrade', icon: '🛡️', type: 'permanent', cost: 140, description: 'Permanently +25% max health', effect: { maxHealthPercent: 0.25 } },
    { id: 'vampire_teeth', name: 'Vampire Teeth', icon: '🦷', type: 'permanent', cost: 320, description: 'Permanently +5% life steal', effect: { lifeSteal: 0.05 }, maxPurchases: 3 },
    { id: 'berserker_ring', name: 'Berserker Ring', icon: '💍', type: 'permanent', cost: 250, description: 'Damage increases as health decreases', effect: { berserkerRing: true } },
    { id: 'ninja_scroll', name: 'Ninja Scroll', icon: '📜', type: 'permanent', cost: 145, description: '+15% chance to dodge attacks', effect: { dodgeChance: 0.15 } },
    { id: 'alchemist_stone', name: 'Alchemist Stone', icon: '🪨', type: 'permanent', cost: 150, description: 'Earn 20% more gold', effect: { goldMultiplier: 0.2 } },
    { id: 'thorns_armor', name: 'Thorns Armor', icon: '🌵', type: 'permanent', cost: 120, description: 'Reflect 25% of damage', effect: { thornsDamage: 0.25 } },
    { id: 'wind_charm', name: 'Wind Charm', icon: '🍃', type: 'permanent', cost: 110, description: '+15% attack speed', effect: { attackSpeedMultiplier: 0.15 } },
    { id: 'runic_plate', name: 'Runic Plate', icon: '🔰', type: 'permanent', cost: 260, description: 'First hit each wave deals 50% less', effect: { firstHitReduction: true }, maxPurchases: 1 },
    { id: 'guardian_angel', name: 'Guardian Angel', icon: '😇', type: 'permanent', cost: 200, description: 'Survive fatal damage once', effect: { guardianAngel: true }, maxPurchases: 1 },
    { id: 'blood_contract', name: 'Blood Contract', icon: '📜🩸', type: 'permanent', cost: 150, description: '+3% lifesteal per stack, lose 1% HP/sec', effect: { bloodContract: true }, maxPurchases: 5 }
];

// Stat buffs that appear after waves
const STAT_BUFFS = [
    { id: 'health_boost', name: 'Health Boost', description: 'Increase max health by 10%', icon: '❤️', effect: { maxHealthPercent: 0.1 } },
    { id: 'damage_boost', name: 'Damage Boost', description: 'Increase damage by 10%', icon: '⚔️', effect: { damagePercent: 0.1 } },
    { id: 'speed_boost', name: 'Speed Boost', description: 'Increase speed by 10%', icon: '👟', effect: { speedPercent: 0.1 } },
    { id: 'life_steal', name: 'Life Steal', description: 'Heal for 1% of damage dealt', icon: '🦇', effect: { lifeSteal: 0.01 } },
    { id: 'critical_chance', name: 'Lucky Charm', description: '+5% critical hit chance', icon: '🍀', effect: { criticalChance: 0.05 } },
    { id: 'gold_bonus', name: 'Gold Bonus', description: 'Earn 10% more gold', icon: '💰', effect: { goldMultiplier: 0.1 } },
    { id: 'regen', name: 'Health Regen', description: 'Regenerate 1% HP per second', icon: '🔄', effect: { healthRegenPercent: 0.01 } },
    { id: 'armor', name: 'Armor', description: 'Reduce damage taken by 3%', icon: '🛡️', effect: { damageReduction: 0.03 } },
    { id: 'reload_speed', name: 'Quick Hands', description: 'Reload weapons 15% faster', icon: '⚡', effect: { reloadSpeedMultiplier: 0.15 } }
];
