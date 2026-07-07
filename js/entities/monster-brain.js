// ============================================
// WAVEFORGE - Monster Brain (AI System)
// ============================================

const MonsterBrain = {
    // Flocking groups
    flocks: new Map(),
    
    // Role assignments
    roles: {
        CHASER: 'chaser',       // Direct pursuit
        FLANKER: 'flanker',     // Tries to circle around
        BLOCKER: 'blocker',     // Blocks escape routes
        SUPPORT: 'support'      // Stays back, buffs others
    },
    
    init() {
        this.flocks.clear();
    },
    
    reset() {
        this.flocks.clear();
    },
    
    // Assign monsters to flocks based on type and proximity
    formFlocks() {
        this.flocks.clear();
        const unassigned = [...Monsters.active];
        
        for (let monster of unassigned) {
            if (monster.flockId) continue;
            
            // Create new flock
            const flockId = `flock_${Date.now()}_${Math.random()}`;
            const flock = {
                id: flockId,
                members: [monster],
                leader: monster,
                center: { x: monster.x, y: monster.y },
                targetX: Player.entity ? Player.entity.x : monster.x,
                targetY: Player.entity ? Player.entity.y : monster.y,
                formation: 'loose'
            };
            
            monster.flockId = flockId;
            monster.role = this.roles.CHASER;
            
            // Find nearby same-type monsters to join
            for (let other of unassigned) {
                if (other === monster || other.flockId) continue;
                if (other.type === monster.type || 
                    (monster.isBoss && other.isMinion)) {
                    const dist = Physics.distance(monster, other);
                    if (dist < 200) {
                        flock.members.push(other);
                        other.flockId = flockId;
                        other.role = this.assignRole(flock);
                    }
                }
            }
            
            this.flocks.set(flockId, flock);
            this.updateFlockCenter(flock);
            this.assignRoles(flock);
        }
    },
    
    // Assign a role to a new flock member
    assignRole(flock) {
        const counts = {};
        for (let m of flock.members) {
            counts[m.role] = (counts[m.role] || 0) + 1;
        }
        
        // Balance roles
        if ((counts[this.roles.CHASER] || 0) <= (counts[this.roles.FLANKER] || 0)) {
            return this.roles.CHASER;
        } else if ((counts[this.roles.FLANKER] || 0) <= 2 && flock.members.length > 3) {
            return this.roles.FLANKER;
        } else if ((counts[this.roles.BLOCKER] || 0) === 0 && flock.members.length > 4) {
            return this.roles.BLOCKER;
        }
        return this.roles.CHASER;
    },
    
    // Assign roles to all flock members
    assignRoles(flock) {
        const size = flock.members.length;
        
        if (size <= 2) {
            // Small group: all chasers
            for (let m of flock.members) m.role = this.roles.CHASER;
        } else if (size <= 5) {
            // Medium group: mostly chasers, 1-2 flankers
            for (let i = 0; i < flock.members.length; i++) {
                flock.members[i].role = i < 2 ? this.roles.FLANKER : this.roles.CHASER;
            }
        } else {
            // Large group: mixed roles
            const roles = [
                this.roles.CHASER, this.roles.CHASER, this.roles.CHASER,
                this.roles.FLANKER, this.roles.FLANKER,
                this.roles.BLOCKER, this.roles.SUPPORT
            ];
            for (let i = 0; i < flock.members.length; i++) {
                flock.members[i].role = roles[i % roles.length];
            }
        }
    },
    
    // Update flock center position
    updateFlockCenter(flock) {
        let cx = 0, cy = 0;
        for (let m of flock.members) {
            cx += m.x;
            cy += m.y;
        }
        flock.center.x = cx / flock.members.length;
        flock.center.y = cy / flock.members.length;
    },
    
    // Get movement direction for a monster (with wall avoidance)
    getMovement(monster) {
        if (!Player.entity) return { x: 0, y: 0 };
        
        // Dashers have their own movement
        if (monster.isDasher && monster.isDashing) return { x: 0, y: 0 };
        
        const player = Player.entity;
        const flock = monster.flockId ? this.flocks.get(monster.flockId) : null;
        
        let moveX = 0, moveY = 0;
        
        // Calculate base movement direction based on role
        switch (monster.role) {
            case this.roles.CHASER:
                moveX = player.x - monster.x;
                moveY = player.y - monster.y;
                break;
                
            case this.roles.FLANKER:
                // Circle around the player
                const flankAngle = Math.atan2(player.y - monster.y, player.x - monster.x) + Math.PI / 3;
                const flankDist = 150;
                const flankTargetX = player.x + Math.cos(flankAngle) * flankDist;
                const flankTargetY = player.y + Math.sin(flankAngle) * flankDist;
                moveX = flankTargetX - monster.x;
                moveY = flankTargetY - monster.y;
                break;
                
            case this.roles.BLOCKER:
                // Get between player and escape routes (arena center)
                const centerX = CONFIG.CANVAS_WIDTH / 2;
                const centerY = CONFIG.CANVAS_HEIGHT / 2;
                const blockAngle = Math.atan2(centerY - player.y, centerX - player.x);
                const blockDist = 120;
                const blockTargetX = player.x + Math.cos(blockAngle) * blockDist;
                const blockTargetY = player.y + Math.sin(blockAngle) * blockDist;
                moveX = blockTargetX - monster.x;
                moveY = blockTargetY - monster.y;
                break;
                
            case this.roles.SUPPORT:
                // Stay behind the flock, approach slowly
                if (flock) {
                    const supportAngle = Math.atan2(player.y - flock.center.y, player.x - flock.center.x) + Math.PI;
                    const supportDist = 100;
                    const supportTargetX = flock.center.x + Math.cos(supportAngle) * supportDist;
                    const supportTargetY = flock.center.y + Math.sin(supportAngle) * supportDist;
                    moveX = supportTargetX - monster.x;
                    moveY = supportTargetY - monster.y;
                } else {
                    moveX = player.x - monster.x;
                    moveY = player.y - monster.y;
                }
                break;
                
            default:
                moveX = player.x - monster.x;
                moveY = player.y - monster.y;
        }
        
        // Add slight randomness
        moveX += (Math.random() - 0.5) * 20;
        moveY += (Math.random() - 0.5) * 20;
        
        // Flocking behavior: stay near flock
        if (flock && flock.members.length > 1) {
            const separationForce = this.getSeparationForce(monster, flock);
            const cohesionForce = this.getCohesionForce(monster, flock);
            
            moveX += separationForce.x * 0.5 + cohesionForce.x * 0.3;
            moveY += separationForce.y * 0.5 + cohesionForce.y * 0.3;
        }
        
        // Normalize
        const dist = Math.hypot(moveX, moveY);
        if (dist > 0) {
            moveX /= dist;
            moveY /= dist;
        }
        
        // === WALL AVOIDANCE ===
        // Check if moving straight would hit a wall
        const testDist = 20; // Look ahead 20 pixels
        const testX = monster.x + moveX * testDist;
        const testY = monster.y + moveY * testDist;
        
        let blocked = false;
        for (let wall of Arena.walls) {
            if (wall.destroyed) continue;
            const halfW = wall.width / 2;
            const halfH = wall.height / 2;
            if (testX >= wall.x - halfW && testX <= wall.x + halfW &&
                testY >= wall.y - halfH && testY <= wall.y + halfH) {
                blocked = true;
                break;
            }
        }
        
        if (blocked) {
            // Try to go around - check 4 directions
            const alternatives = [
                {x: 1, y: 0},   // right
                {x: -1, y: 0},  // left
                {x: 0, y: 1},   // down
                {x: 0, y: -1}   // up
            ];
            
            let found = false;
            for (let alt of alternatives) {
                const altX = monster.x + alt.x * testDist;
                const altY = monster.y + alt.y * testDist;
                let altBlocked = false;
                for (let w of Arena.walls) {
                    if (w.destroyed) continue;
                    const hW = w.width / 2;
                    const hH = w.height / 2;
                    if (altX >= w.x - hW && altX <= w.x + hW &&
                        altY >= w.y - hH && altY <= w.y + hH) {
                        altBlocked = true;
                        break;
                    }
                }
                if (!altBlocked) {
                    moveX = alt.x;
                    moveY = alt.y;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // If all directions are blocked, give up and stand still
                moveX = 0;
                moveY = 0;
            }
        }
        
        // Avoid arena edges
        const bounds = Arena.getBounds();
        const edgeMargin = 40;
        if (monster.x < bounds.minX + edgeMargin) moveX += 0.5;
        if (monster.x > bounds.maxX - edgeMargin) moveX -= 0.5;
        if (monster.y < bounds.minY + edgeMargin) moveY += 0.5;
        if (monster.y > bounds.maxY - edgeMargin) moveY -= 0.5;
        
        // Re-normalize after adjustments
        const finalDist = Math.hypot(moveX, moveY);
        if (finalDist > 0) {
            moveX /= finalDist;
            moveY /= finalDist;
        }
        
        return { x: moveX, y: moveY };
    },
    
    // Separation force - don't get too close to flock mates
    getSeparationForce(monster, flock) {
        let sx = 0, sy = 0;
        const separationRadius = 40;
        
        for (let other of flock.members) {
            if (other === monster) continue;
            const dx = monster.x - other.x;
            const dy = monster.y - other.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < separationRadius && dist > 0) {
                const force = (separationRadius - dist) / separationRadius;
                sx += (dx / dist) * force;
                sy += (dy / dist) * force;
            }
        }
        
        return { x: sx, y: sy };
    },
    
    // Cohesion force - move toward flock center
    getCohesionForce(monster, flock) {
        const dx = flock.center.x - monster.x;
        const dy = flock.center.y - monster.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 80 && dist > 0) {
            return { x: dx / dist, y: dy / dist };
        }
        return { x: 0, y: 0 };
    },
    
    // Called when a monster dies
    onMonsterDeath(monster) {
        if (monster.flockId) {
            const flock = this.flocks.get(monster.flockId);
            if (flock) {
                const idx = flock.members.indexOf(monster);
                if (idx > -1) {
                    flock.members.splice(idx, 1);
                }
                
                // Remove empty flocks
                if (flock.members.length === 0) {
                    this.flocks.delete(monster.flockId);
                } else if (monster === flock.leader) {
                    // Assign new leader
                    flock.leader = flock.members[0];
                }
            }
        }
    },
    
    // Main update - run periodically
    update(currentTime) {
        // Reform flocks every 3 seconds
        if (!this._lastFlockUpdate || currentTime - this._lastFlockUpdate > 3000) {
            this.formFlocks();
            this._lastFlockUpdate = currentTime;
        }
        
        // Update flock centers
        for (let [id, flock] of this.flocks) {
            this.updateFlockCenter(flock);
        }
    }
};
