// ============================================
// WAVEFORGE - Arena System
// ============================================

const Arena = {
    // How much to shift the arena left/up (pixels)
    shiftX: 38,   // 1 cm left (negative if you ever want right)
    shiftY: 38,   // 1 cm up

    // Arena boundaries (calculated in init)
    bounds: {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    },

    // Wall entities (for future obstacles)
    walls: [],

    // Decorative elements
    decorations: [],

    init() {
        this.walls = [];
        this.decorations = [];

        // Calculate actual paddings with shift, clamped to keep arena on canvas
        const padLeft   = Math.max(0, CONFIG.ARENA.BOUNDARY_PADDING - this.shiftX);
        const padTop    = Math.max(0, CONFIG.ARENA.BOUNDARY_PADDING - this.shiftY);
        const padRight  = Math.max(0, CONFIG.ARENA.BOUNDARY_PADDING + this.shiftX);
        const padBottom = Math.max(0, CONFIG.ARENA.BOUNDARY_PADDING + this.shiftY);

        this.bounds = {
            minX: padLeft,
            minY: padTop,
            maxX: CONFIG.CANVAS_WIDTH - padRight,
            maxY: CONFIG.CANVAS_HEIGHT - padBottom
        };

        this.generateDecorations();
    },

    // Generate random decorative elements
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

    // Get arena boundaries
    getBounds() {
        return { ...this.bounds };
    },

    // Get random spawn position outside a radius from center
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

    // Get random position inside arena (not too close to edges)
    getRandomArenaPosition(margin = 50) {
        return {
            x: this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2),
            y: this.bounds.minY + margin + Math.random() * (this.bounds.maxY - this.bounds.minY - margin * 2)
        };
    },

    // Check if position is within arena bounds
    isInBounds(x, y, radius = 0) {
        return x - radius >= this.bounds.minX &&
               x + radius <= this.bounds.maxX &&
               y - radius >= this.bounds.minY &&
               y + radius <= this.bounds.maxY;
    },

    // Add a wall/obstacle (for future use)
    addWall(x, y, width, height) {
        const wall = {
            x, y, width, height,
            hitboxRadius: Math.max(width, height) / 2,
            isStatic: true,
            isWall: true
        };
        this.walls.push(wall);
        Physics.register(wall);
        return wall;
    },

    // Remove all walls
    clearWalls() {
        for (let wall of this.walls) {
            Physics.unregister(wall);
        }
        this.walls = [];
    },

    // Draw arena
    draw() {
        const ctx = Game.ctx;

        // Use the actual (shifted) bounds
        const b = this.bounds;

        // Draw arena boundary
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
        ctx.lineWidth = CONFIG.ARENA.WALL_THICKNESS;
        ctx.strokeRect(
            b.minX - 5,
            b.minY - 5,
            b.maxX - b.minX + 10,
            b.maxY - b.minY + 10
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

        // Decorative elements (unchanged, but they were placed within bounds anyway)
        for (let deco of this.decorations) {
            ctx.fillStyle = `rgba(100, 100, 150, ${deco.alpha})`;
            ctx.beginPath();
            ctx.arc(deco.x, deco.y, deco.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Walls (unchanged)
        for (let wall of this.walls) {
            ctx.fillStyle = 'rgba(100, 100, 120, 0.5)';
            ctx.fillRect(wall.x - wall.width/2, wall.y - wall.height/2, wall.width, wall.height);
            ctx.strokeStyle = 'rgba(150, 150, 180, 0.7)';
            ctx.strokeRect(wall.x - wall.width/2, wall.y - wall.height/2, wall.width, wall.height);
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
