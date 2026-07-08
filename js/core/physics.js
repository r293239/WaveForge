// ============================================
// WAVEFORGE - Physics & Collision System
// ============================================

const Physics = {
    solidEntities: [],
    
    init() {
        this.solidEntities = [];
    },
    
    register(entity) {
        if (!entity.hitboxRadius) {
            entity.hitboxRadius = entity.radius * CONFIG.HITBOX.PLAYER;
        }
        this.solidEntities.push(entity);
    },
    
    unregister(entity) {
        const idx = this.solidEntities.indexOf(entity);
        if (idx > -1) this.solidEntities.splice(idx, 1);
    },
    
    clear() {
        this.solidEntities = [];
    },
    
    circlesOverlap(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        return dist < (a.hitboxRadius + b.hitboxRadius + CONFIG.HITBOX.MIN_SEPARATION);
    },
    
    pointInCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        return Math.hypot(dx, dy) < circle.hitboxRadius;
    },
    
    distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    },
    
    angleBetween(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x);
    },
    
    separate(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.hitboxRadius + b.hitboxRadius + CONFIG.HITBOX.MIN_SEPARATION;
        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
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
    
    isInsideWall(entity) {
        for (let wall of Arena.walls) {
            if (wall.destroyed) continue;
            const halfW = wall.width / 2;
            const halfH = wall.height / 2;
            if (entity.x >= wall.x - halfW && entity.x <= wall.x + halfW &&
                entity.y >= wall.y - halfH && entity.y <= wall.y + halfH) {
                return wall;
            }
        }
        return null;
    },
    
    resolveWallCollision(entity) {
        for (let wall of Arena.walls) {
            if (wall.destroyed) continue;
            const halfW = wall.width / 2 + (entity.hitboxRadius || entity.radius || 0);
            const halfH = wall.height / 2 + (entity.hitboxRadius || entity.radius || 0);
            const dx = entity.x - wall.x;
            const dy = entity.y - wall.y;
            const overlapX = halfW - Math.abs(dx);
            const overlapY = halfH - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
                if (overlapX < overlapY) {
                    entity.x += Math.sign(dx) * overlapX;
                } else {
                    entity.y += Math.sign(dy) * overlapY;
                }
                return wall;
            }
        }
        return null;
    },
    
    resolveMonsterCollisions() {
        const monsters = Monsters.active;
        for (let i = 0; i < monsters.length; i++) {
            this.resolveWallCollision(monsters[i]);
            for (let j = i + 1; j < monsters.length; j++) {
                this.separate(monsters[i], monsters[j]);
            }
        }
    },
    
    resolvePlayerMonsterCollisions() {
        const player = Player.entity;
        if (!player) return;
        this.resolveWallCollision(player);
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
                this.resolveWallCollision(player);
            }
        }
    },
    
    clampToArena(entity) {
        const bounds = Arena.getBounds();
        entity.x = Math.max(bounds.minX + entity.hitboxRadius, 
                   Math.min(bounds.maxX - entity.hitboxRadius, entity.x));
        entity.y = Math.max(bounds.minY + entity.hitboxRadius, 
                   Math.min(bounds.maxY - entity.hitboxRadius, entity.y));
        this.resolveWallCollision(entity);
    },
    
    hasLineOfSight(x1, y1, x2, y2, ignoreEntity = null) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 10);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = x1 + dx * t;
            const py = y1 + dy * t;
            for (let wall of Arena.walls) {
                if (wall.destroyed) continue;
                const halfW = wall.width / 2;
                const halfH = wall.height / 2;
                if (px >= wall.x - halfW && px <= wall.x + halfW &&
                    py >= wall.y - halfH && py <= wall.y + halfH) {
                    return false;
                }
            }
            for (let entity of this.solidEntities) {
                if (entity === ignoreEntity) continue;
                if (entity.isStatic && this.pointInCircle(px, py, entity)) {
                    return false;
                }
            }
        }
        return true;
    },
    
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
