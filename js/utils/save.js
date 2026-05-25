// ============================================
// WAVEFORGE - Save/Load System
// ============================================

const Save = {
    key: 'waveforge_save',
    
    init() {},
    
    hasSave() {
        return localStorage.getItem(this.key) !== null;
    },
    
    saveGame() {
        if (Game.state === GAME_STATE.START || Game.state === GAME_STATE.GAMEOVER) return;
        
        const data = {
            wave: Game.wave,
            gold: Game.gold,
            kills: Game.kills,
            state: Game.state,
            waveActive: Game.waveActive,
            refreshCount: Game.refreshCount,
            refreshCost: Game.refreshCost,
            difficulty: Game.difficulty,
            sandboxMode: Game.sandboxMode,
            gameWon: Game.gameWon,
            purchasedItems: Game.purchasedItems,
            weaponUpgrades: Game.weaponUpgrades,
            
            player: {
                x: Player.entity?.x,
                y: Player.entity?.y,
                health: Player.health,
                maxHealth: Player.maxHealth,
                damageMultiplier: Player.damageMultiplier,
                speed: Player.speed,
                baseSpeed: Player.baseSpeed,
                speedMultiplier: Player.speedMultiplier,
                lifeSteal: Player.lifeSteal,
                criticalChance: Player.criticalChance,
                goldMultiplier: Player.goldMultiplier,
                healthRegenPercent: Player.healthRegenPercent,
                damageReduction: Player.damageReduction,
                dodgeChance: Player.dodgeChance,
                thornsDamage: Player.thornsDamage,
                attackSpeedMultiplier: Player.attackSpeedMultiplier,
                reloadSpeedMultiplier: Player.reloadSpeedMultiplier,
                firstHitReduction: Player.firstHitReduction,
                guardianAngel: Player.guardianAngel,
                guardianAngelUsed: Player.guardianAngelUsed,
                bloodContract: Player.bloodContract,
                bloodContractStacks: Player.bloodContractStacks,
                berserkerRing: Player.berserkerRing,
                consumables: Player.consumables
            },
            
            towers: {
                landmines: {
                    count: Towers.landmines.count,
                    active: Towers.landmines.active.map(m => ({ x: m.x, y: m.y }))
                },
                healingTowers: {
                    count: Towers.healingTowers.count,
                    active: Towers.healingTowers.active.map(t => ({ x: t.x, y: t.y, health: t.health }))
                },
                turrets: {
                    count: Towers.turrets.count,
                    active: Towers.turrets.active.map(t => ({ x: t.x, y: t.y, health: t.health }))
                }
            },
            
            weapons: Player.weapons.map(w => ({
                id: w.id, tier: w.tier,
                currentAmmo: w.currentAmmo,
                isReloading: w.isReloading
            })),
            
            shopItems: Shop.items.map(item => item ? {
                type: item.type,
                dataId: item.data?.id,
                tier: item.tier
            } : null),
            
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch(e) {
            console.log('Save failed:', e.message);
        }
    },
    
    loadGame() {
        const saved = localStorage.getItem(this.key);
        if (!saved) {
            Messages.show('No saved game found!');
            return false;
        }
        
        try {
            const data = JSON.parse(saved);
            
            Game.wave = data.wave;
            Game.gold = data.gold;
            Game.kills = data.kills;
            Game.state = data.state;
            Game.waveActive = data.waveActive;
            Game.refreshCount = data.refreshCount || 0;
            Game.refreshCost = data.refreshCost || 5;
            Game.difficulty = data.difficulty || 'normal';
            Game.sandboxMode = data.sandboxMode || false;
            Game.gameWon = data.gameWon || false;
            Game.purchasedItems = data.purchasedItems || {};
            Game.weaponUpgrades = data.weaponUpgrades || {};
            Game.setDifficulty(Game.difficulty);
            
            // Restore player
            if (data.player) {
                Player.health = data.player.health;
                Player.maxHealth = data.player.maxHealth;
                Player.damageMultiplier = data.player.damageMultiplier;
                Player.speed = data.player.speed;
                Player.baseSpeed = data.player.baseSpeed;
                Player.speedMultiplier = data.player.speedMultiplier;
                Player.lifeSteal = data.player.lifeSteal;
                Player.criticalChance = data.player.criticalChance;
                Player.goldMultiplier = data.player.goldMultiplier;
                Player.healthRegenPercent = data.player.healthRegenPercent;
                Player.damageReduction = data.player.damageReduction;
                Player.dodgeChance = data.player.dodgeChance;
                Player.thornsDamage = data.player.thornsDamage;
                Player.attackSpeedMultiplier = data.player.attackSpeedMultiplier;
                Player.reloadSpeedMultiplier = data.player.reloadSpeedMultiplier;
                Player.firstHitReduction = data.player.firstHitReduction;
                Player.guardianAngel = data.player.guardianAngel;
                Player.guardianAngelUsed = data.player.guardianAngelUsed;
                Player.bloodContract = data.player.bloodContract;
                Player.bloodContractStacks = data.player.bloodContractStacks;
                Player.berserkerRing = data.player.berserkerRing;
                Player.consumables = data.player.consumables || [];
                
                if (data.player.x && data.player.y) {
                    Player.entity = {
                        x: data.player.x,
                        y: data.player.y,
                        radius: CONFIG.PLAYER_START.radius,
                        hitboxRadius: CONFIG.PLAYER_START.radius * CONFIG.HITBOX.PLAYER,
                        color: '#ff6b6b',
                        isPlayer: true
                    };
                }
            }
            
            // Restore towers
            if (data.towers) {
                if (data.towers.landmines) {
                    Towers.landmines.count = data.towers.landmines.count || 0;
                    Towers.landmines.active = (data.towers.landmines.active || []).map(m => ({
                        ...m, radius: 15, damage: 80, explosionRadius: 60, active: true, startTime: Date.now(), color: '#8B4513'
                    }));
                }
                if (data.towers.healingTowers) {
                    Towers.healingTowers.count = data.towers.healingTowers.count || 0;
                    Towers.healingTowers.active = (data.towers.healingTowers.active || []).map(t => ({
                        ...t, radius: 20, healAmount: 1, lastHeal: Date.now()
                    }));
                }
                if (data.towers.turrets) {
                    Towers.turrets.count = data.towers.turrets.count || 0;
                    Towers.turrets.active = (data.towers.turrets.active || []).map(t => ({
                        ...t, radius: 20, damage: 7, range: 300, attackSpeed: 1.0,
                        projectileColor: '#FFD700', projectileSpeed: 10, lastAttack: 0
                    }));
                }
            }
            
            // Restore weapons
            Player.weapons = [];
            if (data.weapons) {
                for (let w of data.weapons) {
                    const weaponData = WEAPON_DATA.find(wp => wp.id === w.id);
                    if (weaponData) {
                        const weapon = new WeaponInstance(weaponData, w.tier);
                        if (weapon.usesAmmo) {
                            weapon.currentAmmo = w.currentAmmo;
                            weapon.isReloading = w.isReloading;
                        }
                        Player.weapons.push(weapon);
                    }
                }
            }
            
            // Restore shop
            Shop.items = [];
            if (data.shopItems) {
                for (let item of data.shopItems) {
                    if (!item) { Shop.items.push(null); continue; }
                    if (item.type === 'weapon') {
                        const weaponData = WEAPON_DATA.find(w => w.id === item.dataId);
                        if (weaponData) {
                            Shop.items.push({
                                type: 'weapon',
                                data: weaponData,
                                tier: item.tier || 1,
                                instance: new WeaponInstance(weaponData, item.tier || 1)
                            });
                        }
                    } else {
                        const itemData = ITEM_DATA.find(it => it.id === item.dataId);
                        if (itemData) {
                            Shop.items.push({ type: 'item', data: itemData });
                        }
                    }
                }
            }
            
            // Restart blood contract if needed
            if (Player.bloodContract && !Player.bloodContractInterval) {
                Player.bloodContractInterval = setInterval(() => {
                    if (Game.state === GAME_STATE.WAVE) {
                        const dmg = Math.max(1, Math.floor(Player.maxHealth * 0.01 * Player.bloodContractStacks));
                        if (Player.health > dmg) Player.takeDamage(dmg);
                    }
                }, 1000);
            }
            
            // Start wave if needed
            if (Game.state === GAME_STATE.WAVE) {
                Game.waveActive = true;
                Waves.startWave();
            } else if (Game.state === GAME_STATE.SHOP || Game.state === GAME_STATE.WIN) {
                HUD.showWaveButton();
                HUD.updateAll();
            }
            
            Messages.show('Game loaded!');
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            Messages.show('Failed to load save file!');
            return false;
        }
    },
    
    clearSave() {
        localStorage.removeItem(this.key);
    }
};
