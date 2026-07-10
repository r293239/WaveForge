// ============================================
// WAVEFORGE - Monster Type Definitions (DATA)
// ============================================

// Use var instead of const to ensure global scope
var MONSTER_TYPES = {
    NORMAL: {
        name: 'Normal', color: '#ff6b6b', speed: 1,
        healthMultiplier: 1, damageMultiplier: 1, sizeMultiplier: 1,
        icon: '👾', goldDrop: { min: 5, max: 15 },
        attackRange: 25, attackDamage: 1, attackSpeed: 1000
    },
    FAST: {
        name: 'Fast', color: '#4ecdc4', speed: 2.5,
        healthMultiplier: 0.7, damageMultiplier: 0.8, sizeMultiplier: 0.8,
        icon: '⚡', goldDrop: { min: 3, max: 10 },
        attackRange: 20, attackDamage: 0.8, attackSpeed: 800
    },
    TANK: {
        name: 'Tank', color: '#ffa500', speed: 0.5,
        healthMultiplier: 2.5, damageMultiplier: 1.2, sizeMultiplier: 1.4,
        icon: '🛡️', goldDrop: { min: 8, max: 20 },
        attackRange: 30, attackDamage: 1.5, attackSpeed: 1500
    },
    EXPLOSIVE: {
        name: 'Explosive', color: '#ff0000', speed: 1,
        healthMultiplier: 0.8, damageMultiplier: 1.5, sizeMultiplier: 1,
        icon: '💥', explosive: true, explosionRadius: 100, explosionDamage: 3.0,
        goldDrop: { min: 10, max: 25 },
        attackRange: 25, attackDamage: 1.2, attackSpeed: 1200
    },
    GUNNER: {
        name: 'Gunner', color: '#ff69b4', speed: 0.9,
        healthMultiplier: 0.9, damageMultiplier: 1.2, sizeMultiplier: 0.9,
        icon: '🔫', ranged: true,
        projectileDamage: 8, projectileSpeed: 5, attackRange: 270,
        projectileColor: '#ff69b4', attackCooldown: 3000,
        goldDrop: { min: 12, max: 30 },
        attackDamage: 0.5, attackSpeed: 2000
    },
    MINION: {
        name: 'Minion', color: '#9370db', speed: 1.5,
        healthMultiplier: 0.2, damageMultiplier: 0.4, sizeMultiplier: 0.5,
        icon: '👾', isMinion: true,
        goldDrop: { min: 1, max: 5 },
        attackRange: 15, attackDamage: 0.3, attackSpeed: 1000
    },
    SPLITTER: {
        name: 'Splitter', color: '#00ff00', speed: 1.2,
        healthMultiplier: 0.6, damageMultiplier: 0.7, sizeMultiplier: 0.9,
        icon: '🔀', isSplitter: true, splitCount: 2, splitHealthPercent: 0.5,
        goldDrop: { min: 15, max: 25 },
        attackRange: 20, attackDamage: 0.7, attackSpeed: 1000
    },
    DASHER: {
        name: 'Dasher', color: '#00ffff', speed: 1.5,
        dashSpeed: 4.0, healthMultiplier: 0.5, damageMultiplier: 1.3, sizeMultiplier: 0.8,
        icon: '⚡', isDasher: true, dashCooldown: 3000, dashRange: 300,
        goldDrop: { min: 20, max: 35 },
        attackRange: 20, attackDamage: 1.0, attackSpeed: 1000
    },
    VAMPIRE: {
        name: 'Vampire', color: '#8B008B', speed: 1.2,
        healthMultiplier: 1.2, damageMultiplier: 1.1, sizeMultiplier: 0.9,
        icon: '🧛', isVampire: true, lifeSteal: 0.2,
        goldDrop: { min: 15, max: 35 },
        attackRange: 25, attackDamage: 1.1, attackSpeed: 1000
    },
    BOSS: {
        name: 'BOSS', color: '#ffd700', speed: 0.7,
        healthMultiplier: 15, damageMultiplier: 2.0, sizeMultiplier: 2.2,
        icon: '👑', isBoss: true, lifeSteal: 0.1,
        projectileSpeed: 5, projectileDamage: 15, projectileCooldown: 2000,
        goldDrop: { min: 100, max: 300 },
        attackRange: 40, attackDamage: 2.5, attackSpeed: 1500
    }
};

// Make it available globally (redundant with var, but just in case)
window.MONSTER_TYPES = MONSTER_TYPES;
