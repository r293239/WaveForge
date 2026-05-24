// ============================================
// WAVEFORGE - Base Weapon Class & Factory
// ============================================

const WeaponBase = {
    create(weaponData, tier = 1) {
        return new WeaponInstance(weaponData, tier);
    }
};

class WeaponInstance {
    constructor(weaponData, tier = 1) {
        this.id = weaponData.id;
        this.name = weaponData.name;
        this.icon = weaponData.icon;
        this.type = weaponData.type;
        this.meleeType = weaponData.meleeType || 'single';
        this.tier = tier;
        this.baseDamage = weaponData.baseDamage;
        this.attackSpeed = weaponData.attackSpeed;
        this.range = weaponData.range;
        this.description = weaponData.description;
        this.cost = weaponData.cost || 0;
        this.baseCost = weaponData.cost || 0;
        this.lastAttack = 0;
        this.animation = weaponData.animation || 'default';
        this.spread = weaponData.spread || 0;
        this.lastAttackTime = 0;
        this.usesAmmo = weaponData.usesAmmo || false;
        this.isThrowable = weaponData.isThrowable || false;
        this.resetEachRound = weaponData.resetEachRound || false;
        this.projectileSize = weaponData.projectileSize || 4;
        this.spinSpeed = weaponData.spinSpeed || 0;
        this.targetingPriority = weaponData.targetingPriority || 'normal';
        this.sniper = weaponData.sniper || false;
        this.knivesUsed = new Map();
        
        if (this.usesAmmo) {
            this.magazineSize = weaponData.magazineSize;
            this.currentAmmo = this.magazineSize;
            this.reloadTime = weaponData.reloadTime;
            this.isReloading = false;
            this.reloadStart = 0;
        }
        
        this.pelletCount = weaponData.pelletCount || 1;
        this.spreadAngle = weaponData.spreadAngle || 0;
        this.bounceCount = weaponData.bounceCount || 0;
        this.bounceRange = weaponData.bounceRange || 0;
        this.returnSpeed = weaponData.returnSpeed || 0;
        this.maxTargets = weaponData.maxTargets || 1;
        this.useImage = weaponData.useImage || false;
        this.imagePath = weaponData.imagePath || null;
        this.pierceCount = weaponData.pierceCount || 1;
        this.dualStrike = weaponData.dualStrike || false;
        
        this.bladeColor = weaponData.bladeColor || weaponData.swingColor;
        this.hiltColor = weaponData.hiltColor || '#8B4513';
        this.handleColor = weaponData.handleColor || '#654321';
        this.headColor = weaponData.headColor || '#696969';
        this.edgeColor = weaponData.edgeColor || '#CD7F32';
        this.shaftColor = weaponData.shaftColor || '#8B4513';
        this.prongColor = weaponData.prongColor || '#CD7F32';
        this.tipColor = weaponData.tipColor || '#FFD700';
        this.gripColor = weaponData.gripColor || '#8B4513';
        
        if (this.type === 'ranged') {
            this.projectileSpeed = weaponData.projectileSpeed;
            this.projectileColor = weaponData.projectileColor;
        } else {
            this.swingColor = weaponData.swingColor;
            this.swingAngle = weaponData.swingAngle || 90;
            this.trailColor = weaponData.trailColor || '#FFFFFF';
            this.sparkleColor = weaponData.sparkleColor || '#FFD700';
            this.shockwaveColor = weaponData.shockwaveColor || '#FFA500';
            this.shockwaveIntensity = weaponData.shockwaveIntensity || 1;
        }
        
        this.poisonDamage = null;
        this.poisonDuration = null;
        this.fireDamage = null;
        this.fireDuration = null;
        this.bleedDamage = null;
        this.bleedDuration = null;
        this.stunDuration = null;
        this.doubleThrow = false;
        this.orbitalMode = false;
        this.tripleShot = false;
        this.explosiveShot = false;
        this.explosiveDamage = 0;
        this.explosiveRadius = 0;
        this.forkLaser = false;
        
        this.tierMultipliers = weaponData.tierMultipliers || {};
        this.applyTierBonuses();
    }
    
    applyTierBonuses() {
        if (this.tier > 1 && this.tierMultipliers) {
            const t = this.tier;
            if (this.tierMultipliers.damage) this.baseDamage = Math.round(this.baseDamage * this.tierMultipliers.damage[t]);
            if (this.tierMultipliers.attackSpeed) this.attackSpeed *= this.tierMultipliers.attackSpeed[t];
            if (this.tierMultipliers.range) this.range = Math.round(this.range * this.tierMultipliers.range[t]);
            if (this.usesAmmo && this.tierMultipliers.magazine) {
                this.magazineSize = Math.round(this.magazineSize * this.tierMultipliers.magazine[t]);
                if (!this.isThrowable) this.currentAmmo = this.magazineSize;
            }
            if (this.tierMultipliers.pelletCount) this.pelletCount = Math.round(this.pelletCount * this.tierMultipliers.pelletCount[t]);
            if (this.tierMultipliers.bounceCount) this.bounceCount = Math.round(this.bounceCount * this.tierMultipliers.bounceCount[t]);
            if (this.tierMultipliers.maxTargets) this.maxTargets = Math.round(this.maxTargets * this.tierMultipliers.maxTargets[t]);
            if (this.tierMultipliers.pierceCount) this.pierceCount = Math.round(this.pierceCount * this.tierMultipliers.pierceCount[t]);
            if (this.tierMultipliers.shockwaveIntensity) this.shockwaveIntensity *= this.tierMultipliers.shockwaveIntensity[t];
        }
    }
    
