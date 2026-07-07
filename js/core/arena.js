// ============================================
// WAVEFORGE - Arena System
// ============================================

const Arena = {
    // Shift values (set both to 0 to align with the CSS container border)
    shiftX: 0,
    shiftY: 0,

    // Arena boundaries (calculated in init)
    bounds: {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    },

    // Wall entities
    walls: [],

    // Decorative elements
    decorations: [],

    init() {
        this.walls = [];
        this.decorations = [];

        // Use the entire canvas area – no padding, no shift
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: CONFIG.CANVAS_WIDTH,
            maxY: CONFIG.CANVAS_HEIGHT
        };

        this.generateDecorations();
    },

    generateDecorations() {
        for (let i = 0; i < 8; i++) {
            this.decorations.push({
                x: Math.random() * (this.bounds.maxX - this.bounds.minX) + this.bounds.minX,
                y: Math.random() * (this.bounds.maxY - this.bounds.minY) + this.bounds.minY,
                radius: 5 + Math.random() * 15,
                alpha: 0.05 + Math.random() * 0.1
            });
        }
    },

    getBounds() {
        return { ...this.bounds };
    },

    setWalls(wallData) {
        this.clearWalls();
        for (let wall of wallData) {
            this.addWall(wall.x, wall.y, wall.width, wall.height, wall.color, wall.health);
        }
    },

    addWall(x, y, width, height, color = '#2a2a4a', health = 100) {
        const wall = {
            x, y, width, height,
            hitboxRadius: Math.max(width, height) / 2,
            isStatic: true,
            isWall: true,
            color: color,
            health: health,
            maxHealth: health,
            destroyed: false
        };
        this.walls.push(wall);
        Physics.register(wall);
        return wall;
    },

    clearWalls() {
        for (let wall of this.walls) {
            Physics.unregister(wall);
        }
        this.walls = [];
    },

    getRandomSpawnPosition(minDistFromCenter = 100, minDistFromPlayer = 150) {
        let x, y, valid = false;
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const player = Player.entity;

        for (let attempts = 0; attempts < 50; attempts++) {
            const side = Math.floor(Math.random() * 4);
            switch (side) {
                case 0: // Top
                    x = this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX);
                    y = this.bounds.minY;
                    break;
                case 1: // Right
                    x = this.bounds.maxX;
                    y = this.bounds.minY + Math.random() * (this.bounds.maxY - this.bounds.minY);
                    break;
                case 2: // Bottom
                    x = this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX);
                    y = this.bounds.maxY;
                    break;
                default: // Left
                    x = this.bounds.minX;
                    y = this.bounds.minY + Math.random() * (this.bounds.maxY - this.bounds.minY);
            }

            // Check if position is inside any wall
            let insideWall = false;
            for (let wall of this.walls) {
                if (wall.destroyed) continue;
                const halfW = wall.width / 2;
                const halfH = wall.height / 2;
                if (x >= wall.x - halfW && x <= wall.x + halfW &&
                    y >= wall.y - halfH && y <= wall.y + halfH) {
                    insideWall = true;
                    break;
                }
            }
            if (insideWall) continue;

            if (Math.hypot(x - centerX, y - centerY) >= minDistFromCenter) {
                if (!player || Math.hypot(x - player.x, y - player.y) >= minDistFromPlayer) {
                    valid = true;
                    break;
                }
            }
        }

        if (!valid) {
            x = this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX);
            y = this.bounds.minY;
        }

        return { x, y };
    },

    getRandomArenaPosition(margin = 50) {
        let x, y, valid = false;
        for (let attempts = 0; attempts < 50; attempts++) {
            x = this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2);
            y = this.bounds.minY + margin + Math.random() * (this.bounds.maxY - this.bounds.minY - margin * 2);

            // Check if position is inside any wall
            let insideWall = false;
            for (let wall of this.walls) {
                if (wall.destroyed) continue;
                const halfW = wall.width / 2;
                const halfH = wall.height / 2;
                if (x >= wall.x - halfW && x <= wall.x + halfW &&
                    y >= wall.y - halfH && y <= wall.y + halfH) {
                    insideWall = true;
                    break;
                }
            }
            if (!insideWall) {
                valid = true;
                break;
            }
        }

        if (!valid) {
            x = this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2);
            y = this.bounds.minY + margin + Math.random() * (this.bounds.maxY - this.bounds.minY - margin * 2);
        }

        return { x, y };
    },

    isInBounds(x, y, radius = 0) {
        return x - radius >= this.bounds.minX &&
               x + radius <= this.bounds.maxX &&
               y - radius >= this.bounds.minY &&
               y + radius <= this.bounds.maxY;
    },

    draw() {
        const ctx = Game.ctx;
        const b = this.bounds;

        // Draw arena boundary exactly at canvas edges
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
        ctx.lineWidth = CONFIG.ARENA.WALL_THICKNESS;
        ctx.strokeRect(
            b.minX - 1,   // tiny offset to align perfectly with the container's 3px border
            b.minY - 1,
            b.maxX - b.minX + 2,
            b.maxY - b.minY + 2
        );

        // Corner markers
        const cornerSize = 15;
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.lineWidth = 2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(b.minX, b.minY + cornerSize);
        ctx.lineTo(b.minX, b.minY);
        ctx.lineTo(b.minX + cornerSize, b.minY);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(b.maxX - cornerSize, b.minY);
        ctx.lineTo(b.maxX, b.minY);
        ctx.lineTo(b.maxX, b.minY + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(b.minX, b.maxY - cornerSize);
        ctx.lineTo(b.minX, b.maxY);
        ctx.lineTo(b.minX + cornerSize, b.maxY);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(b.maxX, b.maxY - cornerSize);
        ctx.lineTo(b.maxX, b.maxY);
        ctx.lineTo(b.maxX - cornerSize, b.maxY);
        ctx.stroke();

        // Decorations
        for (let deco of this.decorations) {
            ctx.fillStyle = `rgba(100, 100, 150, ${deco.alpha})`;
            ctx.beginPath();
            ctx.arc(deco.x, deco.y, deco.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Walls
        for (let wall of this.walls) {
            if (wall.destroyed) continue;
            
            // Wall shadow
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            
            // Wall body
            ctx.fillStyle = wall.color || 'rgba(60, 60, 120, 0.7)';
            ctx.fillRect(wall.x - wall.width/2, wall.y - wall.height/2, wall.width, wall.height);
            
            // Wall border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(150, 150, 200, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(wall.x - wall.width/2, wall.y - wall.height/2, wall.width, wall.height);
            
            // Health bar for walls
            if (wall.health !== undefined && wall.health < wall.maxHealth) {
                const hpPercent = wall.health / wall.maxHealth;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(wall.x - wall.width/2, wall.y - wall.height/2 - 8, wall.width, 4);
                ctx.fillStyle = hpPercent > 0.5 ? '#0F0' : (hpPercent > 0.2 ? '#FF0' : '#F00');
                ctx.fillRect(wall.x - wall.width/2, wall.y - wall.height/2 - 8, wall.width * hpPercent, 4);
            }
        }

        // Grid
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }
};
