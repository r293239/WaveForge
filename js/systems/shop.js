// ============================================
// WAVEFORGE - Shop System
// ============================================

const Shop = {
    items: [], // Current 4 shop items
    
    init() {
        this.items = [];
    },
    
    // Generate 4 random shop items
    generateItems() {
        this.items = [];
        
        // Add 2 weapons
        let availWeapons = WEAPON_DATA.filter(w => 
            w.id !== 'handgun' && 
            !Player.weapons.some(pw => pw.id === w.id && pw.tier >= 5)
        );
        
        for (let i = 0; i < 2; i++) {
            if (availWeapons.length) {
                const idx = Math.floor(Math.random() * availWeapons.length);
                const weaponData = availWeapons[idx];
                const tier = Math.random() < 0.3 ? 2 : 1;
                this.items.push({
                    type: 'weapon',
                    data: weaponData,
                    tier: tier,
                    instance: new WeaponInstance(weaponData, tier)
                });
                availWeapons.splice(idx, 1);
            }
        }
        
        // Add 2 items
        let availItems = [...ITEM_DATA].filter(it => {
            if (it.id === 'landmine' && Towers.landmines.count >= Towers.landmines.max) return false;
            if (it.id === 'runic_plate' && Game.purchasedItems.runicPlate) return false;
            if (it.id === 'guardian_angel' && Game.purchasedItems.guardianAngel) return false;
            if (it.id === 'vampire_teeth' && (Game.purchasedItems.vampireTeeth || 0) >= CONFIG.PURCHASE_LIMITS.vampireTeeth) return false;
            if (it.id === 'blood_contract' && (Game.purchasedItems.bloodContract || 0) >= CONFIG.PURCHASE_LIMITS.bloodContract) return false;
            return true;
        });
        
        for (let i = 0; i < 2; i++) {
            if (availItems.length) {
                const idx = Math.floor(Math.random() * availItems.length);
                this.items.push({
                    type: 'item',
                    data: availItems[idx]
                });
                availItems.splice(idx, 1);
            }
        }
        
        // Shuffle
        this.items.sort(() => Math.random() - 0.5);
        HUD.updateShop();
    },
    
    // Refresh shop
    refresh() {
        if (Game.gold < Game.refreshCost) {
            Messages.show(`Not enough gold! Need ${Game.refreshCost}g`);
            return;
        }
        
        Game.gold -= Game.refreshCost;
        Game.refreshCount++;
        Game.refreshCost = CONFIG.SHOP_REFRESH_BASE_COST + Game.refreshCount * CONFIG.SHOP_REFRESH_COST_INCREMENT;
        
        this.generateItems();
        Messages.show(`Shop refreshed! Cost increased to ${Game.refreshCost}g`);
        HUD.updateStats();
    },
    
    // Purchase an item
    purchase(index) {
        if (index < 0 || index >= this.items.length || !this.items[index]) return;
        
        const shopItem = this.items[index];
        const data = shopItem.data;
        let cost = data.cost;
        
        if (shopItem.type === 'weapon') {
            cost = shopItem.instance.getShopCost();
        }
        
        if (Game.gold < cost) {
            Messages.show(`Not enough gold! Need ${cost}, have ${Game.gold}`);
            return;
        }
        
        Game.gold -= cost;
        
        if (shopItem.type === 'weapon') {
            if (!Player.addWeapon(data, shopItem.tier || 1)) {
                Game.gold += cost;
                return;
            }
            Messages.show(`Purchased ${data.name} Tier ${shopItem.tier || 1}!`);
        } else {
            this.applyItemEffect(data);
            Messages.show(`Purchased ${data.name}!`);
        }
        
        this.items[index] = null;
        HUD.updateAll();
    },
    
    // Apply item effect
    applyItemEffect(item) {
        switch (item.id) {
            case 'damage_orb':
                Player.damageMultiplier += 0.15;
                break;
            case 'speed_boots':
                Player.speedMultiplier += 0.15;
                Player.speed = Player.baseSpeed * Player.speedMultiplier;
                break;
            case 'health_upgrade':
                const oldMax = Player.maxHealth;
                Player.maxHealth = Math.floor(oldMax * 1.25);
                Player.health += Player.maxHealth - oldMax;
                break;
            case 'vampire_teeth':
                if ((Game.purchasedItems.vampireTeeth || 0) >= CONFIG.PURCHASE_LIMITS.vampireTeeth) {
                    Messages.show('Maximum vampire teeth purchased (3)!');
                    Game.gold += item.cost;
                    return;
                }
                Player.lifeSteal += 0.05;
                Game.purchasedItems.vampireTeeth = (Game.purchasedItems.vampireTeeth || 0) + 1;
                break;
            case 'berserker_ring':
                Player.berserkerRing = true;
                break;
            case 'ninja_scroll':
                Player.dodgeChance += 0.15;
                break;
            case 'alchemist_stone':
                Player.goldMultiplier += 0.2;
                break;
            case 'thorns_armor':
                Player.thornsDamage = 0.25;
                break;
            case 'wind_charm':
                Player.attackSpeedMultiplier += 0.15;
                break;
            case 'runic_plate':
                if (Game.purchasedItems.runicPlate) {
                    Messages.show('Runic Plate already purchased!');
                    Game.gold += item.cost;
                    return;
                }
                Player.firstHitReduction = true;
                Player.firstHitActive = true;
                Game.purchasedItems.runicPlate = true;
                break;
            case 'guardian_angel':
                if (Game.purchasedItems.guardianAngel) {
                    Messages.show('Guardian Angel already purchased!');
                    Game.gold += item.cost;
                    return;
                }
                Player.guardianAngel = true;
                Game.purchasedItems.guardianAngel = true;
                break;
            case 'blood_contract':
                if ((Game.purchasedItems.bloodContract || 0) >= CONFIG.PURCHASE_LIMITS.bloodContract) {
                    Messages.show('Maximum Blood Contract stacks reached (5)!');
                    Game.gold += item.cost;
                    return;
                }
                if (!Player.bloodContract) {
                    Player.bloodContract = true;
                    Player.bloodContractStacks = 1;
                    Player.lifeSteal += 0.03;
                    if (Player.bloodContractInterval) clearInterval(Player.bloodContractInterval);
                    Player.bloodContractInterval = setInterval(() => {
                        if (Game.state === GAME_STATE.WAVE) {
                            const dmg = Math.max(1, Math.floor(Player.maxHealth * 0.01 * Player.bloodContractStacks));
                            if (Player.health > dmg) {
                                Player.takeDamage(dmg);
                            }
                        }
                    }, 1000);
                } else {
                    Player.bloodContractStacks++;
                    Player.lifeSteal += 0.03;
                }
                Game.purchasedItems.bloodContract = (Game.purchasedItems.bloodContract || 0) + 1;
                break;
            case 'landmine':
                Towers.landmines.count++;
                if (Game.state === GAME_STATE.WAVE) {
                    setTimeout(() => Towers.spawnLandmine(), 100);
                }
                break;
            case 'healing_tower':
                Towers.placeHealingTower();
                break;
            // Consumables are handled by Player.useConsumable
        }
    },
    
    // Get cost of a shop item
    getCost(shopItem) {
        if (shopItem.type === 'weapon') {
            return shopItem.instance.getShopCost();
        }
        return shopItem.data.cost;
    }
};