    canAttack(currentTime) {
        if (this.isReloading) return false;
        if (this.usesAmmo && this.currentAmmo <= 0) {
            if (!this.isThrowable) this.startReload();
            return false;
        }
        if (this.lastAttackTime > 0 && currentTime - this.lastAttackTime < 5) return false;
        return (currentTime - this.lastAttack) >= (1000 / (this.attackSpeed * Player.attackSpeedMultiplier));
    }
    
    startReload() {
        if (!this.usesAmmo || this.isReloading || this.currentAmmo === this.magazineSize || this.isThrowable) return;
        this.isReloading = true;
        this.reloadStart = Date.now();
        const reloadMultiplier = Player.reloadSpeedMultiplier || 1.0;
        const adjustedReloadTime = this.reloadTime / reloadMultiplier;
        Messages.show(`${this.name} - RELOADING...`, 1000);
        setTimeout(() => {
            this.currentAmmo = this.magazineSize;
            this.isReloading = false;
        }, adjustedReloadTime);
    }
    
    useAmmo() {
        if (!this.usesAmmo) return;
        this.currentAmmo--;
        if (this.currentAmmo <= 0 && !this.isThrowable) this.startReload();
    }
    
    resetAmmo() {
        if (this.resetEachRound) {
            this.currentAmmo = this.magazineSize;
            this.isReloading = false;
            this.knivesUsed.clear();
        }
    }
    
    trackKnifeHit(monster) {
        if (!this.isThrowable) return;
        this.knivesUsed.set(monster, (this.knivesUsed.get(monster) || 0) + 1);
    }
    
    returnKnives(monster) {
        if (!this.isThrowable) return 0;
        const hits = this.knivesUsed.get(monster) || 0;
        if (hits > 0) {
            this.knivesUsed.delete(monster);
            this.currentAmmo = Math.min(this.magazineSize, this.currentAmmo + hits);
        }
        return hits;
    }
    
    attack(playerX, playerY, targetX, targetY) {
        const currentTime = Date.now();
        if (this.usesAmmo && !this.isReloading) this.useAmmo();
        this.lastAttack = currentTime;
        this.lastAttackTime = currentTime;
        const angle = Math.atan2(targetY - playerY, targetX - playerX);
        
        if (this.type === 'ranged') {
            return RangedWeapons.createProjectile(this, playerX, playerY, angle, currentTime);
        } else {
            return MeleeWeapons.createAttack(this, playerX, playerY, angle, currentTime);
        }
    }
    
    getScrapValue() {
        return Math.floor(this.baseCost * 0.5 * (1 + (this.tier - 1) * 0.5));
    }
    
    getTypeDescription() {
        if (this.type === 'ranged') {
            if (this.id === 'shotgun') return 'SHOTGUN';
            if (this.id === 'laser') return 'ENERGY';
            if (this.id === 'boomerang') return 'BOOMERANG';
            if (this.id === 'throwing_knives') return 'THROWING';
            if (this.id === 'sniper') return 'SNIPER';
            if (this.id === 'crossbow') return 'CROSSBOW';
            return 'RANGED';
        }
        if (this.meleeType === 'single') return 'SINGLE';
        if (this.meleeType === 'aoe') return 'AOE 360°';
        if (this.meleeType === 'pierce') return 'PIERCE';
        if (this.meleeType === 'dual') return 'DUAL';
        return 'MELEE';
    }
    
    getDisplayName() {
        return this.tier === 1 ? this.name : `${this.name} ${['', 'II', 'III', 'IV', 'V', 'VI'][this.tier]}`;
    }
    
    getShopCost() {
        if (this.tier === 2) return Math.floor(this.baseCost * 2 * 0.75);
        if (this.tier > 2) return Math.floor(this.baseCost * Math.pow(1.8, this.tier - 1));
        return this.baseCost;
    }
    
    getMergeCost(other) {
        if (this.id === other.id && this.tier === other.tier && this.tier < 5) {
            return Math.floor(this.baseCost * 0.3 * this.tier);
        }
        return 0;
    }
    
    merge(other) {
        if (this.id === other.id && this.tier === other.tier && this.tier < 5) {
            const weaponData = WEAPON_DATA.find(w => w.id === this.id);
            return WeaponBase.create(weaponData, this.tier + 1);
        }
        return null;
    }
}
