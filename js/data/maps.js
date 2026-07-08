// ============================================
// WAVEFORGE - Map Definitions & Selection
// ============================================

const MAP_DEFINITIONS = {
    'empty_arena': {
        id: 'empty_arena',
        name: 'Empty Arena',
        icon: '⬜',
        description: 'No walls. Pure open combat.',
        difficulty: 'easy',
        walls: []
    },
    'arena': {
        id: 'arena',
        name: 'Arena',
        icon: '🏟️',
        description: 'Random barrels, boxes, and barriers. Indestructible obstacles.',
        difficulty: 'medium',
        walls: []
    },
    'backrooms': {
        id: 'backrooms',
        name: 'Backrooms',
        icon: '🚪',
        description: 'Lots of walls. A maze-like labyrinth. Indestructible.',
        difficulty: 'hard',
        walls: []
    }
};

const MapGenerators = {
    generateMap(mapId) {
        switch(mapId) {
            case 'empty_arena':
                return this.generateEmptyArena();
            case 'arena':
                return this.generateArena();
            case 'backrooms':
                return this.generateBackrooms();
            default:
                return this.generateEmptyArena();
        }
    },
    
    generateEmptyArena() {
        return [];
    },
    
    generateArena() {
        const walls = [];
        const numObstacles = 12 + Math.floor(Math.random() * 12);
        const centerX = CONFIG.CANVAS_WIDTH;
        const centerY = CONFIG.CANVAS_HEIGHT;
        
        for (let i = 0; i < numObstacles; i++) {
            let x, y, valid = false;
            let attempts = 0;
            while (!valid && attempts < 30) {
                attempts++;
                x = 80 + Math.random() * (CONFIG.CANVAS_WIDTH * 2 - 160);
                y = 80 + Math.random() * (CONFIG.CANVAS_HEIGHT * 2 - 160);
                
                if (Math.hypot(x - centerX, y - centerY) < 150) continue;
                
                let overlap = false;
                for (let wall of walls) {
                    const dx = x - wall.x;
                    const dy = y - wall.y;
                    if (Math.hypot(dx, dy) < 80) {
                        overlap = true;
                        break;
                    }
                }
                if (!overlap) valid = true;
            }
            
            if (valid) {
                const type = Math.random();
                let width, height, color;
                if (type < 0.4) {
                    width = 30 + Math.random() * 20;
                    height = width;
                    color = '#8B4513';
                } else if (type < 0.7) {
                    width = 40 + Math.random() * 30;
                    height = 40 + Math.random() * 30;
                    color = '#8B7355';
                } else {
                    width = 20 + Math.random() * 30;
                    height = 60 + Math.random() * 40;
                    color = '#696969';
                }
                
                walls.push({
                    x, y,
                    width: width,
                    height: height,
                    color: color,
                    health: Infinity,
                    indestructible: true
                });
            }
        }
        
        const margin = 20;
        const barrierThickness = 15;
        walls.push({
            x: CONFIG.CANVAS_WIDTH,
            y: margin,
            width: CONFIG.CANVAS_WIDTH * 2 - margin * 2,
            height: barrierThickness,
            color: '#555',
            health: Infinity,
            indestructible: true
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH,
            y: CONFIG.CANVAS_HEIGHT * 2 - margin,
            width: CONFIG.CANVAS_WIDTH * 2 - margin * 2,
            height: barrierThickness,
            color: '#555',
            health: Infinity,
            indestructible: true
        });
        walls.push({
            x: margin,
            y: CONFIG.CANVAS_HEIGHT,
            width: barrierThickness,
            height: CONFIG.CANVAS_HEIGHT * 2 - margin * 2,
            color: '#555',
            health: Infinity,
            indestructible: true
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH * 2 - margin,
            y: CONFIG.CANVAS_HEIGHT,
            width: barrierThickness,
            height: CONFIG.CANVAS_HEIGHT * 2 - margin * 2,
            color: '#555',
            health: Infinity,
            indestructible: true
        });
        
        return walls;
    },
    
    generateBackrooms() {
        const walls = [];
        const wallThickness = 15;
        const roomSize = 120;
        const cols = Math.floor((CONFIG.CANVAS_WIDTH * 2) / roomSize);
        const rows = Math.floor((CONFIG.CANVAS_HEIGHT * 2) / roomSize);
        
        // Generate a maze-like grid of rooms with gaps
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cx = x * roomSize + roomSize / 2;
                const cy = y * roomSize + roomSize / 2;
                
                // Randomly add walls to create a maze
                if (Math.random() < 0.3) {
                    // Horizontal wall (with gap)
                    const hasGap = Math.random() < 0.3;
                    if (hasGap) {
                        const gapSize = 30;
                        const gapStart = (roomSize - gapSize) / 2;
                        walls.push({
                            x: cx - roomSize/2 + gapStart/2,
                            y: cy,
                            width: gapStart,
                            height: wallThickness,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                        walls.push({
                            x: cx + gapStart/2 + gapSize,
                            y: cy,
                            width: gapStart,
                            height: wallThickness,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                    } else {
                        walls.push({
                            x: cx,
                            y: cy,
                            width: roomSize,
                            height: wallThickness,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                    }
                }
                
                if (Math.random() < 0.3) {
                    // Vertical wall (with gap)
                    const hasGap = Math.random() < 0.3;
                    if (hasGap) {
                        const gapSize = 30;
                        const gapStart = (roomSize - gapSize) / 2;
                        walls.push({
                            x: cx,
                            y: cy - roomSize/2 + gapStart/2,
                            width: wallThickness,
                            height: gapStart,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                        walls.push({
                            x: cx,
                            y: cy + gapStart/2 + gapSize,
                            width: wallThickness,
                            height: gapStart,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                    } else {
                        walls.push({
                            x: cx,
                            y: cy,
                            width: wallThickness,
                            height: roomSize,
                            color: '#2a2a4a',
                            health: Infinity,
                            indestructible: true
                        });
                    }
                }
            }
        }
        
        // Add some random pillar-like obstacles
        for (let i = 0; i < 10; i++) {
            const x = 50 + Math.random() * (CONFIG.CANVAS_WIDTH * 2 - 100);
            const y = 50 + Math.random() * (CONFIG.CANVAS_HEIGHT * 2 - 100);
            walls.push({
                x, y,
                width: 20 + Math.random() * 20,
                height: 20 + Math.random() * 20,
                color: '#3a3a5a',
                health: Infinity,
                indestructible: true
            });
        }
        
        return walls;
    }
};
