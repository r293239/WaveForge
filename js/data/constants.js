// ============================================
// WAVEFORGE - Constants & Configuration
// ============================================

const CONFIG = {
    // Canvas
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Player defaults
    PLAYER_START: {
        health: 20,
        maxHealth: 20,
        speed: 3,
        gold: 50,
        radius: 20
    },
    
    // Combat
    MONSTER_ATTACK_COOLDOWN: 1000,
    DAMAGE_INDICATOR_DURATION: 1000,
    GOLD_POPUP_DURATION: 1000,
    
    // Shop
    SHOP_REFRESH_BASE_COST: 5,
    SHOP_REFRESH_COST_INCREMENT: 2,
    MAX_WEAPON_SLOTS: 6,
    
    // Towers
    MAX_LANDMINES: 5,
    MAX_HEALING_TOWERS: 3,
    HEALING_TOWER_INTERVAL: 2000,
    HEALING_TOWER_AMOUNT: 1,
    
    // Messages
    MAX_VISIBLE_MESSAGES: 5,
    MESSAGE_DURATION: 2500,
    
    // Save
    AUTO_SAVE_INTERVAL: 30000,
    
    // Difficulty multipliers
    DIFFICULTY: {
        easy: {
            playerDamage: 1.15,
            monsterHealth: 0.85,
            monsterDamage: 0.8,
            monsterCountMultiplier: 0.7,
            goldGain: 1.25,
            extraMonsters: -2
        },
        normal: {
            playerDamage: 1.0,
            monsterHealth: 1.0,
            monsterDamage: 1.0,
            monsterCountMultiplier: 1.0,
            goldGain: 1.0,
            extraMonsters: 0
        },
        impossible: {
            playerDamage: 0.9,
            monsterHealth: 1.1,
            monsterDamage: 1.2,
            monsterCountMultiplier: 1.3,
            goldGain: 0.5,
            extraMonsters: 3
        }
    },
    
    // Purchase limits
    PURCHASE_LIMITS: {
        vampireTeeth: 3,
        bloodContract: 5,
        runicPlate: 1,
        guardianAngel: 1
    },
    
    // Hitbox sizes (percentage of visual size)
    HITBOX: {
        PLAYER: 0.6,
        MONSTER: 0.7,
        BOSS: 0.8,
        MIN_SEPARATION: 5
    },
    
    // Arena
    ARENA: {
        BOUNDARY_PADDING: 30,
        WALL_THICKNESS: 4
    }
};

const GAME_STATE = {
    START: 'start',
    WAVE: 'wave',
    SHOP: 'shop',
    STAT_SELECT: 'statSelect',
    GAMEOVER: 'gameover',
    WIN: 'win'
};

const DIFFICULTY = {
    EASY: 'easy',
    NORMAL: 'normal',
    IMPOSSIBLE: 'impossible'
};
