// ============================================
// WAVEFORGE - Combat System
// ============================================

const Combat = {
    weaponTargets: new Map(),
    
    init() { this.weaponTargets.clear(); },
    
    updateWeapons(currentTime) {
        for (let weapon of Player.weapons) {
            if (!weapon.canAttack(currentTime)) continue;
            const target = this.findTarget(weapon);
            if (!target) continue;
            this.weaponTargets.set(weapon.id, target);
            let attackResults = [];
            
            // Handle special weapon attack patterns
            if (weapon.id === 'boomerang' && weapon.doubleThrow) {
                // Double boomerang: throw 2 boomerangs at slightly different angles
                const angle = Math.atan2(target.y - Player.entity.y, target.x - Player.entity.x);
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
                const secondAngle = angle + 0.3;
                const secondTarget = {
                    x: Player.entity.x + Math.cos(secondAngle) * weapon.range,
                    y: Player.entity.y + Math.sin(secondAngle) * weapon.range
                };
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, secondTarget.x, secondTarget.y));
            } else if (weapon.id === 'crossbow' && weapon.tripleShot) {
                // Triple shot: fire 3 bolts in a spread
                const angle = Math.atan2(target.y - Player.entity.y, target.x - Player.entity.x);
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = angle + i * 0.2;
                    const spreadTarget = {
                        x: Player.entity.x + Math.cos(spreadAngle) * weapon.range,
                        y: Player.entity.y + Math.sin(spreadAngle) * weapon.range
                    };
                    attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, spreadTarget.x, spreadTarget.y));
                }
            } else if (weapon.id === 'laser' && weapon.forkLaser) {
                // Fork laser: split into 2 after first hit (handled in projectile system)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
                const forkAngle = Math.atan2(target.y - Player.entity.y, target.x - Player.entity.x) + 0.4;
                const forkTarget = {
                    x: Player.entity.x + Math.cos(forkAngle) * weapon.range,
                    y: Player.entity.y + Math.sin(forkAngle) * weapon.range
                };
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, forkTarget.x, forkTarget.y));
            } else if (weapon.id === 'handgun' && weapon.doubleTap) {
                // Double Tap: fire 2 bullets per shot
                const angle = Math.atan2(target.y - Player.entity.y, target.x - Player.entity.x);
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
                // Second bullet with slight spread
                const secondAngle = angle + 0.05;
                const secondTarget = {
                    x: Player.entity.x + Math.cos(secondAngle) * weapon.range,
                    y: Player.entity.y + Math.sin(secondAngle) * weapon.range
                };
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, secondTarget.x, secondTarget.y));
            } else if (weapon.id === 'shotgun' && weapon.slugMode) {
                // Slug Rounds: single powerful slug
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else if (weapon.id === 'shotgun' && weapon.chokeMod) {
                // Choke Mod: reduced spread (handled in projectile creation)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else if (weapon.id === 'machinegun' && weapon.pierceCount > 1) {
                // Armor Piercing: pierce through enemies (handled in projectile system)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else if (weapon.id === 'throwing_knives' && weapon.bounceCount > 0) {
                // Ricochet Blades: bounce to extra target (handled in projectile system)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else if (weapon.id === 'sniper' && weapon.explosiveShot) {
                // Explosive Rounds: explode on impact (handled in projectile system)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else if (weapon.id === 'crossbow' && weapon.explosiveShot) {
                // Blasting Bolts: explode on impact (handled in projectile system)
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            } else {
                // Normal attack
                attackResults.push(weapon.attack(Player.entity.x, Player.entity.y, target.x, target.y));
            }
            
            // Process attack results
            for (let result of attackResults) {
                if (Array.isArray(result)) {
                    for (let proj of result) {
                        proj.weaponRef = weapon;
                        Projectiles.active.push(proj);
                    }
                } else if (result && result.type === 'ranged') {
                    result.weaponRef = weapon;
                    Projectiles.active.push(result);
                } else if (result && result.type === 'melee') {
                    result.attackedMonsters = new Set();
                    result.weaponRef = weapon;
                    Player.meleeAttacks.push(result);
                }
            }
        }
    },
    
    findTarget(weapon) {
        let bestTarget = null;
        let bestValue = Infinity;
        
        if (weapon.type === 'melee') {
            // Melee: closest enemy in range
            for (let monster of Monsters.active) {
                const dist = Physics.distance(Player.entity, monster);
                if (dist < weapon.range + monster.radius && dist < bestValue) {
                    bestValue = dist;
                    bestTarget = monster;
                }
            }
        } else if (weapon.sniper) {
            // Sniper: highest HP enemy in range
            let highestHp = -1;
            for (let monster of Monsters.active) {
                const dist = Physics.distance(Player.entity, monster);
                if (dist < weapon.range && monster.health > highestHp) {
                    highestHp = monster.health;
                    bestValue = dist;
                    bestTarget = monster;
                }
            }
        } else if (weapon.id === 'boomerang') {
            // Boomerang: farthest enemy in range (to maximize arc)
            let farthestDist = 0;
            for (let monster of Monsters.active) {
                const dist = Physics.distance(Player.entity, monster);
                if (dist < weapon.range && dist > farthestDist) {
                    farthestDist = dist;
                    bestTarget = monster;
                }
            }
        } else {
            // Ranged: closest enemy in range
            for (let monster of Monsters.active) {
                const dist = Physics.distance(Player.entity, monster);
                if (dist < weapon.range && dist < bestValue) {
                    bestValue = dist;
                    bestTarget = monster;
                }
            }
        }
        return bestTarget;
    },
    
    updateMeleeAttacks(currentTime) {
        for (let i = Player.meleeAttacks.length - 1; i >= 0; i--) {
            const attack = Player.meleeAttacks[i];
            if (currentTime - attack.startTime > attack.duration) {
                Player.meleeAttacks.splice(i, 1);
                continue;
            }
            for (let j = Monsters.active.length - 1; j >= 0; j--) {
                const monster = Monsters.active[j];
                const dist = Physics.distance(attack, monster);
                if (dist < attack.radius + monster.radius) {
                    if (!attack.attackedMonsters.has(monster)) {
                        attack.attackedMonsters.add(monster);
                        this.applyMeleeDamage(attack, monster, j);
                    }
                }
            }
        }
    },
    
    applyMeleeDamage(attack, monster, index) {
        let dmg = attack.damage * Player.damageMultiplier * Game.difficultyMultipliers.playerDamage;
        if (dmg > 0 && Math.random() < Player.criticalChance) {
            dmg *= 2;
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), true);
        } else if (dmg > 0) {
            Effects.damageIndicator(monster.x, monster.y, Math.floor(dmg), false);
        }
        monster.health -= dmg;
        
        // Lifesteal
        if (dmg > 0 && Player.lifeSteal > 0) {
            const rawHeal = dmg * Player.lifeSteal;
            Player.lifeStealRemainder += rawHeal;
            if (Player.lifeStealRemainder >= 1) {
                const healAmount = Math.floor(Player.lifeStealRemainder);
                Player.heal(healAmount);
                Player.lifeStealRemainder -= healAmount;
            }
        }
        
        // Knockback from attack (weak trident)
        if (attack.knockbackAmount) {
            const kbAngle = Math.atan2(monster.y - attack.x, monster.x - attack.y);
            monster.x += Math.cos(kbAngle) * attack.knockbackAmount;
            monster.y += Math.sin(kbAngle) * attack.knockbackAmount;
            Physics.clampToArena(monster);
        }
        
        // Weapon‑specific knockback
        if (attack.weaponId === 'axe') {
            const kbForce = 8;
            const kbAngle = Math.atan2(monster.y - attack.x, monster.x - attack.y);
            monster.x += Math.cos(kbAngle) * kbForce;
            monster.y += Math.sin(kbAngle) * kbForce;
            Physics.clampToArena(monster);
        }
        if (Player.knockback && attack.weaponId !== 'axe') {
            const kbForce = 6;
            const kbAngle = Math.atan2(monster.y - attack.x, monster.x - attack.y);
            monster.x += Math.cos(kbAngle) * kbForce;
            monster.y += Math.sin(kbAngle) * kbForce;
            Physics.clampToArena(monster);
        }
        
        // Apply weapon upgrade effects
        const weaponRef = attack.weaponRef;
        if (weaponRef) {
            // Poison (Toxic Edge)
            if (weaponRef.poisonDamage && !monster.poisoned) {
                monster.poisoned = true;
                monster.poisonDmg = weaponRef.poisonDamage;
                monster.poisonEnd = Date.now() + (weaponRef.poisonDuration || 3000);
                Messages.show(`Poisoned! ${weaponRef.poisonDamage} dmg/sec`, 1000);
            }
            
            // Bleed (Serrated Edge)
            if (weaponRef.bleedDamage && !monster.bleeding) {
                monster.bleeding = true;
                monster.bleedDmg = weaponRef.bleedDamage;
                monster.bleedEnd = Date.now() + (weaponRef.bleedDuration || 4000);
                Messages.show(`Bleeding! ${weaponRef.bleedDamage} dmg/sec`, 1000);
            }
            
            // Stun (Concussive Blow)
            if (weaponRef.stunDuration && !monster.stunned) {
                monster.stunned = true;
                monster.stunnedUntil = Date.now() + weaponRef.stunDuration;
                monster.speed = 0;
                Messages.show('Stunned!', 1000);
            }
            
            // Fire damage (Flaming Blade)
            if (weaponRef.fireDamage) {
                Effects.groundFire(monster.x, monster.y, 30, weaponRef.fireDamage, weaponRef.fireDuration || 2000);
                Messages.show('Burning!', 1000);
            }
        }
        
        // Bleed from attack (for weak trident)
        if (attack.bleedDamage && !monster.bleeding) {
            monster.bleeding = true;
            monster.bleedDmg = attack.bleedDamage;
            monster.bleedEnd = Date.now() + (attack.bleedDuration || 3000);
        }
        
        if (monster.health <= 0) {
            Monsters.handleDeath(monster, index);
        }
    },
    
    drawMeleeAttacks() {
        for (let attack of Player.meleeAttacks) {
            MeleeWeapons.drawAttack(attack);
        }
        Boss.drawAttacks();
    }
};
