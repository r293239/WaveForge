// ============================================
// WAVEFORGE - Shop System
// ============================================

const Shop = {
    items: [],
    init() { this.items = []; },

    generateItems() {
        this.items = [];
        let availWeapons = WEAPON_DATA.filter(w => w.id !== 'handgun' && !Player.weapons.some(pw => pw.id === w.id && pw.tier >= 5));
        for (let i = 0; i < 2; i++) {
            if (availWeapons.length) {
                const idx = Math.floor(Math.random() * availWeapons.length);
                const weaponData = availWeapons[idx];
                let tier = 1;
                if (Game.wave >= 20 && Math.random() < 0.15) tier = 3;
                else if (Game.wave >= 10 && Math.random() < 0.3) tier = 2;
                this.items.push({ type: 'weapon', data: weaponData, tier: tier, instance: WeaponBase.create(weaponData, tier) });
                availWeapons.splice(idx, 1);
            }
        }
        let availItems = [...ITEM_DATA].filter(it => {
            if (it.id === 'landmine' && Towers.landmines.count >= Towers.landmines.max) return false;
            if (it.id === 'healing_tower' && Towers.healingTowers.count >= Towers.healingTowers.max) return false;
            if (it.id === 'turret' && Towers.turrets.count >= Towers.turrets.max) return false;
            if (it.id === 'runic_plate' && Game.purchasedItems.runicPlate) return false;
            if (it.id === 'guardian_angel' && Game.purchasedItems.guardianAngel) return false;
            if (it.id === 'vampire_teeth' && (Game.purchasedItems.vampireTeeth || 0) >= CONFIG.PURCHASE_LIMITS.vampireTeeth) return false;
            if (it.id === 'blood_contract' && (Game.purchasedItems.bloodContract || 0) >= CONFIG.PURCHASE_LIMITS.bloodContract) return false;
            return true;
        });
        for (let i = 0; i < 2; i++) {
            if (availItems.length) {
                const idx = Math.floor(Math.random() * availItems.length);
                this.items.push({ type: 'item', data: availItems[idx] });
                availItems.splice(idx, 1);
            }
        }
        this.items.sort(() => Math.random() - 0.5);
        HUD.updateShop();
    },

    refresh() {
        if (Game.gold < Game.refreshCost) { Messages.show(`Not enough gold! Need ${Game.refreshCost}g`); return; }
        Game.gold -= Game.refreshCost;
        Game.refreshCount++;
        Game.refreshCost = CONFIG.SHOP_REFRESH_BASE_COST + Game.refreshCount * CONFIG.SHOP_REFRESH_COST_INCREMENT;
        this.generateItems();
        Messages.show(`Shop refreshed! Cost increased to ${Game.refreshCost}g`);
        HUD.updateStats();
    },

    purchase(index) {
        if (index < 0 || index >= this.items.length || !this.items[index]) return;
        const shopItem = this.items[index], data = shopItem.data;
        let cost = data.cost;
        if (shopItem.type === 'weapon') cost = shopItem.instance.getShopCost();
        if (Game.gold < cost) { Messages.show(`Not enough gold! Need ${cost}, have ${Game.gold}`); return; }
        if (shopItem.type === 'weapon') {
            const existingWeapon = Player.weapons.find(w => w.id === data.id && w.tier === (shopItem.tier || 1) && w.tier < 5);
            if (existingWeapon) {
                const mergeCost = existingWeapon.getMergeCost(shopItem.instance), totalCost = cost + mergeCost;
                if (Game.gold < totalCost) { Messages.show(`Not enough gold! Need ${totalCost}g (includes merge cost)`); return; }
                Game.gold -= totalCost;
                const merged = existingWeapon.merge(shopItem.instance);
                const idx = Player.weapons.indexOf(existingWeapon);
                Player.weapons[idx] = merged;
                Messages.show(`Auto-merged to ${merged.getDisplayName()}!`);
                this.items[index] = null; HUD.updateAll(); HUD.updateConsumables(); return;
            }
            if (Player.weapons.length >= CONFIG.MAX_WEAPON_SLOTS) { Messages.show('No empty weapon slots!'); return; }
            Game.gold -= cost;
            Player.addWeapon(data, shopItem.tier || 1);
            Messages.show(`Purchased ${data.name} Tier ${shopItem.tier || 1}!`);
        } else {
            Game.gold -= cost;
            this.applyItemEffect(data);
            Messages.show(`Purchased ${data.name}!`);
        }
        this.items[index] = null; HUD.updateAll(); HUD.updateConsumables();
    },

    applyItemEffect(item) {
        // Consumables
        if (item.type === 'consumable') {
            const existing = Player.consumables.find(c => c.id === item.id);
            if (existing) existing.count++;
            else Player.consumables.push({ id: item.id, name: item.name, icon: item.icon, description: item.description, count: 1 });
            HUD.updateConsumables(); return;
        }
        switch (item.id) {
            case 'damage_orb': Player.damageMultiplier += 0.15; break;
            case 'speed_boots': Player.speedMultiplier += 0.15; Player.speed = Player.baseSpeed * Player.speedMultiplier; break;
            case 'health_upgrade': const oldMax = Player.maxHealth; Player.maxHealth = Math.floor(oldMax * 1.25); Player.health += Player.maxHealth - oldMax; break;
            case 'vampire_teeth': if ((Game.purchasedItems.vampireTeeth || 0) >= CONFIG.PURCHASE_LIMITS.vampireTeeth) { Messages.show('Max vampire teeth!'); Game.gold += item.cost; return; } Player.lifeSteal += 0.05; Game.purchasedItems.vampireTeeth = (Game.purchasedItems.vampireTeeth || 0) + 1; break;
            case 'berserker_ring': Player.berserkerRing = true; break;
            case 'ninja_scroll': Player.dodgeChance += 0.15; break;
            case 'alchemist_stone': Player.goldMultiplier += 0.2; break;
            case 'thorns_armor': Player.thornsDamage = 0.25; break;
            case 'wind_charm': Player.attackSpeedMultiplier += 0.15; break;
            case 'runic_plate': if (Game.purchasedItems.runicPlate) { Messages.show('Already purchased!'); Game.gold += item.cost; return; } Player.firstHitReduction = true; Player.firstHitActive = true; Game.purchasedItems.runicPlate = true; break;
            case 'guardian_angel': if (Game.purchasedItems.guardianAngel) { Messages.show('Already purchased!'); Game.gold += item.cost; return; } Player.guardianAngel = true; Game.purchasedItems.guardianAngel = true; break;
            case 'blood_contract': if ((Game.purchasedItems.bloodContract || 0) >= CONFIG.PURCHASE_LIMITS.bloodContract) { Messages.show('Max stacks!'); Game.gold += item.cost; return; } if (!Player.bloodContract) { Player.bloodContract = true; Player.bloodContractStacks = 1; Player.lifeSteal += 0.03; if (Player.bloodContractInterval) clearInterval(Player.bloodContractInterval); Player.bloodContractInterval = setInterval(() => { if (Game.state === GAME_STATE.WAVE) { const dmg = Math.max(1, Math.floor(Player.maxHealth * 0.01 * Player.bloodContractStacks)); if (Player.health > dmg) Player.takeDamage(dmg); } }, 1000); } else { Player.bloodContractStacks++; Player.lifeSteal += 0.03; } Game.purchasedItems.bloodContract = (Game.purchasedItems.bloodContract || 0) + 1; break;
            case 'landmine': if (!Towers.purchaseTower('landmine')) { Messages.show(`Max landmines!`); Game.gold += item.cost; return; } Messages.show(`Landmine purchased!`); break;
            case 'healing_tower': if (!Towers.purchaseTower('healing_tower')) { Messages.show(`Max healing towers!`); Game.gold += item.cost; return; } Messages.show(`Healing Tower purchased!`); break;
            case 'turret': if (!Towers.purchaseTower('turret')) { Messages.show(`Max turrets!`); Game.gold += item.cost; return; } Messages.show(`Turret purchased!`); break;
        }
    },

    getCost(shopItem) { if (shopItem.type === 'weapon') return shopItem.instance.getShopCost(); return shopItem.data.cost; }
};
