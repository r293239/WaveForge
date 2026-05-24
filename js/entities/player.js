// ============================================
// WAVEFORGE - Player Entity
// ============================================

const Player = {
    entity: null,
    weapons: [],
    projectiles: [],
    meleeAttacks: [],
    consumables: [],
    
    // Stats
    health: 20,
    maxHealth: 20,
    damageMultiplier: 1.0,
    speed: 3,
    baseSpeed: 3,
    speedMultiplier: 1.0,
    lifeSteal: 0,
    criticalChance: 0,
    goldMultiplier: 0,
    healthRegen: 0,
    healthRegenPercent: 0,
    damageReduction: 0,
    dodgeChance: 0,
    thornsDamage: 0,
    attackSpeedMultiplier: 1,
    reloadSpeedMultiplier: 1.0,
    firstHitReduction: false,
    firstHitActive: false,
    guardianAngel: false,
    guardianAngelUsed: false,
    bloodContract: false,
    bloodContractStacks: 0,
    bloodContractInterval: null,
    berserkerRing: false,
    inSlowField: false,
    slowFieldTicks: 0,
    lastSlowFieldTick: 0,
    lastRegen: 0,
    facingAngle: 0,
    lastFacingAngle: 0,
    
    // Upgrades
    knockback: false,
    explosiveKills: false,
    goldMagnet: false,
    
    // Weapon control
    manualWeaponIndex: -1,
    manualFire: false,
    
    // Input
    keys: { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false },
    joystickActive: false,
    joystickX: 0,
    joystickY: 0,
    mouseX: 400,
    mouseY: 300,
    
    init() {
        this.reset();
        this.setupInput();
    },
    
    reset() {
        this.entity = {
            x: CONFIG.CANVAS_WIDTH / 2,
            y: CONFIG.CANVAS_HEIGHT / 2,
            radius: CONFIG.PLAYER_START.radius,
            hitboxRadius: CONFIG.PLAYER_START.radius * CONFIG.HITBOX.PLAYER,
            color: '#ff6b6b',
            isPlayer: true
        };
        
        this.weapons = [];
        this.projectiles = [];
        this.meleeAttacks = [];
        this.consumables = [];
        
        this.health = CONFIG.PLAYER_START.health;
        this.maxHealth = CONFIG.PLAYER_START.maxHealth;
        this.damageMultiplier = 1.0;
        this.speed = CONFIG.PLAYER_START.speed;
        this.baseSpeed = CONFIG.PLAYER_START.speed;
        this.speedMultiplier = 1.0;
        this.lifeSteal = 0;
        this.criticalChance = 0;
        this.goldMultiplier = 0;
        this.healthRegen = 0;
        this.healthRegenPercent = 0;
        this.damageReduction = 0;
        this.dodgeChance = 0;
        this.thornsDamage = 0;
        this.attackSpeedMultiplier = 1;
        this.reloadSpeedMultiplier = 1.0;
        this.firstHitReduction = false;
        this.firstHitActive = false;
        this.guardianAngel = false;
        this.guardianAngelUsed = false;
        this.bloodContract = false;
        this.bloodContractStacks = 0;
        this.berserkerRing = false;
        this.inSlowField = false;
        this.slowFieldTicks = 0;
        this.lastRegen = Date.now();
        this.facingAngle = 0;
        this.lastFacingAngle = 0;
        this.knockback = false;
        this.explosiveKills = false;
        this.goldMagnet = false;
        this.manualWeaponIndex = -1;
        this.manualFire = false;
        
        if (this.bloodContractInterval) {
            clearInterval(this.bloodContractInterval);
            this.bloodContractInterval = null;
        }
    },
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            switch (key) {
                case 'w': case 'arrowup': this.keys.w = true; this.keys.up = true; e.preventDefault(); break;
                case 's': case 'arrowdown': this.keys.s = true; this.keys.down = true; e.preventDefault(); break;
                case 'a': case 'arrowleft': this.keys.a = true; this.keys.left = true; e.preventDefault(); break;
                case 'd': case 'arrowright': this.keys.d = true; this.keys.right = true; e.preventDefault(); break;
            }
            
            // Weapon control - press 1-6 to select manual control
            if (key >= '1' && key <= '6') {
                const idx = parseInt(key) - 1;
                if (idx < this.weapons.length) {
                    this.manualWeaponIndex = (this.manualWeaponIndex === idx) ? -1 : idx;
                    Messages.show(this.manualWeaponIndex >= 0 ? 
                        `Manual: ${this.weapons[this.manualWeaponIndex].name} (F to fire, R to reload)` : 
                        'Auto-attack mode');
                } else {
                    Messages.show('No weapon in that slot!');
                }
            }
            
            // Manual fire
            if (key === 'f' && this.manualWeaponIndex >= 0) {
                this.manualFire = true;
            }
            
            // Manual reload
            if (key === 'r' && this.manualWeaponIndex >= 0) {
                const weapon = this.weapons[this.manualWeaponIndex];
                if (weapon && weapon.usesAmmo && !weapon.isReloading && !weapon.isThrowable) {
                    weapon.startReload();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            switch (key) {
                case 'w': case 'arrowup': this.keys.w = false; this.keys.up = false; break;
                case 's': case 'arrowdown': this.keys.s = false; this.keys.down = false; break;
                case 'a': case 'arrowleft': this.keys.a = false; this.keys.left = false; break;
                case 'd': case 'arrowright': this.keys.d = false; this.keys.right = false; break;
            }
        });
        
        // Mouse
        if (Game.canvas) {
            Game.canvas.addEventListener('mousemove', (e) => {
                const rect = Game.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            });
            
            Game.canvas.addEventListener('click', (e) => {
                if (this.manualWeaponIndex >= 0) {
                    this.manualFire = true;
                }
            });
        }
    },
    
    update(deltaTime) {
        if (!this.entity) return;
        
        // Calculate movement
        let moveX = 0, moveY = 0;
        if (this.keys.w || this.keys.up) moveY -= 1;
        if (this.keys.s || this.keys.down) moveY += 1;
        if (this.keys.a || this.keys.left) moveX -= 1;
        if (this.keys.d || this.keys.right) moveX += 1;
        
        if (this.joystickActive) {
            moveX += this.joystickX;
            moveY += this.joystickY;
        }
        
        // Normalize and apply speed
        if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY);
            moveX = (moveX / length) * this.speed;
            moveY = (moveY / length) * this.speed;
            
            this.entity.x += moveX;
            this.entity.y += moveY;
            this.lastFacingAngle = Math.atan2(moveY, moveX);
        }
        
        // Clamp to arena
        Physics.clampToArena(this.entity);
        
        // Update facing angle (toward mouse or movement direction)
        if (this.lastFacingAngle !== undefined && (moveX !== 0 || moveY !== 0)) {
            this.facingAngle = this.lastFacingAngle;
        } else {
            this.facingAngle = Math.atan2(this.mouseY - this.entity.y, this.mouseX - this.entity.x);
        }
        
        // Gold magnet - auto collect nearby gold (placeholder for future)
        if (this.goldMagnet) {
            // Would auto-collect gold pickups in range
        }
        
        // Health regeneration
        const currentTime = Date.now();
        if ((this.healthRegen > 0 || this.healthRegenPercent > 0) && 
            currentTime - this.lastRegen >= 1000 && 
            this.health < this.maxHealth) {
            let regenAmount = this.healthRegen;
            if (this.healthRegenPercent > 0) {
                regenAmount += Math.floor(this.maxHealth * this.healthRegenPercent);
            }
            this.heal(Math.max(1, regenAmount));
            this.lastRegen = currentTime;
        }
        
        // Manual weapon fire
        if (this.manualFire && this.manualWeaponIndex >= 0 && this.manualWeaponIndex < this.weapons.length) {
            this.manualFire = false;
            const weapon = this.weapons[this.manualWeaponIndex];
            if (weapon && weapon.canAttack(currentTime)) {
                // Find target in mouse direction
                const targetAngle = Math.atan2(this.mouseY - this.entity.y, this.mouseX - this.entity.x);
                const targetX = this.entity.x + Math.cos(targetAngle) * weapon.range;
                const targetY = this.entity.y + Math.sin(targetAngle) * weapon.range;
                
                const attackResult = weapon.attack(this.entity.x, this.entity.y, targetX, targetY);
                
                if (attackResult) {
                    if (Array.isArray(attackResult)) {
                        for (let proj of attackResult) {
                            proj.weaponRef = weapon;
                            Projectiles.active.push(proj);
                        }
                    } else if (attackResult.type === 'ranged') {
                        attackResult.weaponRef = weapon;
                        Projectiles.active.push(attackResult);
                    } else if (attackResult.type === 'melee') {
                        attackResult.attackedMonsters = new Set();
                        attackResult.weaponRef = weapon;
                        this.meleeAttacks.push(attackResult);
                    }
                }
            }
        }
    },
    
    takeDamage(amount, source = null) {
        // Dodge chance
        if (Math.random() < this.dodgeChance) {
            Messages.show('DODGE!');
            return false;
        }
        
        // First hit reduction
        if (this.firstHitActive) {
            amount *= 0.5;
            this.firstHitActive = false;
            Messages.show('Runic Plate absorbed 50% damage!');
        }
        
        // Damage reduction
        if (this.damageReduction > 0) {
            amount *= (1 - this.damageReduction);
        }
        
        this.health -= amount;
        
        // Thorns damage
        if (this.thornsDamage > 0 && source && source.health !== undefined) {
            const thornsDmg = Math.floor(amount * this.thornsDamage);
            if (thornsDmg > 0) {
                source.health -= thornsDmg;
                Effects.damageIndicator(source.x, source.y, thornsDmg, false);
                if (source.health <= 0 && Monsters.active.includes(source)) {
                    const idx = Monsters.active.indexOf(source);
                    if (idx > -1) Monsters.handleDeath(source, idx);
                }
            }
        }
        
        Effects.damageIndicator(this.entity.x, this.entity.y, Math.floor(amount), false);
        
        // Check death
        if (this.health <= 0) {
            if (this.guardianAngel && !this.guardianAngelUsed) {
                this.guardianAngelUsed = true;
                this.health = Math.max(1, Math.floor(this.maxHealth * 0.5));
                Messages.show('GUARDIAN ANGEL SAVED YOU! 50% health restored.');
                Effects.guardianAngel(this.entity.x, this.entity.y);
                HUD.updateStats();
                return false;
            }
            Game.gameOver();
            return true;
        }
        
        // Berserker ring
        if (this.berserkerRing) {
            const hpPercent = this.health / this.maxHealth;
            this.damageMultiplier = 1.0 + (1 - hpPercent) * 0.5;
        }
        
        HUD.updateStats();
        return false;
    },
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        Effects.healthPopup(this.entity.x, this.entity.y, amount);
        HUD.updateStats();
    },
    
    addGold(amount) {
        Game.gold += amount;
        Effects.goldPopup(this.entity.x, this.entity.y, amount);
        HUD.updateStats();
    },
    
    addWeapon(weaponData, tier = 1) {
        if (this.weapons.length >= CONFIG.MAX_WEAPON_SLOTS) {
            Messages.show('No empty weapon slots!');
            return false;
        }
        const weapon = WeaponBase.create(weaponData, tier);
        this.weapons.push(weapon);
        HUD.updateWeapons();
        return true;
    },
    
    removeWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return null;
        const weapon = this.weapons[index];
        this.weapons.splice(index, 1);
        if (this.manualWeaponIndex === index) {
            this.manualWeaponIndex = -1;
        } else if (this.manualWeaponIndex > index) {
            this.manualWeaponIndex--;
        }
        HUD.updateWeapons();
        return weapon;
    },
    
    getWeaponById(id) {
        return this.weapons.find(w => w.id === id);
    },
    
    useConsumable(index) {
        if (Game.state !== GAME_STATE.WAVE) {
            Messages.show('Can only use consumables during waves!');
            return;
        }
        
        const consumable = this.consumables[index];
        if (!consumable) return;
        
        switch (consumable.id) {
            case 'health_potion':
                this.heal(Math.floor(this.maxHealth * 0.25));
                Messages.show(`Used Health Potion!`);
                break;
            case 'ammo_pack':
                this.weapons.forEach(w => {
                    if (w.usesAmmo && !w.isThrowable) {
                        w.currentAmmo = w.magazineSize;
                        w.isReloading = false;
                    }
                });
                Messages.show('All weapons reloaded!');
                break;
            case 'rage_potion':
                this.damageMultiplier *= 1.5;
                Messages.show('RAGE! +50% damage for 10s');
                setTimeout(() => {
                    this.damageMultiplier /= 1.5;
                    Messages.show('Rage ended');
                }, 10000);
                break;
            case 'bomb':
                if (this.entity) {
                    Effects.explosion(this.entity.x, this.entity.y, 150, '#FF4500');
                    for (let i = Monsters.active.length - 1; i >= 0; i--) {
                        const monster = Monsters.active[i];
                        if (Physics.distance(this.entity, monster) < 150 + monster.radius) {
                            monster.health -= 100;
                            Effects.damageIndicator(monster.x, monster.y, 100, true);
                            if (monster.health <= 0) Monsters.handleDeath(monster, i);
                        }
                    }
                    Messages.show('Boom!');
                }
                break;
            case 'exp_scroll':
                const upgradable = this.weapons.filter(w => w.tier < 5);
                if (upgradable.length > 0) {
                    const weapon = upgradable[Math.floor(Math.random() * upgradable.length)];
                    const oldTier = weapon.tier;
                    weapon.tier++;
                    weapon.applyTierBonuses();
                    Messages.show(`${weapon.name} upgraded to Tier ${weapon.tier}!`);
                    HUD.updateWeapons();
                }
                break;
        }
        
        if (consumable.count > 1) {
            consumable.count--;
        } else {
            this.consumables.splice(index, 1);
        }
        
        HUD.updateConsumables();
    },
    
    draw() {
        const ctx = Game.ctx;
        if (!this.entity) return;
        
        ctx.save();
        ctx.translate(this.entity.x, this.entity.y);
        
        // Player body
        ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.entity.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.entity.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.entity.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eyes
        ctx.save();
        ctx.rotate(this.facingAngle);
        ctx.fillStyle = '#FFF';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFF';
        ctx.beginPath(); ctx.arc(8, -5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 5, 4, 0, Math.PI * 2); ctx.fill();
        
        // Pupils (look toward mouse)
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        const mouseAngle = Math.atan2(this.mouseY - this.entity.y, this.mouseX - this.entity.x) - this.facingAngle;
        const pupilOffsetX = Math.cos(mouseAngle) * 1.5;
        const pupilOffsetY = Math.sin(mouseAngle) * 1.5;
        ctx.beginPath(); ctx.arc(8 + pupilOffsetX, -5 + pupilOffsetY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8 + pupilOffsetX, 5 + pupilOffsetY, 2, 0, Math.PI * 2); ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, -1);
        ctx.lineTo(18, 0);
        ctx.moveTo(12, 1);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.restore();
        
        // Weapon indicator (points toward mouse)
        ctx.save();
        ctx.rotate(this.facingAngle);
        ctx.strokeStyle = '#fc0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fc0';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.entity.radius + 2, 0);
        ctx.lineTo(this.entity.radius + 15, 0);
        ctx.stroke();
        ctx.fillStyle = '#fc0';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.entity.radius + 18, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Status effect indicators
        if (this.firstHitReduction && this.firstHitActive) {
            ctx.strokeStyle = '#0FF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#0FF';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, this.entity.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.bloodContract) {
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#8B0000';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, this.entity.radius + 5 + Math.sin(Date.now() * 0.005) * 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#8B0000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.bloodContractStacks}`, 0, -this.entity.radius - 10);
        }
        
        if (this.inSlowField) {
            ctx.strokeStyle = '#6464ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#6464ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, this.entity.radius + 8 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            ctx.stroke();
            if (this.slowFieldTicks > 0) {
                ctx.fillStyle = 'rgba(255,100,100,0.9)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`-${this.slowFieldTicks} SPD`, 0, -this.entity.radius - 20);
            }
        }
        
        // Manual weapon indicator
        if (this.manualWeaponIndex >= 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('MANUAL', 0, this.entity.radius + 20);
        }
        
        ctx.restore();
    }
};
