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

    getRandomArenaPosition(margin = 50) {
        return {
            x: this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2),
            y: this.bounds.minY + margin + Math.random() * (this.bounds.maxY - this.bounds.minY - margin * 2)
        };
    },

    isInBounds(x, y, radius = 0) {
        return x - radius >= this.bounds.minX &&
               x + radius <= this.bounds.maxX &&
               y - radius >= this.bounds.minY &&
               y + radius <= this.bounds.maxY;
    },

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

    clearWalls() {
        for (let wall of this.walls) {
            Physics.unregister(wall);
        }
        this.walls = [];
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
