// ============================================
// WAVEFORGE - Abilities System
// ============================================

const Abilities = {
    owned: [],
    cooldowns: {},
    
    definitions: {
        // === BOSS REWARD ABILITIES (Guaranteed drops) ===
        dash: {
            id: 'dash',
            name: 'Shadow Dash',
            description: 'Dash through enemies dealing 50 damage',
            icon: '💨',
            cooldown: 8000,
            bossWave: 30,
            guaranteed: true,
            onUse() {
                if (!Player.entity) return;
                const angle = Player.facingAngle;
                const dashDist = 200;
                Player.isDashing = true;
                Player.dashProgress = 0;
                Player.dashDamage = 50;
                Player.dashStart = { x: Player.entity.x, y: Player.entity.y };
                Player.dashTarget = {
                    x: Player.entity.x + Math.cos(angle) * dashDist,
                    y: Player.entity.y + Math.sin(angle) * dashDist
                };
                Effects.shockwave(Player.entity.x, Player.entity.y, 40, '#4B0082');
                
                const dashInterval = setInterval(() => {
                    if (!Player.isDashing || Player.dashProgress >= 1) {
                        clearInterval(dashInterval);
                        Player.isDashing = false;
                        return;
                    }
                    Player.dashProgress += 0.1;
                    Player.entity.x = Player.dashStart.x + (Player.dashTarget.x - Player.dashStart.x) * Player.dashProgress;
                    Player.entity.y = Player.dashStart.y + (Player.dashTarget.y - Player.dashStart.y) * Player.dashProgress;
                    
                    for (let monster of Monsters.active) {
                        if (Physics.distance(Player.entity, monster) < Player.entity.radius + monster.radius + 25) {
                            if (!monster._dashHit) {
                                monster._dashHit = true;
                                monster.health -= Player.dashDamage;
                                Effects.damageIndicator(monster.x, monster.y, Player.dashDamage, true);
                                if (monster.health <= 0) {
                                    const idx = Monsters.active.indexOf(monster);
                                    if (idx > -1) Monsters.handleDeath(monster, idx);
                                }
                            }
                        }
                    }
                }, 16);
                
                setTimeout(() => { Monsters.active.forEach(m => m._dashHit = false); }, 600);
            }
        },
        
        asteroid: {
            id: 'asteroid',
            name: 'Meteor Strike',
            description: 'Call down a meteor dealing 100 AOE damage',
            icon: '☄️',
            cooldown: 12000,
            bossWave: 20,
            guaranteed: true,
            onUse() {
                if (!Player.entity) return;
                const x = Player.mouseX;
                const y = Player.mouseY;
                const radius = 50;
                Effects.asteroidWarning(x, y, radius);
                
                setTimeout(() => {
                    Effects.asteroidImpact(x, y, radius);
                    for (let i = Monsters.active.length - 1; i >= 0; i--) {
                        const monster = Monsters.active[i];
                        if (Physics.distance({x, y}, monster) < radius + monster.radius) {
                            monster.health -= 100;
                            Effects.damageIndicator(monster.x, monster.y, 100, true);
                            if (monster.health <= 0) Monsters.handleDeath(monster, i);
                        }
                    }
                    if (Physics.distance({x, y}, Player.entity) < radius + Player.entity.radius) {
                        Player.takeDamage(25);
                    }
                }, 800);
            }
        },
        
        // === RANDOM ABILITIES (1% chance after waves) ===
        bloodlust: {
            id: 'bloodlust',
            name: 'Bloodlust',
            description: 'All nearby enemies bleed for 5 seconds',
            icon: '🩸',
            cooldown: 20000,
            onUse() {
                if (!Player.entity) return;
                let count = 0;
                for (let monster of Monsters.active) {
                    if (Physics.distance(Player.entity, monster) < 200) {
                        monster.bleeding = true;
                        monster.bleedDmg = 10;
                        monster.bleedEnd = Date.now() + 5000;
                        count++;
                    }
                }
                Messages.show(`Bloodlust! ${count} enemies bleeding!`);
            }
        },
        
        bandage: {
            id: 'bandage',
            name: 'Bandage',
            description: 'Heal 30% of max health instantly',
            icon: '🩹',
            cooldown: 25000,
            onUse() {
                const healAmount = Math.floor(Player.maxHealth * 0.3);
                Player.heal(healAmount);
                Messages.show(`Bandaged! +${healAmount} HP`);
            }
        },
        
        instantReload: {
            id: 'instantReload',
            name: 'Quick Load',
            description: 'Instantly reload all weapons',
            icon: '⚡',
            cooldown: 15000,
            onUse() {
                Player.weapons.forEach(w => {
                    if (w.usesAmmo) { w.currentAmmo = w.magazineSize; w.isReloading = false; }
                });
                Messages.show('All weapons reloaded!');
            }
        },
        
        overcharge: {
            id: 'overcharge',
            name: 'Overcharge',
            description: 'Random weapon gets +1 tier for 20 seconds',
            icon: '⬆️',
            cooldown: 20000,
            onUse() {
                const weapon = Player.weapons[Math.floor(Math.random() * Player.weapons.length)];
                if (!weapon) return;
                const oldTier = weapon.tier;
                weapon.tier = Math.min(6, weapon.tier + 1);
                weapon.applyTierBonuses();
                Messages.show(`${weapon.name} overcharged to Tier ${weapon.tier}!`);
                setTimeout(() => {
                    weapon.tier = oldTier;
                    weapon.applyTierBonuses();
                }, 20000);
            }
        },
        
        adrenaline: {
            id: 'adrenaline',
            name: 'Adrenaline Rush',
            description: '+50% attack speed for 10 seconds',
            icon: '💉',
            cooldown: 25000,
            onUse() {
                Player.attackSpeedMultiplier += 0.5;
                Messages.show('Adrenaline Rush! +50% attack speed');
                setTimeout(() => { Player.attackSpeedMultiplier -= 0.5; }, 10000);
            }
        },
        
        fortify: {
            id: 'fortify',
            name: 'Fortify',
            description: 'Become invulnerable for 5 seconds',
            icon: '🛡️',
            cooldown: 30000,
            onUse() {
                Player.invulnerable = true;
                Messages.show('Fortified! Invulnerable for 5s');
                setTimeout(() => { Player.invulnerable = false; }, 5000);
            }
        },
        
        chainLightning: {
            id: 'chainLightning',
            name: 'Chain Lightning',
            description: 'Strike nearest enemy with chain lightning',
            icon: '⚡',
            cooldown: 10000,
            onUse() {
                if (!Player.entity || Monsters.active.length === 0) return;
                const nearest = Physics.getNearest(Player.entity.x, Player.entity.y, Monsters.active, 500);
                if (nearest) Projectiles.applyLightningStrike(nearest);
            }
        },
        
        poisonNova: {
            id: 'poisonNova',
            name: 'Poison Nova',
            description: 'Poison all enemies in a large area for 8 seconds',
            icon: '☠️',
            cooldown: 22000,
            onUse() {
                if (!Player.entity) return;
                let count = 0;
                for (let monster of Monsters.active) {
                    if (Physics.distance(Player.entity, monster) < 250) {
                        monster.poisoned = true;
                        monster.poisonDmg = 8;
                        monster.poisonEnd = Date.now() + 8000;
                        count++;
                    }
                }
                Effects.add({ type: 'explosion', x: Player.entity.x, y: Player.entity.y, radius: 250, color: '#0F0', duration: 500 });
                Messages.show(`Poison Nova! ${count} enemies poisoned!`);
            }
        },
        
        frostWave: {
            id: 'frostWave',
            name: 'Frost Wave',
            description: 'Freeze all enemies for 3 seconds',
            icon: '❄️',
            cooldown: 28000,
            onUse() {
                if (!Player.entity) return;
                let count = 0;
                for (let monster of Monsters.active) {
                    if (Physics.distance(Player.entity, monster) < 200) {
                        monster.frozen = true;
                        monster.frozenUntil = Date.now() + 3000;
                        monster.speed = 0;
                        count++;
                    }
                }
                Effects.add({ type: 'shockwave', x: Player.entity.x, y: Player.entity.y, radius: 200, color: '#88CCFF', duration: 500 });
                Messages.show(`Frost Wave! ${count} enemies frozen!`);
            }
        }
    },
    
    init() {
        this.owned = [];
        this.cooldowns = {};
    },
    
    reset() {
        this.owned = [];
        this.cooldowns = {};
    },
    
    addAbility(abilityId) {
        if (this.owned.find(a => a.id === abilityId)) return;
        const def = this.definitions[abilityId];
        if (!def) return;
        this.owned.push({ id: abilityId, ...def });
        this.cooldowns[abilityId] = 0;
        Messages.show(`New Ability: ${def.name}!`, 3000);
        HUD.updateAbilities();
    },
    
    useAbility(index) {
        if (index < 0 || index >= this.owned.length) return;
        const ability = this.owned[index];
        const currentTime = Date.now();
        
        if (currentTime - (this.cooldowns[ability.id] || 0) < ability.cooldown) {
            const remaining = Math.ceil((ability.cooldown - (currentTime - this.cooldowns[ability.id])) / 1000);
            Messages.show(`${ability.name} ready in ${remaining}s`);
            return;
        }
        
        this.cooldowns[ability.id] = currentTime;
        ability.onUse();
        HUD.updateAbilities();
    },
    
    getCooldownPercent(abilityId) {
        const currentTime = Date.now();
        const ability = this.owned.find(a => a.id === abilityId);
        if (!ability) return 100;
        const elapsed = currentTime - (this.cooldowns[abilityId] || 0);
        return Math.min(100, (elapsed / ability.cooldown) * 100);
    },
    
    checkBossReward(waveNum) {
        for (let [id, def] of Object.entries(this.definitions)) {
            if (def.bossWave === waveNum && def.guaranteed) {
                this.addAbility(id);
            }
        }
    },
    
    checkRandomAbility() {
        // 1% chance for random ability after each wave
        if (Math.random() > 0.01) return;
        
        const pool = Object.entries(this.definitions)
            .filter(([id, def]) => !def.guaranteed && !this.owned.find(a => a.id === id))
            .map(([id]) => id);
        
        if (pool.length > 0) {
            const randomId = pool[Math.floor(Math.random() * pool.length)];
            this.addAbility(randomId);
        }
    }
};
