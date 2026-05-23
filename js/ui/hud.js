// ============================================
// WAVEFORGE - HUD System
// ============================================

const HUD = {
    init() {
        // Setup shop refresh button
        document.getElementById('refreshShopBtn').addEventListener('click', () => Shop.refresh());
        document.getElementById('refreshShopBtn').addEventListener('touchstart', (e) => { e.preventDefault(); Shop.refresh(); });
        
        // Setup next wave button
        document.getElementById('nextWaveBtn').addEventListener('click', () => Game.startNextWave());
        document.getElementById('nextWaveBtn').addEventListener('touchstart', (e) => { e.preventDefault(); Game.startNextWave(); });
        
        // Setup scrap button
        document.getElementById('scrapWeaponBtn').addEventListener('click', () => this.scrapSelected());
        document.getElementById('scrapWeaponBtn').addEventListener('touchstart', (e) => { e.preventDefault(); this.scrapSelected(); });
        
        // Setup merge button
        document.getElementById('mergeWeaponBtn').addEventListener('click', () => this.mergeSelected());
        document.getElementById('mergeWeaponBtn').addEventListener('touchstart', (e) => { e.preventDefault(); this.mergeSelected(); });
        
        this.selectedWeaponIndex = -1;
        this.mergeTargetIndex = -1;
    },
    
    // Update all HUD elements
    updateAll() {
        this.updateStats();
        this.updateWeapons();
        this.updateShop();
        this.updateConsumables();
    },
    
    // Update stats display
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
        healthFill.style.background = hpPct > 60 ? 'linear-gradient(90deg, #11998e, #38ef7d)' :
                                      hpPct > 30 ? 'linear-gradient(90deg, #f7971e, #ffd200)' :
                                                   'linear-gradient(90deg, #ff416c, #ff4b2b)';
        
        document.getElementById('monsterCount').textContent = `Monsters: ${Monsters.active.length}`;
        document.getElementById('refreshCost').textContent = Game.refreshCost + 'g';
        document.getElementById('refreshCounter').textContent = `Refreshes: ${Game.refreshCount}`;
    },
    
    // Update weapons grid
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
                if (this.mergeTargetIndex === i) {
                    slot.style.borderColor = '#0F0';
                    slot.style.boxShadow = '0 0 15px rgba(0,255,0,0.5)';
                }
                
                const effectiveDamage = Math.floor(weapon.baseDamage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage);
                
                let ammoDisplay = '';
                if (weapon.usesAmmo) {
                    ammoDisplay = weapon.isThrowable ?
                        `<div class="throwable-ammo-small"><span class="ammo-count">${weapon.currentAmmo}</span><span class="ammo-max">/${weapon.magazineSize}</span></div>` :
                        `<div class="ammo-display">${weapon.currentAmmo}/${weapon.magazineSize}</div>`;
                }
                
                slot.innerHTML = `
                    <div>${weapon.icon}</div>
                    ${weapon.tier > 1 ? `<div class="tier-badge">${weapon.tier}</div>` : ''}
                    <div class="melee-type">${weapon.getTypeDescription()}</div>
                    ${ammoDisplay}
                    <div class="cooldown-bar"><div class="cooldown-fill" style="width:100%"></div></div>
                `;
                
                const idx = i;
                slot.addEventListener('click', () => this.selectWeapon(idx));
                slot.addEventListener('touchstart', (e) => { e.preventDefault(); this.selectWeapon(idx); });
            } else {
                slot.innerHTML = '<div class="empty-slot">+</div>';
            }
            
            grid.appendChild(slot);
        }
    },
    
    // Update cooldown bars (called each frame)
    updateCooldowns() {
        const currentTime = Date.now();
        const slots = document.querySelectorAll('.weapon-slot.occupied');
        
        for (let i = 0; i < Math.min(slots.length, Player.weapons.length); i++) {
            const weapon = Player.weapons[i];
            let cooldownPercent = 100;
            
            if (weapon.lastAttack > 0) {
                const cooldownTime = 1000 / (weapon.attackSpeed * Player.attackSpeedMultiplier);
                cooldownPercent = Math.min(100, ((currentTime - weapon.lastAttack) / cooldownTime) * 100);
            }
            
            const fill = slots[i].querySelector('.cooldown-fill');
            if (fill) {
                fill.style.width = cooldownPercent + '%';
                if (weapon.isReloading) {
                    fill.style.background = 'linear-gradient(90deg, #ff0000, #ff8800)';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #00ff00, #00cc00)';
                }
            }
        }
    },
    
    // Update shop display
    updateShop() {
        const container = document.getElementById('shopItems');
        container.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            const shopItem = Shop.items[i];
            const element = document.createElement('div');
            
            if (shopItem) {
                element.className = 'shop-item';
                const data = shopItem.data;
                const cost = Shop.getCost(shopItem);
                let tierText = '', tierClass = '';
                
                if (shopItem.type === 'weapon' && shopItem.tier > 1) {
                    tierText = ` Tier ${shopItem.tier}`;
                    tierClass = ` tier-${shopItem.tier}`;
                }
                
                element.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${data.icon} ${data.name}${tierText}</div>
                        <div class="item-effect">${data.description}</div>
                    </div>
                    <div class="item-cost">${cost}g</div>
                `;
                
                const idx = i;
                element.addEventListener('click', () => Shop.purchase(idx));
                element.addEventListener('touchstart', (e) => { e.preventDefault(); Shop.purchase(idx); });
            } else {
                element.className = 'shop-item empty';
                element.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">Empty Slot</div>
                        <div class="item-effect">Already purchased</div>
                    </div>
                    <div class="item-cost">-</div>
                `;
            }
            
            container.appendChild(element);
        }
    },
    
    // Update consumables display
    updateConsumables() {
        const grid = document.getElementById('consumablesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        if (Player.consumables.length === 0) {
            grid.innerHTML = '<div class="empty-consumable">No consumables</div>';
            return;
        }
        
        for (let i = 0; i < Player.consumables.length; i++) {
            const consumable = Player.consumables[i];
            const slot = document.createElement('div');
            slot.className = 'consumable-slot';
            slot.innerHTML = `
                <div class="consumable-icon">${consumable.icon}</div>
                <div class="consumable-name">${consumable.name}</div>
                <div class="consumable-count">${consumable.count || 1}</div>
            `;
            
            const idx = i;
            slot.addEventListener('click', () => this.useConsumable(idx));
            slot.addEventListener('touchstart', (e) => { e.preventDefault(); this.useConsumable(idx); });
            grid.appendChild(slot);
        }
    },
    
    // Use a consumable
    useConsumable(index) {
        if (Game.state !== GAME_STATE.WAVE) {
            Messages.show('Can only use consumables during waves!');
            return;
        }
        
        const consumable = Player.consumables[index];
        if (!consumable) return;
        
        switch (consumable.id) {
            case 'health_potion':
                const healAmount = Math.floor(Player.maxHealth * 0.25);
                Player.heal(healAmount);
                Messages.show(`Used Health Potion! +${healAmount} HP`);
                break;
            case 'ammo_pack':
                Player.weapons.forEach(w => {
                    if (w.usesAmmo && !w.isThrowable) {
                        w.currentAmmo = w.magazineSize;
                        w.isReloading = false;
                    }
                });
                Messages.show('Used Ammo Pack! All weapons reloaded');
                break;
            case 'rage_potion':
                Player.damageMultiplier *= 1.5;
                Messages.show('RAGE! +50% damage for 10 seconds!');
                setTimeout(() => { Player.damageMultiplier /= 1.5; Messages.show('Rage effect ended'); }, 10000);
                break;
            case 'bomb':
                if (Player.entity) {
                    Effects.explosion(Player.entity.x, Player.entity.y, 150, '#FF4500');
                    for (let i = Monsters.active.length - 1; i >= 0; i--) {
                        const monster = Monsters.active[i];
                        if (Physics.distance(Player.entity, monster) < 150 + monster.radius) {
                            monster.health -= 100;
                            Effects.damageIndicator(monster.x, monster.y, 100, true);
                            if (monster.health <= 0) Monsters.handleDeath(monster, i);
                        }
                    }
                    Messages.show('Boom!');
                }
                break;
            case 'exp_scroll':
                const upgradable = Player.weapons.filter(w => w.tier < 5);
                if (upgradable.length > 0) {
                    const weapon = upgradable[Math.floor(Math.random() * upgradable.length)];
                    weapon.tier++;
                    weapon.applyTierBonuses();
                    Messages.show(`${weapon.name} upgraded to Tier ${weapon.tier}!`);
                }
                break;
            case 'healing_tower':
                Towers.placeHealingTower();
                break;
        }
        
        if (consumable.count > 1) {
            consumable.count--;
        } else {
            Player.consumables.splice(index, 1);
        }
        
        this.updateConsumables();
    },
    
    // Weapon selection
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
            const firstWeapon = Player.weapons[this.selectedWeaponIndex];
            if (firstWeapon.id === weapon.id && firstWeapon.tier === weapon.tier) {
                this.mergeTargetIndex = index;
                const mergeCost = firstWeapon.getMergeCost(weapon);
                if (mergeCost > 0 && firstWeapon.tier < 5) {
                    document.getElementById('mergeWeaponBtn').style.display = 'block';
                    document.getElementById('mergeWeaponBtn').innerHTML = `<span>🔄</span> Merge (Cost: ${mergeCost}g)`;
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
    
    // Scrap selected weapon
    scrapSelected() {
        if (this.selectedWeaponIndex === -1) return;
        const weapon = Player.weapons[this.selectedWeaponIndex];
        if (weapon.id === 'handgun' && Player.weapons.length === 1) {
            Messages.show('Cannot scrap your only weapon!');
            return;
        }
        
        Game.gold += weapon.getScrapValue();
        Player.removeWeapon(this.selectedWeaponIndex);
        this.selectedWeaponIndex = -1;
        this.mergeTargetIndex = -1;
        document.getElementById('scrapWeaponBtn').style.display = 'none';
        document.getElementById('mergeWeaponBtn').style.display = 'none';
        Messages.show(`Scrapped ${weapon.getDisplayName()}!`);
        this.updateAll();
    },
    
    // Merge weapons
    mergeSelected() {
        if (this.selectedWeaponIndex === -1 || this.mergeTargetIndex === -1) return;
        
        const w1 = Player.weapons[this.selectedWeaponIndex];
        const w2 = Player.weapons[this.mergeTargetIndex];
        const mergeCost = w1.getMergeCost(w2);
        
        if (Game.gold < mergeCost) {
            Messages.show(`Need ${mergeCost} gold to merge!`);
            return;
        }
        
        Game.gold -= mergeCost;
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
    
    // Show/hide wave button
    showWaveButton() {
        document.getElementById('nextWaveBtn').style.display = 'block';
    },
    
    hideWaveButton() {
        document.getElementById('nextWaveBtn').style.display = 'none';
    }
};
