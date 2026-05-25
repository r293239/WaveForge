// ============================================
// WAVEFORGE - HUD System
// ============================================

const HUD = {
    selectedWeaponIndex: -1,
    mergeTargetIndex: -1,
    
    init() {
        document.getElementById('refreshShopBtn').addEventListener('click', () => Shop.refresh());
        document.getElementById('refreshShopBtn').addEventListener('touchstart', (e) => { e.preventDefault(); Shop.refresh(); });
        document.getElementById('nextWaveBtn').addEventListener('click', () => Game.startNextWave());
        document.getElementById('nextWaveBtn').addEventListener('touchstart', (e) => { e.preventDefault(); Game.startNextWave(); });
        document.getElementById('scrapWeaponBtn').addEventListener('click', () => this.scrapSelected());
        document.getElementById('scrapWeaponBtn').addEventListener('touchstart', (e) => { e.preventDefault(); this.scrapSelected(); });
        document.getElementById('mergeWeaponBtn').addEventListener('click', () => this.mergeSelected());
        document.getElementById('mergeWeaponBtn').addEventListener('touchstart', (e) => { e.preventDefault(); this.mergeSelected(); });
    },
    
    updateAll() {
        this.updateStats();
        this.updateWeapons();
        this.updateShop();
        this.updateConsumables();
        this.updateAbilities();
    },
    
    updateStats() {
        document.getElementById('healthValue').textContent = `${Math.floor(Player.health)}/${Player.maxHealth}`;
        document.getElementById('damageValue').textContent = Math.floor(Player.damageMultiplier * 100) + '%';
        document.getElementById('speedValue').textContent = Math.floor(Player.speedMultiplier * 100) + '%';
        document.getElementById('goldValue').textContent = Game.gold;
        document.getElementById('waveValue').textContent = Game.wave;
        document.getElementById('killsValue').textContent = Game.kills;
        
        const hpPct = (Player.health / Player.maxHealth) * 100;
        const healthFill = document.getElementById('healthFill');
        healthFill.style.width = hpPct + '%';
        healthFill.style.background = hpPct > 60 ? 'linear-gradient(90deg, #11998e, #38ef7d)' : (hpPct > 30 ? 'linear-gradient(90deg, #f7971e, #ffd200)' : 'linear-gradient(90deg, #ff416c, #ff4b2b)');
        
        document.getElementById('monsterCount').textContent = `Monsters: ${Monsters.active.length}`;
        document.getElementById('refreshCost').textContent = Game.refreshCost + 'g';
        document.getElementById('refreshCounter').textContent = `Refreshes: ${Game.refreshCount}`;
    },
    
    updateWeapons() {
        const grid = document.getElementById('weaponsGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < CONFIG.MAX_WEAPON_SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = 'weapon-slot';
            
            if (i < Player.weapons.length) {
                const weapon = Player.weapons[i];
                slot.classList.add('occupied');
                if (this.selectedWeaponIndex === i) slot.classList.add('selected');
                if (this.mergeTargetIndex === i) { slot.style.borderColor = '#0F0'; slot.style.boxShadow = '0 0 15px rgba(0,255,0,0.5)'; }
                
                const effectiveDamage = Math.floor(weapon.baseDamage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage);
                let ammoDisplay = '';
                if (weapon.usesAmmo) {
                    ammoDisplay = weapon.isThrowable ? `<div class="throwable-ammo-small"><span class="ammo-count">${weapon.currentAmmo}</span><span class="ammo-max">/${weapon.magazineSize}</span></div>` : `<div class="ammo-display">${weapon.currentAmmo}/${weapon.magazineSize}</div>`;
                }
                
                slot.innerHTML = `<div>${weapon.icon}</div>${weapon.tier > 1 ? `<div class="tier-badge">${weapon.tier}</div>` : ''}<div class="melee-type">${weapon.getTypeDescription()}</div>${ammoDisplay}<div class="cooldown-bar"><div class="cooldown-fill" style="width:100%"></div></div>`;
                
                const idx = i;
                slot.addEventListener('click', () => this.selectWeapon(idx));
                slot.addEventListener('touchstart', (e) => { e.preventDefault(); this.selectWeapon(idx); });
            } else {
                slot.innerHTML = '<div class="empty-slot">+</div>';
            }
            grid.appendChild(slot);
        }
    },
    
    updateCooldowns() {
        const currentTime = Date.now();
        const slots = document.querySelectorAll('.weapon-slot.occupied');
        for (let i = 0; i < Math.min(slots.length, Player.weapons.length); i++) {
            const weapon = Player.weapons[i];
            let cd = 100;
            if (weapon.lastAttack > 0) {
                const cdTime = 1000 / (weapon.attackSpeed * Player.attackSpeedMultiplier);
                cd = Math.min(100, ((currentTime - weapon.lastAttack) / cdTime) * 100);
            }
            const fill = slots[i].querySelector('.cooldown-fill');
            if (fill) { fill.style.width = cd + '%'; fill.style.background = weapon.isReloading ? 'linear-gradient(90deg, #ff0000, #ff8800)' : 'linear-gradient(90deg, #00ff00, #00cc00)'; }
        }
    },
    
    updateShop() {
        const container = document.getElementById('shopItems');
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const shopItem = Shop.items[i];
            const el = document.createElement('div');
            if (shopItem) {
                el.className = 'shop-item';
                const data = shopItem.data;
                const cost = Shop.getCost(shopItem);
                let tierText = '';
                if (shopItem.type === 'weapon' && shopItem.tier > 1) tierText = ` Tier ${shopItem.tier}`;
                el.innerHTML = `<div class="item-info"><div class="item-name">${data.icon} ${data.name}${tierText}</div><div class="item-effect">${data.description}</div></div><div class="item-cost">${cost}g</div>`;
                const idx = i;
                el.addEventListener('click', () => Shop.purchase(idx));
                el.addEventListener('touchstart', (e) => { e.preventDefault(); Shop.purchase(idx); });
            } else {
                el.className = 'shop-item empty';
                el.innerHTML = '<div class="item-info"><div class="item-name">Empty Slot</div><div class="item-effect">Already purchased</div></div><div class="item-cost">-</div>';
            }
            container.appendChild(el);
        }
    },
    
    updateConsumables() {
        const grid = document.getElementById('consumablesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        if (Player.consumables.length === 0) { grid.innerHTML = '<div class="empty-consumable">No consumables</div>'; return; }
        for (let i = 0; i < Player.consumables.length; i++) {
            const c = Player.consumables[i];
            const slot = document.createElement('div');
            slot.className = 'consumable-slot';
            slot.innerHTML = `<div class="consumable-icon">${c.icon}</div><div class="consumable-name">${c.name}</div><div class="consumable-count">${c.count || 1}</div>`;
            const idx = i;
            slot.addEventListener('click', () => Player.useConsumable(idx));
            slot.addEventListener('touchstart', (e) => { e.preventDefault(); Player.useConsumable(idx); });
            grid.appendChild(slot);
        }
    },
    
    updateAbilities() {
        const container = document.getElementById('abilitiesContainer');
        if (!container) return;
        container.innerHTML = '';
        if (Abilities.owned.length === 0) { container.innerHTML = '<div class="empty-consumable">No abilities yet</div>'; return; }
        for (let i = 0; i < Abilities.owned.length; i++) {
            const ability = Abilities.owned[i];
            const cdPercent = Abilities.getCooldownPercent(ability.id);
            const slot = document.createElement('div');
            slot.className = 'consumable-slot';
            slot.style.borderColor = cdPercent >= 100 ? '#ffd700' : '#555';
            slot.innerHTML = `<div class="consumable-icon">${ability.icon}</div><div class="consumable-name">${ability.name}</div><div class="cooldown-bar" style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,0.5);"><div style="height:100%;width:${cdPercent}%;background:${cdPercent >= 100 ? '#0F0' : '#F00'};transition:width 0.1s;"></div></div>`;
            const idx = i;
            slot.addEventListener('click', () => Abilities.useAbility(idx));
            slot.addEventListener('touchstart', (e) => { e.preventDefault(); Abilities.useAbility(idx); });
            container.appendChild(slot);
        }
    },
    
    selectWeapon(index) {
        if (Game.state !== GAME_STATE.SHOP && Game.state !== GAME_STATE.STAT_SELECT && Game.state !== GAME_STATE.WIN) return;
        if (index >= Player.weapons.length) return;
        const weapon = Player.weapons[index];
        if (this.selectedWeaponIndex === -1) {
            this.selectedWeaponIndex = index;
            document.getElementById('scrapWeaponBtn').style.display = 'block';
            document.getElementById('scrapWeaponBtn').innerHTML = `<span>🗑️</span> Scrap ${weapon.getDisplayName()} (${weapon.getScrapValue()}g)`;
            document.getElementById('mergeWeaponBtn').style.display = 'none';
            this.mergeTargetIndex = -1;
        } else if (this.selectedWeaponIndex === index) {
            this.selectedWeaponIndex = -1;
            document.getElementById('scrapWeaponBtn').style.display = 'none';
            document.getElementById('mergeWeaponBtn').style.display = 'none';
            this.mergeTargetIndex = -1;
        } else {
            const first = Player.weapons[this.selectedWeaponIndex];
            if (first.id === weapon.id && first.tier === weapon.tier) {
                this.mergeTargetIndex = index;
                const cost = first.getMergeCost(weapon);
                if (cost > 0 && first.tier < 5) {
                    document.getElementById('mergeWeaponBtn').style.display = 'block';
                    document.getElementById('mergeWeaponBtn').innerHTML = `<span>🔄</span> Merge (Cost: ${cost}g)`;
                }
            } else {
                this.selectedWeaponIndex = index;
                document.getElementById('scrapWeaponBtn').style.display = 'block';
                document.getElementById('scrapWeaponBtn').innerHTML = `<span>🗑️</span> Scrap ${weapon.getDisplayName()} (${weapon.getScrapValue()}g)`;
                document.getElementById('mergeWeaponBtn').style.display = 'none';
                this.mergeTargetIndex = -1;
            }
        }
        this.updateWeapons();
    },
    
    scrapSelected() {
        if (this.selectedWeaponIndex === -1) return;
        const weapon = Player.weapons[this.selectedWeaponIndex];
        if (weapon.id === 'handgun' && Player.weapons.length === 1) { Messages.show('Cannot scrap your only weapon!'); return; }
        Game.gold += weapon.getScrapValue();
        Player.removeWeapon(this.selectedWeaponIndex);
        this.selectedWeaponIndex = -1;
        this.mergeTargetIndex = -1;
        document.getElementById('scrapWeaponBtn').style.display = 'none';
        document.getElementById('mergeWeaponBtn').style.display = 'none';
        this.updateAll();
    },
    
    mergeSelected() {
        if (this.selectedWeaponIndex === -1 || this.mergeTargetIndex === -1) return;
        const w1 = Player.weapons[this.selectedWeaponIndex];
        const w2 = Player.weapons[this.mergeTargetIndex];
        const cost = w1.getMergeCost(w2);
        if (Game.gold < cost) { Messages.show(`Need ${cost} gold!`); return; }
        Game.gold -= cost;
        const merged = w1.merge(w2);
        Player.weapons[this.selectedWeaponIndex] = merged;
        Player.weapons.splice(this.mergeTargetIndex, 1);
        this.selectedWeaponIndex = -1;
        this.mergeTargetIndex = -1;
        document.getElementById('scrapWeaponBtn').style.display = 'none';
        document.getElementById('mergeWeaponBtn').style.display = 'none';
        Messages.show(`Merged to ${merged.getDisplayName()}!`);
        this.updateAll();
    },
    
    showWaveButton() { document.getElementById('nextWaveBtn').style.display = 'block'; },
    hideWaveButton() { document.getElementById('nextWaveBtn').style.display = 'none'; }
};
