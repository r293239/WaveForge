// ============================================
// WAVEFORGE - Physics & Collision System
// ============================================

const Physics = {
    // Store all solid entities for collision checking
    solidEntities: [],
    
    init() {
        this.solidEntities = [];
    },
    
    // Add entity to physics system
    register(entity) {
        if (!entity.hitboxRadius) {
            entity.hitboxRadius = entity.radius * CONFIG.HITBOX.PLAYER;
        }
        this.solidEntities.push(entity);
    },
    
    // Remove entity from physics system
    unregister(entity) {
        const idx = this.solidEntities.indexOf(entity);
        if (idx > -1) this.solidEntities.splice(idx, 1);
    },
    
    // Clear all registered entities
    clear() {
        this.solidEntities = [];
    },
    
    // Check if two circles overlap
    circlesOverlap(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        return dist < (a.hitboxRadius + b.hitboxRadius + CONFIG.HITBOX.MIN_SEPARATION);
    },
    
    // Check if a point is inside a circle
    pointInCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        return Math.hypot(dx, dy) < circle.hitboxRadius;
    },
    
    // Get distance between two entities
    distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    },
    
    // Get angle between two entities
    angleBetween(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x);
    },
    
    // Push two overlapping entities apart
    separate(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.hitboxRadius + b.hitboxRadius + CONFIG.HITBOX.MIN_SEPARATION;
        
        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Push each entity half the overlap distance
            const pushA = overlap * 0.5;
            const pushB = overlap * 0.5;
            
            if (!a.isStatic) {
                a.x += nx * pushA;
                a.y += ny * pushA;
            }
            if (!b.isStatic) {
                b.x -= nx * pushB;
                b.y -= ny * pushB;
            }
            
            return true;
        }
        return false;
    },
    
    // Resolve all collisions between monsters (prevent stacking)
    resolveMonsterCollisions() {
        const monsters = Monsters.active;
        for (let i = 0; i < monsters.length; i++) {
            for (let j = i + 1; j < monsters.length; j++) {
                this.separate(monsters[i], monsters[j]);
            }
        }
    },
    
    // Check player collision with monsters (player pushed back)
    resolvePlayerMonsterCollisions() {
        const player = Player.entity;
        if (!player) return;
        
        for (let monster of Monsters.active) {
            const dx = player.x - monster.x;
            const dy = player.y - monster.y;
            const dist = Math.hypot(dx, dy);
            const minDist = player.hitboxRadius + monster.hitboxRadius + CONFIG.HITBOX.MIN_SEPARATION;
            
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;
                player.x += nx * overlap;
                player.y += ny * overlap;
            }
        }
    },
    
    // Clamp entity within arena bounds
    clampToArena(entity) {
        const bounds = Arena.getBounds();
        entity.x = Math.max(bounds.minX + entity.hitboxRadius, 
                   Math.min(bounds.maxX - entity.hitboxRadius, entity.x));
        entity.y = Math.max(bounds.minY + entity.hitboxRadius, 
                   Math.min(bounds.maxY - entity.hitboxRadius, entity.y));
    },
    
    // Check line of sight between two points (for ranged attacks)
    hasLineOfSight(x1, y1, x2, y2, ignoreEntity = null) {
        // Simple implementation - check if any solid entity blocks the path
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 10);
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = x1 + dx * t;
            const py = y1 + dy * t;
            
            for (let entity of this.solidEntities) {
                if (entity === ignoreEntity) continue;
                if (entity.isStatic && this.pointInCircle(px, py, entity)) {
                    return false;
                }
            }
        }
        return true;
    },
    
    // Get nearest entity of a specific type
    getNearest(x, y, entities, maxRange = Infinity) {
        let nearest = null;
        let nearestDist = maxRange;
        
        for (let entity of entities) {
            const dist = Math.hypot(entity.x - x, entity.y - y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = entity;
            }
        }
        return nearest;
    },
    
    // Get all entities within range
    getInRange(x, y, entities, range) {
        const result = [];
        for (let entity of entities) {
            if (Math.hypot(entity.x - x, entity.y - y) <= range) {
                result.push(entity);
            }
        }
        return result;
    }
};
