// ============================================
// WAVEFORGE - Upgrades System
// ============================================

const Upgrades = {
    currentOptions: [],
    
    init() {},
    
    // Generate upgrade options for after-wave selection
    generateOptions() {
        const options = [...STAT_BUFFS];
        
        // Add weapon upgrades
        const weaponOptions = this.getAvailableWeaponUpgrades();
        const shuffled = weaponOptions.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(2, shuffled.length); i++) {
            options.push(shuffled[i]);
        }
        
        // Select 4 random options
        this.currentOptions = [];
        for (let i = 0; i < 4; i++) {
            if (options.length) {
                const idx = Math.floor(Math.random() * options.length);
                this.currentOptions.push(options[idx]);
                options.splice(idx, 1);
            }
        }
    },
    
    // Get available weapon upgrades (not yet applied)
    getAvailableWeaponUpgrades() {
        const available = [];
        for (let upgrade of WEAPON_UPGRADES) {
            if (Game.weaponUpgrades[upgrade.weaponId]) continue;
            if (!Player.getWeaponById(upgrade.weaponId)) continue;
            available.push(upgrade);
        }
        return available;
    },
    
    // Show upgrade selection overlay
    showSelection() {
        this.generateOptions();
        
        const overlay = document.getElementById('waveCompleteOverlay');
        const buffsContainer = document.getElementById('statBuffs');
        
        overlay.style.display = 'flex';
        buffsContainer.innerHTML = '';
        
        for (let buff of this.currentOptions) {
            const element = document.createElement('div');
            element.className = 'stat-buff';
            element.innerHTML = `
                <div class="buff-name">${buff.icon} ${buff.name}</div>
                <div class="buff-description">${buff.description}</div>
            `;
            element.addEventListener('click', () => this.selectUpgrade(buff));
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectUpgrade(buff);
            });
            buffsContainer.appendChild(element);
        }
    },
    
    // Apply selected upgrade
    selectUpgrade(buff) {
        if (buff.weaponId) {
            this.applyWeaponUpgrade(buff);
        } else {
            this.applyStatBuff(buff);
        }
        
        Messages.show(`Selected: ${buff.name}`);
        document.getElementById('waveCompleteOverlay').style.display = 'none';
        
        Game.state = GAME_STATE.SHOP;
        Shop.generateItems();
        HUD.updateAll();
        HUD.showWaveButton();
    },
    
    // Apply stat buff
    applyStatBuff(buff) {
        const e = buff.effect;
        if (e.maxHealthPercent) {
            const oldMax = Player.maxHealth;
            Player.maxHealth = Math.floor(oldMax * (1 + e.maxHealthPercent));
            Player.health += Player.maxHealth - oldMax;
        }
        if (e.damagePercent) Player.damageMultiplier += e.damagePercent;
        if (e.speedPercent) {
            Player.speedMultiplier += e.speedPercent;
            Player.speed = Player.baseSpeed * Player.speedMultiplier;
        }
        if (e.lifeSteal) Player.lifeSteal += e.lifeSteal;
        if (e.criticalChance) Player.criticalChance += e.criticalChance;
        if (e.goldMultiplier) Player.goldMultiplier += e.goldMultiplier;
        if (e.healthRegenPercent) Player.healthRegenPercent += e.healthRegenPercent;
        if (e.damageReduction) Player.damageReduction += e.damageReduction;
        if (e.dodgeChance) Player.dodgeChance += e.dodgeChance;
        if (e.thornsDamage) Player.thornsDamage = e.thornsDamage;
        if (e.attackSpeedMultiplier) Player.attackSpeedMultiplier += e.attackSpeedMultiplier;
        if (e.reloadSpeedMultiplier) {
            Player.reloadSpeedMultiplier += e.reloadSpeedMultiplier;
            Messages.show(`Reload speed +${Math.floor(e.reloadSpeedMultiplier * 100)}%!`);
        }
    },
    
    // Silent version – applies upgrade effects to a weapon instance without UI message
    applyWeaponUpgradeSilent(upgrade, weapon) {
        const e = upgrade.effect;
        if (e.poisonDamage) { weapon.poisonDamage = e.poisonDamage; weapon.poisonDuration = e.poisonDuration; }
        if (e.fireDamage) { weapon.fireDamage = e.fireDamage; weapon.fireDuration = e.fireDuration; }
        if (e.bleedDamage) { weapon.bleedDamage = e.bleedDamage; weapon.bleedDuration = e.bleedDuration; }
        if (e.attackSpeedMult) weapon.attackSpeed *= e.attackSpeedMult;
        if (e.critChance) Player.criticalChance += e.critChance;
        if (e.stunDuration) weapon.stunDuration = e.stunDuration;
        
        // Loyal Trident
        if (e.returningWeapon) {
            weapon.isThrowable = true;
            weapon.returnSpeed = 12;
            weapon.usesAmmo = true;
            weapon.magazineSize = 1;
            weapon.currentAmmo = 1;
            weapon.resetEachRound = true;
        }
        
        // Channeling Trident
        if (e.lightningStrike) weapon.lightningStrike = true;
        if (e.removePierce) weapon.pierceCount = 1;
        
        if (e.pelletCount) weapon.pelletCount = e.pelletCount;
        if (e.spreadAngle) weapon.spreadAngle = e.spreadAngle;
        if (e.spreadMult) weapon.spreadAngle = Math.floor(weapon.spreadAngle * e.spreadMult);
        if (e.slugMode) { weapon.pelletCount = 1; weapon.baseDamage += e.slugDamage; weapon.spreadAngle = 0; }
        if (e.pierceCount) weapon.pierceCount = e.pierceCount;
        if (e.forkLaser) weapon.forkLaser = true;
        if (e.doubleThrow) weapon.doubleThrow = true;
        if (e.orbitalMode) weapon.orbitalMode = true;
        if (e.bounceCount) { weapon.bounceCount = e.bounceCount; weapon.bounceRange = e.bounceRange; }
        if (e.explosiveShot) { weapon.explosiveShot = true; weapon.explosiveDamage = e.explosiveDamage; weapon.explosiveRadius = e.explosiveRadius; }
        if (e.tripleShot) weapon.tripleShot = true;
    },
    
    // Apply weapon upgrade (with message)
    applyWeaponUpgrade(upgrade) {
        // Store the upgrade globally so future merges/new weapons can apply it
        Game.weaponUpgrades[upgrade.weaponId] = upgrade.id;
        const weapon = Player.getWeaponById(upgrade.weaponId);
        if (!weapon) return;
        
        this.applyWeaponUpgradeSilent(upgrade, weapon);
        Messages.show(`${upgrade.name} applied to ${weapon.name}!`);
    }
};
