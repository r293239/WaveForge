// ============================================
// WAVEFORGE - Monster System
// ============================================

const Monsters = {
    active: [],
    spawnIndicators: [],
    spawnClusters: [],
    clusterSpawnTimer: 0,
    currentClusterIndex: 0,
    monstersPerCluster: 3,
    clusterSpawnDelay: 500,
    totalSpawned: 0,
    totalToSpawn: 0,
    
    init() { 
        this.active = []; 
        this.spawnIndicators = []; 
        this.spawnClusters = [];
        this.clusterSpawnTimer = 0;
        this.currentClusterIndex = 0;
        this.totalSpawned = 0;
        this.totalToSpawn = 0;
    },
    
    reset() { 
        this.active = []; 
        this.spawnIndicators = []; 
        this.spawnClusters = [];
        this.clusterSpawnTimer = 0;
        this.currentClusterIndex = 0;
        this.totalSpawned = 0;
        this.totalToSpawn = 0;
    },
    
    getAttackRange(typeKey, radius) {
        switch (typeKey) {
            case 'NORMAL': return radius + 15;
            case 'FAST': return radius + 10;
            case 'TANK': return radius + 20;
            case 'EXPLOSIVE': return radius + 18;
            case 'GUNNER': return radius + 12;
            case 'SPLITTER': return radius + 25;
            case 'DASHER': return radius + 8;
            case 'VAMPIRE': return radius + 20;
            case 'BOSS': return radius + 35;
            default: return radius + 15;
        }
    },
    
    create(typeKey, isBoss = false, spawnX = null, spawnY = null) {
        const type = MONSTER_TYPES[typeKey];
        if (!type) return null;
        const waveConfig = Waves.getWaveConfig(Game.wave);
        let health, damage;
        if (isBoss) {
            health = waveConfig.bossHealth || (waveConfig.monsterHealth * type.healthMultiplier);
            damage = waveConfig.monsterDamage * type.damageMultiplier;
        } else {
            health = Math.floor(waveConfig.monsterHealth * type.healthMultiplier * Game.difficultyMultipliers.monsterHealth);
            damage = Math.floor(waveConfig.monsterDamage * type.damageMultiplier * (Game.difficultyMultipliers.monsterDamage || 1));
        }
        let x, y;
        if (spawnX !== null && spawnY !== null) { x = spawnX; y = spawnY; }
        else { const pos = Arena.getRandomSpawnPosition(); x = pos.x; y = pos.y; }
        const radius = (isBoss ? 45 : (15 + Math.random() * 10)) * type.sizeMultiplier;
        const monster = {
            x, y, radius, hitboxRadius: radius * CONFIG.HITBOX.MONSTER,
            health, maxHealth: health, damage,
            speed: (isBoss ? 0.7 : (1 + Game.wave * 0.05)) * type.speed,
            originalSpeed: (isBoss ? 0.7 : (1 + Game.wave * 0.05)) * type.speed,
            color: type.color, type: typeKey, monsterType: type,
            lastAttack: 0, attackCooldown: type.attackCooldown || CONFIG.MONSTER_ATTACK_COOLDOWN,
            isBoss: isBoss || false, isMinion: type.isMinion || false,
            isSplitter: type.isSplitter || false, isDasher: type.isDasher || false,
            isVampire: type.isVampire || false, isGunner: typeKey === 'GUNNER',
            lifeSteal: type.lifeSteal || 0, splitCount: type.splitCount || 0,
            splitHealthPercent: type.splitHealthPercent || 0.5,
            dashSpeed: type.dashSpeed || 1.5, dashCooldown: type.dashCooldown || 3000,
            lastDash: 0, isDashing: false, dashTarget: null,
            explosive: type.explosive || false, explosionRadius: type.explosionRadius || 100,
            explosionDamage: type.explosionDamage || 3.0,
            attackRange: this.getAttackRange(typeKey, radius),
            attackAnimation: null, attackAnimStart: 0, attackAnimDuration: 400,
            slowed: false, slowUntil: 0, frozen: false, frozenUntil: 0,
            stunned: false, stunnedUntil: 0, poisoned: false, poisonDmg: 0, poisonEnd: 0,
            bleeding: false, bleedDmg: 0, bleedEnd: 0,
            lastPoisonTick: 0, lastBleedTick: 0, lastFireTick: 0,
            targetX: x, targetY: y, flockId: null, role: null,
            spawnClusterId: null,
            hasExploded: false,
            _dead: false
        };
        Effects.spawnEffect(x, y, type.color);
        this.active.push(monster);
        return monster;
    },
    
    generateSpawnClusters(waveConfig, isBossWave) {
        this.spawnClusters = [];
        this.currentClusterIndex = 0;
        this.totalSpawned = 0;
        
        const countMultiplier = Game.difficultyMultipliers.monsterCountMultiplier || 1;
        const totalMonsters = Math.max(1, Math.floor(waveConfig.monsters * countMultiplier));
        this.totalToSpawn = totalMonsters;
        
        const monsterTypes = isBossWave ? Waves.getNonBossTypesForWave(Game.wave) : Waves.getMonsterTypesForWave(Game.wave);
        
        const numClusters = Math.min(5, Math.max(2, Math.floor(totalMonsters / this.monstersPerCluster)));
        const monstersPerCluster = Math.ceil(totalMonsters / numClusters);
        
        const clusterPositions = [];
        for (let i = 0; i < numClusters; i++) {
            let pos;
            if (Math.random() < 0.4) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 200;
                pos = {
                    x: CONFIG.CANVAS_WIDTH + Math.cos(angle) * distance,
                    y: CONFIG.CANVAS_HEIGHT + Math.sin(angle) * distance
                };
            } else {
                pos = Arena.getRandomSpawnPosition();
            }
            pos.x = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH * 2 - 50, pos.x));
            pos.y = Math.max(50, Math.min(CONFIG.CANVAS_HEIGHT * 2 - 50, pos.y));
            clusterPositions.push(pos);
        }
        
        let monsterIndex = 0;
        for (let i = 0; i < numClusters; i++) {
            const cluster = {
                position: clusterPositions[i],
                monsters: [],
                spawnDelay: i * this.clusterSpawnDelay + Math.random() * 500,
                spawned: false,
                spawnStartTime: 0
            };
            const count = i === numClusters - 1 ? 
                totalMonsters - monsterIndex : 
                Math.min(monstersPerCluster, totalMonsters - monsterIndex);
            for (let j = 0; j < count && monsterIndex < totalMonsters; j++) {
                const typeKey = monsterTypes[monsterIndex % monsterTypes.length];
                cluster.monsters.push(typeKey);
                monsterIndex++;
            }
            this.spawnClusters.push(cluster);
        }
    },
    
    spawnWave(waveConfig, isBossWave) {
        this.generateSpawnClusters(waveConfig, isBossWave);
        this.clusterSpawnTimer = Date.now();
        this.currentClusterIndex = 0;
        this.spawnNextCluster();
    },
    
    spawnNextCluster() {
        if (this.currentClusterIndex >= this.spawnClusters.length) {
            return;
        }
        const cluster = this.spawnClusters[this.currentClusterIndex];
        const spawnX = cluster.position.x;
        const spawnY = cluster.position.y;
        Game.pendingSpawns += cluster.monsters.length;
        const indicator = { 
            x: spawnX, 
            y: spawnY, 
            timer: 800, 
            startTime: Date.now(), 
            isBoss: false,
            clusterIndex: this.currentClusterIndex
        };
        this.spawnIndicators.push(indicator);
        setTimeout(() => {
            if (Game.state !== GAME_STATE.WAVE) return;
            const idx = this.spawnIndicators.indexOf(indicator);
            if (idx > -1) this.spawnIndicators.splice(idx, 1);
            const spawnRadius = 40 + Math.random() * 30;
            for (let i = 0; i < cluster.monsters.length; i++) {
                const typeKey = cluster.monsters[i];
                setTimeout(() => {
                    if (Game.state !== GAME_STATE.WAVE) return;
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * spawnRadius;
                    const x = spawnX + Math.cos(angle) * distance;
                    const y = spawnY + Math.sin(angle) * distance;
                    this.create(typeKey, false, x, y);
                    this.totalSpawned++;
                    Game.pendingSpawns--;
                    document.getElementById('monsterCount').textContent = `Monsters: ${Monsters.active.length + Game.pendingSpawns}`;
                }, i * 100);
            }
        }, 800);
        this.currentClusterIndex++;
        setTimeout(() => {
            this.spawnNextCluster();
        }, this.clusterSpawnDelay);
    },
    
    spawnBoss() {
        const bossX = CONFIG.CANVAS_WIDTH, bossY = CONFIG.CANVAS_HEIGHT;
        Game.pendingSpawns++;
        const indicator = { x: bossX, y: bossY, timer: 2000, startTime: Date.now(), isBoss: true };
        this.spawnIndicators.push(indicator);
        setTimeout(() => {
            if (Game.state !== GAME_STATE.WAVE) { Game.pendingSpawns--; return; }
            const idx = this.spawnIndicators.indexOf(indicator);
            if (idx > -1) this.spawnIndicators.splice(idx, 1);
            const boss = this.create('BOSS', true, bossX, bossY);
            if (boss) { boss.lifeSteal = 0.1; Boss.setupBoss(boss, Game.wave); }
            Game.pendingSpawns--;
            document.getElementById('monsterCount').textContent = `Monsters: ${Monsters.active.length + Game.pendingSpawns}`;
        }, 2000);
    },
    
    remove(monster, index) {
        if (index === undefined) index = this.active.indexOf(monster);
        if (index > -1) this.active.splice(index, 1);
    },
    
    handleDeath(monster, index) {
        if (monster._dead) return;
        monster._dead = true;
        let goldDrop = 0;
        if (monster.monsterType && monster.monsterType.goldDrop) {
            goldDrop = Math.floor((Math.random() * (monster.monsterType.goldDrop.max - monster.monsterType.goldDrop.min + 1) + monster.monsterType.goldDrop.min) * (1 + Player.goldMultiplier) * Game.difficultyMultipliers.goldGain);
        } else {
            goldDrop = Math.floor((5 + Math.random() * 10) * (1 + Player.goldMultiplier) * Game.difficultyMultipliers.goldGain);
        }
        Player.addGold(goldDrop);
        Game.addKill();
        Effects.deathEffect(monster.x, monster.y);
        Player.weapons.forEach(weapon => { if (weapon.isThrowable) { const returned = weapon.returnKnives?.(monster) || 0; if (returned > 0) Effects.healthPopup(monster.x, monster.y, returned); } });
        
        // === FIX: Explosive monsters explode on death ===
        if (monster.explosive && !monster.hasExploded) {
            monster.hasExploded = true;
            this.explode(monster);
        }
        
        if (Player.explosiveKills && !monster.isBoss) {
            Effects.explosion(monster.x, monster.y, 80, '#FF6600');
            for (let i = this.active.length - 1; i >= 0; i--) {
                if (i === index) continue;
                const other = this.active[i];
                if (other._dead) continue;
                if (Physics.distance(monster, other) < 80 + other.radius) { 
                    other.health -= 50; 
                    Effects.damageIndicator(other.x, other.y, 50, false); 
                    if (other.health <= 0) this.handleDeath(other, i); 
                }
            }
        }
        
        if (monster.isSplitter) this.split(monster);
        MonsterBrain.onMonsterDeath(monster);
        this.remove(monster, index);
        document.getElementById('monsterCount').textContent = `Monsters: ${this.active.length + Game.pendingSpawns}`;
    },
    
    explode(monster) {
        // Prevent double explosion
        if (monster.hasExploded) return;
        monster.hasExploded = true;
        
        const radius = monster.explosionRadius;
        const damage = monster.damage * (monster.explosionDamage || 2);
        
        // === FIX: Show explosion effect ===
        Effects.explosion(monster.x, monster.y, radius, '#FF4500');
        
        const targets = [...this.active];
        for (let i = targets.length - 1; i >= 0; i--) {
            const other = targets[i];
            if (other === monster) continue;
            if (other._dead) continue;
            if (Physics.distance(monster, other) < radius + other.radius) { 
                other.health -= damage; 
                Effects.damageIndicator(other.x, other.y, damage, false); 
                if (other.health <= 0) {
                    const idx = this.active.indexOf(other);
                    if (idx > -1) this.active.splice(idx, 1);
                    this.handleDeath(other, -1);
                }
            }
        }
        
        if (Player.entity && Physics.distance(monster, Player.entity) < radius + Player.entity.radius) {
            Player.takeDamage(damage, monster);
        }
    },
    
    split(monster) {
        const count = monster.splitCount || 2;
        const health = Math.floor(monster.maxHealth * (monster.splitHealthPercent || 0.5));
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2, dist = 30;
            const child = this.create(monster.type, false, monster.x + Math.cos(angle) * dist, monster.y + Math.sin(angle) * dist);
            if (child) { 
                child.health = health; 
                child.maxHealth = health; 
                child.radius = monster.radius * 0.7; 
                child.hitboxRadius = child.radius * CONFIG.HITBOX.MONSTER; 
                child.isSplitter = false; 
                child.color = '#aaffaa'; 
                child.originalSpeed = monster.originalSpeed * 1.2; 
                child.speed = child.originalSpeed; 
                child.explosive = false;
            }
        }
        Effects.explosion(monster.x, monster.y, 50, '#0F0');
    },
    
    checkWallAttack(monster, currentTime) {
        if (currentTime - monster.lastAttack < monster.attackCooldown) return false;
        for (let wall of Arena.walls) {
            if (wall.destroyed) continue;
            const halfW = wall.width / 2;
            const halfH = wall.height / 2;
            const distX = Math.abs(monster.x - wall.x);
            const distY = Math.abs(monster.y - wall.y);
            if (distX < halfW + monster.attackRange && distY < halfH + monster.attackRange) {
                wall.health -= monster.damage * 0.5;
                Effects.damageIndicator(wall.x, wall.y, Math.floor(monster.damage * 0.5), false);
                if (wall.health <= 0) {
                    wall.destroyed = true;
                    Physics.unregister(wall);
                    Effects.explosion(wall.x, wall.y, 40, '#888');
                }
                monster.lastAttack = currentTime;
                return true;
            }
        }
        return false;
    },
    
    update(currentTime) {
        for (let i = this.spawnIndicators.length - 1; i >= 0; i--) { 
            if (currentTime - this.spawnIndicators[i].startTime > this.spawnIndicators[i].timer) 
                this.spawnIndicators.splice(i, 1); 
        }
        for (let monster of this.active) { 
            if (monster.isDasher) this.updateDasher(monster, currentTime); 
        }
        for (let i = this.active.length - 1; i >= 0; i--) {
            const monster = this.active[i];
            if (monster.slowed && monster.slowUntil < currentTime) { monster.slowed = false; monster.speed = monster.originalSpeed; }
            if (monster.frozen && monster.frozenUntil < currentTime) { monster.frozen = false; monster.speed = monster.originalSpeed; }
            if (monster.stunned && monster.stunnedUntil < currentTime) { monster.stunned = false; monster.speed = monster.originalSpeed; }
            if (monster.stunned || monster.frozen) continue;
            if (monster.isDasher && monster.isDashing) continue;
            const moveDir = MonsterBrain.getMovement(monster);
            if (moveDir.x !== 0 || moveDir.y !== 0) { monster.x += moveDir.x * monster.speed; monster.y += moveDir.y * monster.speed; }
            Physics.clampToArena(monster);
            if (monster.isGunner && currentTime - monster.lastAttack >= monster.attackCooldown) { Projectiles.shootGunner(monster); monster.lastAttack = currentTime; }
            if (monster.isBoss && currentTime - monster.lastAttack >= monster.attackCooldown) { Boss.shootProjectiles(monster); monster.lastAttack = currentTime; }
            if (!this.checkWallAttack(monster, currentTime)) {
                this.checkMeleeAttack(monster, currentTime);
            }
        }
    },
    
    updateDasher(dasher, currentTime) {
        if (dasher.isDashing) {
            const dx = dasher.dashTarget.x - dasher.x, dy = dasher.dashTarget.y - dasher.y, dist = Math.hypot(dx, dy);
            if (dist < 5) { dasher.isDashing = false; dasher.speed = dasher.originalSpeed; }
            else { dasher.x += (dx / dist) * dasher.dashSpeed; dasher.y += (dy / dist) * dasher.dashSpeed; }
        } else if (currentTime - dasher.lastDash >= dasher.dashCooldown && Player.entity && Physics.distance(dasher, Player.entity) < 300) {
            dasher.isDashing = true; dasher.dashTarget = { x: Player.entity.x, y: Player.entity.y }; dasher.lastDash = currentTime;
            Effects.shockwave(dasher.x, dasher.y, 30, '#0FF');
        }
    },
    
    checkMeleeAttack(monster, currentTime) {
        if (currentTime - monster.lastAttack < monster.attackCooldown) return;
        for (let tower of Towers.healingTowers.active) { const dist = Physics.distance(monster, tower); if (dist < monster.attackRange + tower.radius) { this.performMeleeAttack(monster, tower, currentTime); return; } }
        for (let turret of Towers.turrets.active) { const dist = Physics.distance(monster, turret); if (dist < monster.attackRange + turret.radius) { this.performMeleeAttack(monster, turret, currentTime); return; } }
        if (Player.entity) { const dist = Physics.distance(monster, Player.entity); if (dist < monster.attackRange + Player.entity.radius) this.performMeleeAttack(monster, Player.entity, currentTime); }
    },
    
    performMeleeAttack(monster, target, currentTime) {
        monster.lastAttack = currentTime;
        monster.attackAnimation = { startTime: currentTime, duration: monster.attackAnimDuration, targetX: target.x, targetY: target.y, damageApplied: false };
    },
    
    updateStatusEffects(currentTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const monster = this.active[i];
            if (monster.poisoned) {
                if (currentTime >= monster.poisonEnd) { monster.poisoned = false; }
                else if (!monster.lastPoisonTick || currentTime - monster.lastPoisonTick >= 1000) { monster.health -= monster.poisonDmg; Effects.damageIndicator(monster.x, monster.y, monster.poisonDmg, false); monster.lastPoisonTick = currentTime; if (monster.health <= 0) { this.handleDeath(monster, i); continue; } }
            }
            if (monster.bleeding) {
                if (currentTime >= monster.bleedEnd) { monster.bleeding = false; }
                else if (!monster.lastBleedTick || currentTime - monster.lastBleedTick >= 1000) { monster.health -= monster.bleedDmg; Effects.damageIndicator(monster.x, monster.y, monster.bleedDmg, false); monster.lastBleedTick = currentTime; if (monster.health <= 0) this.handleDeath(monster, i); }
            }
        }
    },
    
    drawAttackAnimation(monster, progress, alpha) {
        const ctx = Game.ctx;
        const angle = monster.attackAnimation ? Math.atan2(monster.attackAnimation.targetY - monster.y, monster.attackAnimation.targetX - monster.x) : 0;
        ctx.save(); ctx.rotate(angle);
        switch (monster.type) {
            case 'NORMAL': this.drawNormalAttack(ctx, monster, progress, alpha); break;
            case 'FAST': this.drawFastAttack(ctx, monster, progress, alpha); break;
            case 'TANK': this.drawTankAttack(ctx, monster, progress, alpha); break;
            case 'EXPLOSIVE': this.drawExplosiveAttack(ctx, monster, progress, alpha); break;
            case 'GUNNER': this.drawGunnerMelee(ctx, monster, progress, alpha); break;
            case 'SPLITTER': this.drawSplitterAttack(ctx, monster, progress, alpha); break;
            case 'DASHER': this.drawDasherAttack(ctx, monster, progress, alpha); break;
            case 'VAMPIRE': this.drawVampireAttack(ctx, monster, progress, alpha); break;
            default: this.drawNormalAttack(ctx, monster, progress, alpha);
        }
        ctx.restore();
        if (progress > 0.3 && progress < 0.5 && monster.attackAnimation && !monster.attackAnimation.damageApplied) {
            monster.attackAnimation.damageApplied = true;
            let hitTower = false;
            for (let tower of Towers.healingTowers.active) { const dist = Math.hypot(tower.x - monster.x, tower.y - monster.y); if (dist < monster.attackRange + tower.radius + 10) { tower.health -= monster.damage; Effects.damageIndicator(tower.x, tower.y, monster.damage, false); if (tower.health <= 0) { const idx = Towers.healingTowers.active.indexOf(tower); if (idx > -1) Towers.healingTowers.active.splice(idx, 1); } hitTower = true; break; } }
            if (!hitTower) {
                for (let turret of Towers.turrets.active) { const dist = Math.hypot(turret.x - monster.x, turret.y - monster.y); if (dist < monster.attackRange + turret.radius + 10) { turret.health -= monster.damage; Effects.damageIndicator(turret.x, turret.y, monster.damage, false); if (turret.health <= 0) { const idx = Towers.turrets.active.indexOf(turret); if (idx > -1) Towers.turrets.active.splice(idx, 1); } hitTower = true; break; } }
            }
            if (!hitTower && Player.entity) { const dist = Math.hypot(Player.entity.x - monster.x, Player.entity.y - monster.y); if (dist < monster.attackRange + Player.entity.radius + 10) { let dmg = monster.damage; if (monster.isVampire && monster.lifeSteal > 0) { const heal = Math.floor(dmg * monster.lifeSteal); monster.health = Math.min(monster.maxHealth, monster.health + heal); } Player.takeDamage(dmg, monster); } }
        }
    },
    
    drawNormalAttack(ctx, monster, progress, alpha) {
        const biteProgress = Math.sin(progress * Math.PI), jawOpen = biteProgress * 12, dist = monster.attackRange * progress;
        ctx.fillStyle = `rgba(255,107,107,${alpha})`;
        ctx.beginPath(); ctx.moveTo(monster.radius, -jawOpen); ctx.lineTo(monster.radius + dist, -5 - jawOpen); ctx.lineTo(monster.radius + dist, 0); ctx.lineTo(monster.radius, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(monster.radius, jawOpen); ctx.lineTo(monster.radius + dist, 5 + jawOpen); ctx.lineTo(monster.radius + dist, 0); ctx.lineTo(monster.radius, 0); ctx.fill();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 3; i++) { const toothX = monster.radius + dist * (0.3 + i * 0.25); ctx.beginPath(); ctx.moveTo(toothX, -jawOpen); ctx.lineTo(toothX + 2, -8 - jawOpen); ctx.lineTo(toothX + 4, -jawOpen); ctx.fill(); ctx.beginPath(); ctx.moveTo(toothX, jawOpen); ctx.lineTo(toothX + 2, 8 + jawOpen); ctx.lineTo(toothX + 4, jawOpen); ctx.fill(); }
    },
    
    drawFastAttack(ctx, monster, progress, alpha) {
        for (let i = 0; i < 3; i++) {
            const slashProgress = (progress * 3 - i) % 1; if (slashProgress < 0 || slashProgress > 1) continue;
            const dist = monster.attackRange * slashProgress;
            ctx.strokeStyle = `rgba(78,205,196,${alpha * (1 - slashProgress)})`; ctx.lineWidth = 2;
            ctx.beginPath(); const offsetY = (i - 1) * 8; ctx.moveTo(monster.radius, offsetY); ctx.lineTo(monster.radius + dist, offsetY - 5); ctx.lineTo(monster.radius + dist + 5, offsetY); ctx.stroke();
        }
    },
    
    drawTankAttack(ctx, monster, progress, alpha) {
        if (progress < 0.3) { const liftY = -20 * (progress / 0.3); ctx.fillStyle = `rgba(255,165,0,${alpha})`; ctx.fillRect(monster.radius, liftY - 10, 25, 20); }
        else { const slamProgress = (progress - 0.3) / 0.7; const shakeAmount = (1 - slamProgress) * 15; ctx.fillStyle = `rgba(255,165,0,${alpha})`; ctx.fillRect(monster.radius, -shakeAmount, 30, 15 + shakeAmount); const waveRadius = slamProgress * 40; ctx.strokeStyle = `rgba(255,140,0,${alpha * (1 - slamProgress)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(monster.radius + 30, 0, waveRadius, -0.5, 0.5); ctx.stroke(); }
    },
    
    drawExplosiveAttack(ctx, monster, progress, alpha) {
        const glowRadius = monster.attackRange * progress * (1 + Math.sin(progress * Math.PI * 3) * 0.3);
        const gradient = ctx.createRadialGradient(monster.radius, 0, 0, monster.radius, 0, glowRadius);
        gradient.addColorStop(0, `rgba(255,0,0,${alpha * 0.8})`); gradient.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.4})`); gradient.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(monster.radius, 0, glowRadius, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + progress * Math.PI; const d = glowRadius * (0.5 + Math.random() * 0.5); ctx.fillStyle = `rgba(255,200,0,${alpha})`; ctx.beginPath(); ctx.arc(monster.radius + Math.cos(a) * d, Math.sin(a) * d, 2, 0, Math.PI * 2); ctx.fill(); }
    },
    
    drawGunnerMelee(ctx, monster, progress, alpha) {
        const dist = monster.attackRange * progress;
        ctx.strokeStyle = `rgba(255,105,180,${alpha})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(monster.radius, 0); ctx.lineTo(monster.radius + dist, -Math.sin(progress * Math.PI) * 10); ctx.stroke();
        ctx.fillStyle = `rgba(255,105,180,${alpha})`; ctx.fillRect(monster.radius + dist - 5, -Math.sin(progress * Math.PI) * 10 - 8, 15, 16);
    },
    
    drawSplitterAttack(ctx, monster, progress, alpha) {
        const dist = monster.attackRange * progress;
        ctx.strokeStyle = `rgba(0,255,0,${alpha})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(monster.radius, 0);
        for (let i = 0; i <= 10; i++) { const t = i / 10; ctx.lineTo(monster.radius + dist * t, Math.sin(t * Math.PI * 3 + Math.sin(progress * Math.PI * 2) * 5) * 8); }
        ctx.stroke();
        const tipX = monster.radius + dist, tipY = Math.sin(Math.PI * 3 + Math.sin(progress * Math.PI * 2) * 5) * 8;
        ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + 8, tipY - 6); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + 8, tipY + 6); ctx.stroke();
    },
    
    drawDasherAttack(ctx, monster, progress, alpha) {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const d = monster.attackRange * progress * (0.5 + i * 0.1); ctx.strokeStyle = `rgba(0,255,255,${alpha * (1 - progress)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(monster.radius + Math.cos(a - 0.2) * 10, Math.sin(a - 0.2) * 10); ctx.lineTo(monster.radius + Math.cos(a) * (10 + d), Math.sin(a) * (10 + d)); ctx.stroke(); }
    },
    
    drawVampireAttack(ctx, monster, progress, alpha) {
        for (let i = 0; i < 3; i++) { const cp = (progress * 3 - i) % 1; if (cp < 0 || cp > 1) continue; const d = monster.attackRange * cp, yOff = (i - 1) * 6; ctx.strokeStyle = `rgba(139,0,139,${alpha * 0.5})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(monster.radius, yOff); ctx.lineTo(monster.radius + d * 0.7, yOff); ctx.stroke(); ctx.strokeStyle = `rgba(255,0,0,${alpha * (1 - cp)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(monster.radius + d * 0.7, yOff); ctx.lineTo(monster.radius + d, yOff - 3); ctx.moveTo(monster.radius + d * 0.7, yOff); ctx.lineTo(monster.radius + d, yOff + 3); ctx.stroke(); }
    },
    
    draw() {
        const ctx = Game.ctx, currentTime = Date.now();
        for (let monster of this.active) {
            ctx.save(); ctx.translate(monster.x, monster.y);
            ctx.fillStyle = monster.color; ctx.shadowColor = monster.color; ctx.shadowBlur = monster.isBoss ? 20 : 10;
            ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.fill();
            if (monster.stunned && monster.stunnedUntil > currentTime) { ctx.fillStyle = 'rgba(255,255,0,0.3)'; ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.fill(); }
            if (monster.frozen && monster.frozenUntil > currentTime) { ctx.fillStyle = 'rgba(0,255,255,0.3)'; ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.fill(); }
            if (monster.isDasher && monster.isDashing) { ctx.strokeStyle = '#0FF'; ctx.lineWidth = 3; ctx.shadowColor = '#0FF'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(0, 0, monster.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
            if (monster.isVampire) { ctx.strokeStyle = '#F00'; ctx.lineWidth = 2; ctx.shadowColor = '#F00'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, monster.radius + 3, 0, Math.PI * 2); ctx.stroke(); }
            if (monster.poisoned) { ctx.strokeStyle = '#0F0'; ctx.lineWidth = 2; ctx.shadowColor = '#0F0'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, monster.radius + 4, 0, Math.PI * 2); ctx.stroke(); }
            if (monster.bleeding) { ctx.strokeStyle = '#F00'; ctx.lineWidth = 2; ctx.shadowColor = '#F00'; ctx.shadowBlur = 8; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.arc(0, 0, monster.radius + 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
            ctx.shadowBlur = 0; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, monster.radius, 0, Math.PI * 2); ctx.stroke();
            if (monster.monsterType && monster.monsterType.icon) { ctx.fillStyle = 'white'; ctx.font = `${monster.radius}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(monster.monsterType.icon, 0, 0); }
            const angleToPlayer = Player.entity ? Math.atan2(Player.entity.y - monster.y, Player.entity.x - monster.x) : 0;
            const eyeRadius = monster.radius * 0.2;
            ctx.fillStyle = '#FFF'; ctx.shadowBlur = 5;
            ctx.beginPath(); ctx.arc(Math.cos(angleToPlayer - 0.3) * monster.radius * 0.6, Math.sin(angleToPlayer - 0.3) * monster.radius * 0.6, eyeRadius, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(Math.cos(angleToPlayer + 0.3) * monster.radius * 0.6, Math.sin(angleToPlayer + 0.3) * monster.radius * 0.6, eyeRadius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(Math.cos(angleToPlayer) * monster.radius * 0.7, Math.sin(angleToPlayer) * monster.radius * 0.7, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill();
            const hpPercent = Math.max(0, Math.min(1, monster.health / monster.maxHealth)), barWidth = monster.radius * 2, barX = -monster.radius, barY = -monster.radius - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX, barY, barWidth, 4);
            if (hpPercent > 0) { ctx.fillStyle = hpPercent > 0.5 ? '#0F0' : (hpPercent > 0.2 ? '#FF0' : '#F00'); ctx.fillRect(barX, barY, barWidth * hpPercent, 4); }
            if (monster.attackAnimation) {
                const animProgress = (currentTime - monster.attackAnimation.startTime) / monster.attackAnimation.duration;
                if (animProgress > 1) { monster.attackAnimation = null; }
                else { this.drawAttackAnimation(monster, animProgress, 1 - animProgress * 0.5); }
            }
            ctx.restore();
        }
    },
    
    drawIndicators() {
        const ctx = Game.ctx, currentTime = Date.now();
        for (let indicator of this.spawnIndicators) {
            const elapsed = currentTime - indicator.startTime; 
            if (elapsed > indicator.timer) continue;
            const pulseScale = 1 + Math.sin(elapsed / indicator.timer * Math.PI * 4) * 0.2, 
                alpha = 1 - (elapsed / indicator.timer) * 0.5;
            ctx.save(); 
            ctx.translate(indicator.x, indicator.y);
            const numRings = 2 + Math.floor(elapsed / 200) % 2;
            for (let i = 0; i < numRings; i++) {
                const ringAlpha = alpha * (1 - i * 0.3);
                const ringRadius = 25 * pulseScale + i * 12;
                ctx.strokeStyle = `rgba(255, ${100 + i * 50}, 0, ${ringAlpha})`;
                ctx.lineWidth = 3 - i * 0.5;
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 10 * ringAlpha;
                ctx.beginPath(); 
                ctx.arc(0, 0, ringRadius, 0, Math.PI * 2); 
                ctx.stroke();
            }
            ctx.strokeStyle = `rgba(255,200,0,${alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            const crossSize = 10 + elapsed / 100 * 2;
            ctx.beginPath();
            ctx.moveTo(-crossSize, -crossSize);
            ctx.lineTo(crossSize, crossSize);
            ctx.moveTo(crossSize, -crossSize);
            ctx.lineTo(-crossSize, crossSize);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,200,0,${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + elapsed / 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
};
