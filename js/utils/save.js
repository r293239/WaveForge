// ============================================
// WAVEFORGE - Save System
// ============================================

const Save = {
    STORAGE_KEY: 'waveforge_save',

    // Serialise current game to a compact object and store
    saveGame() {
        const data = {
            version: 1,
            difficulty: Game.difficulty,
            wave: Game.wave,
            gold: Game.gold,
            kills: Game.kills,
            refreshCount: Game.refreshCount,
            refreshCost: Game.refreshCost,
            sandboxMode: Game.sandboxMode,
            gameWon: Game.gameWon,

            // Player stats
            player: {
                health: Player.health,
                maxHealth: Player.maxHealth,
                damageMultiplier: Player.damageMultiplier,
                speedMultiplier: Player.speedMultiplier,
                lifeSteal: Player.lifeSteal,
                lifeStealRemainder: Player.lifeStealRemainder || 0,
                criticalChance: Player.criticalChance,
                goldMultiplier: Player.goldMultiplier,
                healthRegen: Player.healthRegen,
                healthRegenPercent: Player.healthRegenPercent,
                damageReduction: Player.damageReduction,
                dodgeChance: Player.dodgeChance,
                thornsDamage: Player.thornsDamage,
                attackSpeedMultiplier: Player.attackSpeedMultiplier,
                reloadSpeedMultiplier: Player.reloadSpeedMultiplier,
                firstHitReduction: Player.firstHitReduction,
                firstHitActive: Player.firstHitActive,
                guardianAngel: Player.guardianAngel,
                guardianAngelUsed: Player.guardianAngelUsed,
                bloodContract: Player.bloodContract,
                bloodContractStacks: Player.bloodContractStacks,
                berserkerRing: Player.berserkerRing,
                knockback: Player.knockback,
                explosiveKills: Player.explosiveKills,
                goldMagnet: Player.goldMagnet,
                facingAngle: Player.facingAngle,
                lastFacingAngle: Player.lastFacingAngle
            },

            // Weapons – store id, tier, ammo, throw state, and upgrade flags
            weapons: Player.weapons.map(w => ({
                id: w.id,
                tier: w.tier,
                currentAmmo: w.usesAmmo ? w.currentAmmo : undefined,
                isReloading: w.usesAmmo ? w.isReloading : undefined,
                isThrown: w.id === 'spear' ? w.isThrown : undefined,
                thrownX: w.id === 'spear' ? w.thrownX : undefined,
                thrownY: w.id === 'spear' ? w.thrownY : undefined,
                // Persist upgrade flags that are on the weapon
                poisonDamage: w.poisonDamage,
                poisonDuration: w.poisonDuration,
                fireDamage: w.fireDamage,
                fireDuration: w.fireDuration,
                bleedDamage: w.bleedDamage,
                bleedDuration: w.bleedDuration,
                stunDuration: w.stunDuration,
                doubleThrow: w.doubleThrow,
                orbitalMode: w.orbitalMode,
                tripleShot: w.tripleShot,
                explosiveShot: w.explosiveShot,
                explosiveDamage: w.explosiveDamage,
                explosiveRadius: w.explosiveRadius,
                forkLaser: w.forkLaser,
                lightningStrike: w.lightningStrike,
                returnSpeed: w.returnSpeed,
                pierceCount: w.pierceCount,
                pelletCount: w.pelletCount,
                spreadAngle: w.spreadAngle,
                bounceCount: w.bounceCount,
                bounceRange: w.bounceRange,
                maxTargets: w.maxTargets,
                // baseDamage and attackSpeed are derived from tier and multipliers, but we'll reapply tier bonuses on load
            })),

            // Consumables
            consumables: Player.consumables.map(c => ({
                id: c.id,
                count: c.count
            })),

            // Abilities – store type and cooldown remaining
            abilities: Abilities.abilities ? Abilities.abilities.map(a => ({
                id: a.id,
                cooldownRemaining: a.cooldownRemaining || 0,
                active: a.active || false
            })) : [],

            // Towers
            towers: {
                landmines: Towers.landmines.count,
                healingTowers: Towers.healingTowers.count,
                turrets: Towers.turrets.count
            },

            // Purchased items & weapon upgrades
            purchasedItems: { ...Game.purchasedItems },
            weaponUpgrades: { ...Game.weaponUpgrades }
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save game:', e);
        }
    },

    // Load game from storage and resume
    loadGame() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            Messages.show('No save found!');
            return false;
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            Messages.show('Save corrupted!');
            this.clearSave();
            return false;
        }

        // Reset everything to a clean state first
        Player.reset();
        Monsters.reset();
        Boss.reset();
        Projectiles.reset();
        Towers.reset();
        Effects.reset();
        Abilities.reset();

        // Restore game state
        Game.difficulty = data.difficulty;
        Game.setDifficulty(data.difficulty);  // reapply multipliers
        Game.wave = data.wave;
        Game.gold = data.gold;
        Game.kills = data.kills;
        Game.refreshCount = data.refreshCount;
        Game.refreshCost = data.refreshCost;
        Game.sandboxMode = data.sandboxMode;
        Game.gameWon = data.gameWon;
        Game.purchasedItems = data.purchasedItems || {};
        Game.weaponUpgrades = data.weaponUpgrades || {};

        // Restore player stats
        const p = data.player;
        Player.health = p.health;
        Player.maxHealth = p.maxHealth;
        Player.damageMultiplier = p.damageMultiplier;
        Player.speedMultiplier = p.speedMultiplier;
        Player.speed = Player.baseSpeed * Player.speedMultiplier;
        Player.lifeSteal = p.lifeSteal;
        Player.lifeStealRemainder = p.lifeStealRemainder || 0;
        Player.criticalChance = p.criticalChance;
        Player.goldMultiplier = p.goldMultiplier;
        Player.healthRegen = p.healthRegen;
        Player.healthRegenPercent = p.healthRegenPercent;
        Player.damageReduction = p.damageReduction;
        Player.dodgeChance = p.dodgeChance;
        Player.thornsDamage = p.thornsDamage;
        Player.attackSpeedMultiplier = p.attackSpeedMultiplier;
        Player.reloadSpeedMultiplier = p.reloadSpeedMultiplier;
        Player.firstHitReduction = p.firstHitReduction;
        Player.firstHitActive = p.firstHitActive;
        Player.guardianAngel = p.guardianAngel;
        Player.guardianAngelUsed = p.guardianAngelUsed;
        Player.bloodContract = p.bloodContract;
        Player.bloodContractStacks = p.bloodContractStacks;
        Player.berserkerRing = p.berserkerRing;
        Player.knockback = p.knockback;
        Player.explosiveKills = p.explosiveKills;
        Player.goldMagnet = p.goldMagnet;
        Player.facingAngle = p.facingAngle;
        Player.lastFacingAngle = p.lastFacingAngle;

        // Restart blood contract interval if needed
        if (Player.bloodContract) {
            if (Player.bloodContractInterval) clearInterval(Player.bloodContractInterval);
            Player.bloodContractInterval = setInterval(() => {
                if (Game.state === GAME_STATE.WAVE) {
                    const dmg = Math.max(1, Math.floor(Player.maxHealth * 0.01 * Player.bloodContractStacks));
                    if (Player.health > dmg) Player.takeDamage(dmg);
                }
            }, 1000);
        }

        // Restore weapons
        Player.weapons = [];
        for (let wData of data.weapons) {
            const base = WEAPON_DATA.find(w => w.id === wData.id);
            if (!base) continue;
            const weapon = WeaponBase.create(base, wData.tier);
            // Restore ammo/throw state
            if (weapon.usesAmmo) {
                weapon.currentAmmo = wData.currentAmmo ?? weapon.magazineSize;
                weapon.isReloading = wData.isReloading || false;
            }
            if (wData.id === 'spear') {
                weapon.isThrown = wData.isThrown || false;
                weapon.thrownX = wData.thrownX || 0;
                weapon.thrownY = wData.thrownY || 0;
            }
            // Restore upgrade flags
            weapon.poisonDamage = wData.poisonDamage;
            weapon.poisonDuration = wData.poisonDuration;
            weapon.fireDamage = wData.fireDamage;
            weapon.fireDuration = wData.fireDuration;
            weapon.bleedDamage = wData.bleedDamage;
            weapon.bleedDuration = wData.bleedDuration;
            weapon.stunDuration = wData.stunDuration;
            weapon.doubleThrow = wData.doubleThrow;
            weapon.orbitalMode = wData.orbitalMode;
            weapon.tripleShot = wData.tripleShot;
            weapon.explosiveShot = wData.explosiveShot;
            weapon.explosiveDamage = wData.explosiveDamage;
            weapon.explosiveRadius = wData.explosiveRadius;
            weapon.forkLaser = wData.forkLaser;
            weapon.lightningStrike = wData.lightningStrike;
            weapon.returnSpeed = wData.returnSpeed;
            weapon.pierceCount = wData.pierceCount;
            weapon.pelletCount = wData.pelletCount;
            weapon.spreadAngle = wData.spreadAngle;
            weapon.bounceCount = wData.bounceCount;
            weapon.bounceRange = wData.bounceRange;
            weapon.maxTargets = wData.maxTargets;

            Player.weapons.push(weapon);
        }

        // Restore consumables
        Player.consumables = data.consumables.map(c => ({
            id: c.id,
            name: (ITEM_DATA.find(i => i.id === c.id) || {}).name || c.id,
            icon: (ITEM_DATA.find(i => i.id === c.id) || {}).icon || '❓',
            description: (ITEM_DATA.find(i => i.id === c.id) || {}).description || '',
            count: c.count
        }));

        // Restore abilities
        Abilities.reset();
        for (let aData of data.abilities) {
            const ability = Abilities.abilities.find(a => a.id === aData.id);
            if (ability) {
                ability.cooldownRemaining = aData.cooldownRemaining;
                ability.active = aData.active;
            } else {
                Abilities.addAbility(aData.id);  // re-add if missing
            }
        }

        // Restore tower counts
        Towers.landmines.count = data.towers.landmines;
        Towers.healingTowers.count = data.towers.healingTowers;
        Towers.turrets.count = data.towers.turrets;

        // Setup game state for next wave
        Game.state = GAME_STATE.SHOP;
        Game.waveActive = false;
        Shop.generateItems();
        HUD.updateAll();
        HUD.updateConsumables();
        Overlays.hideAll();
        Messages.show('Game loaded!');
        return true;
    },

    // Clear saved data
    clearSave() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
