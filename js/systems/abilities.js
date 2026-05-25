// ============================================
// WAVEFORGE - Abilities System
// ============================================

const Abilities = {
    owned: [],
    cooldowns: {},
    
    definitions: {
        dash: {
            id: 'dash', name: 'Shadow Dash', description: 'Dash through enemies', icon: '💨',
            cooldown: 8000, bossWave: 30, guaranteed: true,
            onUse() {
                if (!Player.entity) return;
                const angle = Player.facingAngle;
                const dashDist = 200;
                const damage = 50;
                Player.isDashing = true;
                Player.dashProgress = 0;
                Player.dashDamage = damage;
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
                        if (Physics.distance(Player.entity, monster) < Player.entity.radius + monster.radius + 20) {
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
                setTimeout(() => { Monsters.active.forEach(m => m._dashHit = false); }, 500);
            }
        },
        asteroid: {
            id: 'asteroid', name: 'Meteor Strike', description: 'Call down a meteor', icon: '☄️',
            cooldown: 12000, bossWave: 20, guaranteed: true,
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
        instantReload: {
            id: 'instantReload', name: 'Quick Load', description: 'Instantly reload all weapons', icon: '⚡',
            cooldown: 15000,
            onUse() {
                Player.weapons.forEach(w => {
                    if (w.usesAmmo) { w.currentAmmo = w.magazineSize; w.isReloading = false; }
                });
                Messages.show('All weapons reloaded!');
            }
        },
        overcharge: {
            id: 'overcharge', name: 'Overcharge', description: 'Random weapon +1 tier for 20s', icon: '⬆️',
            cooldown: 20000,
            onUse() {
                const weapon = Player.weapons[Math.floor(Math.random() * Player.weapons.length)];
                if (!weapon) return;
                const oldTier = weapon.tier;
                weapon.tier = Math.min(6, weapon.tier + 1);
                weapon.applyTierBonuses();
                Messages.show(`${weapon.name} overcharged!`);
                setTimeout(() => {
                    weapon.tier = oldTier;
                    weapon.applyTierBonuses();
                }, 20000);
            }
        },
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline Rush', description: '+50% attack speed for 10s', icon: '💉',
            cooldown: 25000,
            onUse() {
                Player.attackSpeedMultiplier += 0.5;
                Messages.show('Adrenaline Rush!');
                setTimeout(() => { Player.attackSpeedMultiplier -= 0.5; }, 10000);
            }
        },
        fortify: {
            id: 'fortify', name: 'Fortify', description: 'Invulnerable for 5s', icon: '🛡️',
            cooldown: 30000,
            onUse() {
                Player.invulnerable = true;
                Messages.show('Fortified!');
                setTimeout(() => { Player.invulnerable = false; }, 5000);
            }
        },
        chainLightning: {
            id: 'chainLightning', name: 'Chain Lightning', description: 'Chain lightning on nearest enemy', icon: '⚡',
            cooldown: 10000,
            onUse() {
                if (!Player.entity || Monsters.active.length === 0) return;
                const nearest = Physics.getNearest(Player.entity.x, Player.entity.y, Monsters.active, 500);
                if (nearest) Projectiles.applyLightningStrike(nearest);
            }
        }
    },
    
    init() { this.owned = []; this.cooldowns = {}; },
    reset() { this.owned = []; this.cooldowns = {}; },
    
    addAbility(abilityId) {
        if (this.owned.find(a => a.id === abilityId)) return;
        const def = this.definitions[abilityId];
        if (!def) return;
        this.owned.push({ id: abilityId, ...def });
        this.cooldowns[abilityId] = 0;
        Messages.show(`New Ability: ${def.name}!`, 3000);
    },
    
    useAbility(index) {
        if (index < 0 || index >= this.owned.length) return;
        const ability = this.owned[index];
        const currentTime = Date.now();
        if (currentTime - (this.cooldowns[ability.id] || 0) < ability.cooldown) {
            Messages.show(`${ability.name} on cooldown`);
            return;
        }
        this.cooldowns[ability.id] = currentTime;
        ability.onUse();
    },
    
    getCooldownPercent(abilityId) {
        const currentTime = Date.now();
        const ability = this.owned.find(a => a.id === abilityId);
        if (!ability) return 100;
        return Math.min(100, ((currentTime - (this.cooldowns[abilityId] || 0)) / ability.cooldown) * 100);
    },
    
    checkBossReward(waveNum) {
        for (let [id, def] of Object.entries(this.definitions)) {
            if (def.bossWave === waveNum && def.guaranteed) this.addAbility(id);
        }
    },
    
    checkRandomAbility() {
        if (Math.random() > 0.01) return;
        const pool = Object.entries(this.definitions)
            .filter(([id, def]) => !def.guaranteed && !this.owned.find(a => a.id === id))
            .map(([id]) => id);
        if (pool.length > 0) this.addAbility(pool[Math.floor(Math.random() * pool.length)]);
    }
};
