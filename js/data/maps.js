// ============================================
// WAVEFORGE - Map Definitions
// ============================================

const MAP_DEFINITIONS = {
    // === OPEN ARENA ===
    'open_arena': {
        id: 'open_arena',
        name: 'Open Arena',
        icon: '🏟️',
        description: 'No walls, pure combat. Perfect for testing builds.',
        difficulty: 'easy',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === MAZE ===
    'maze': {
        id: 'maze',
        name: 'The Maze',
        icon: '🧩',
        description: 'A confusing maze of walls. Enemies can get lost too.',
        difficulty: 'medium',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === CROSSROADS ===
    'crossroads': {
        id: 'crossroads',
        name: 'Crossroads',
        icon: '✚',
        description: 'Four corridors meeting in the center. Enemies come from all sides.',
        difficulty: 'medium',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === SPIRAL ===
    'spiral': {
        id: 'spiral',
        name: 'The Spiral',
        icon: '🌀',
        description: 'A spiral path to the center. Watch your back!',
        difficulty: 'hard',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === FORTRESS ===
    'fortress': {
        id: 'fortress',
        name: 'Fortress',
        icon: '🏰',
        description: 'A castle with narrow corridors. Enemies swarm through the gates.',
        difficulty: 'hard',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === RING ===
    'ring': {
        id: 'ring',
        name: 'The Ring',
        icon: '⭕',
        description: 'A circular arena with a ring of walls. Enemies spawn from the outer ring.',
        difficulty: 'medium',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === CHAOS ===
    'chaos': {
        id: 'chaos',
        name: 'Chaos',
        icon: '🌪️',
        description: 'Random walls every wave. No two waves are the same!',
        difficulty: 'extreme',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    },
    
    // === TOWER ===
    'tower': {
        id: 'tower',
        name: 'The Tower',
        icon: '🗼',
        description: 'A tower with multiple floors. Enemies climb up to reach you.',
        difficulty: 'extreme',
        walls: [],
        bossModifiers: {},
        spawnModifiers: {}
    }
};

// === MAP GENERATORS ===
const MapGenerators = {
    // Generate walls for each map type
    generateMap(mapId) {
        const map = MAP_DEFINITIONS[mapId];
        if (!map) return [];
        
        switch(mapId) {
            case 'open_arena':
                return this.generateOpenArena();
            case 'maze':
                return this.generateMaze();
            case 'crossroads':
                return this.generateCrossroads();
            case 'spiral':
                return this.generateSpiral();
            case 'fortress':
                return this.generateFortress();
            case 'ring':
                return this.generateRing();
            case 'chaos':
                return this.generateChaos();
            case 'tower':
                return this.generateTower();
            default:
                return this.generateOpenArena();
        }
    },
    
    // Open Arena - no walls
    generateOpenArena() {
        return [];
    },
    
    // Maze - random maze pattern
    generateMaze() {
        const walls = [];
        const cellSize = 60;
        const cols = Math.floor(CONFIG.CANVAS_WIDTH / cellSize);
        const rows = Math.floor(CONFIG.CANVAS_HEIGHT / cellSize);
        const maze = this.generateMazeGrid(cols, rows);
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] === 1) {
                    walls.push({
                        x: x * cellSize + cellSize/2,
                        y: y * cellSize + cellSize/2,
                        width: cellSize,
                        height: cellSize,
                        color: '#2a2a4a',
                        health: 100
                    });
                }
            }
        }
        return walls;
    },
    
    // Generate maze grid using DFS
    generateMazeGrid(cols, rows) {
        const grid = [];
        for (let y = 0; y < rows; y++) {
            grid[y] = [];
            for (let x = 0; x < cols; x++) {
                grid[y][x] = 1;
            }
        }
        
        // Simple maze generation (DFS)
        const stack = [{x: 1, y: 1}];
        grid[1][1] = 0;
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            const directions = [
                {dx: 0, dy: -2}, {dx: 0, dy: 2},
                {dx: -2, dy: 0}, {dx: 2, dy: 0}
            ];
            
            for (let dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                if (nx > 0 && nx < cols-1 && ny > 0 && ny < rows-1) {
                    if (grid[ny][nx] === 1) {
                        neighbors.push({x: nx, y: ny, dir: dir});
                    }
                }
            }
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                grid[current.y + next.dir.dy/2][current.x + next.dir.dx/2] = 0;
                grid[next.y][next.x] = 0;
                stack.push({x: next.x, y: next.y});
            } else {
                stack.pop();
            }
        }
        
        return grid;
    },
    
    // Crossroads - four corridors meeting in center
    generateCrossroads() {
        const walls = [];
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const corridorWidth = 80;
        const wallThickness = 20;
        
        // Four quadrants with corridors
        // Top-left quadrant walls
        walls.push({
            x: centerX - corridorWidth/2 - wallThickness,
            y: centerY - corridorWidth/2 - wallThickness,
            width: corridorWidth/2 + wallThickness,
            height: corridorWidth/2 + wallThickness,
            color: '#2a2a4a',
            health: 100
        });
        
        // Top-right quadrant walls
        walls.push({
            x: centerX + corridorWidth/2,
            y: centerY - corridorWidth/2 - wallThickness,
            width: corridorWidth/2 + wallThickness,
            height: corridorWidth/2 + wallThickness,
            color: '#2a2a4a',
            health: 100
        });
        
        // Bottom-left quadrant walls
        walls.push({
            x: centerX - corridorWidth/2 - wallThickness,
            y: centerY + corridorWidth/2,
            width: corridorWidth/2 + wallThickness,
            height: corridorWidth/2 + wallThickness,
            color: '#2a2a4a',
            health: 100
        });
        
        // Bottom-right quadrant walls
        walls.push({
            x: centerX + corridorWidth/2,
            y: centerY + corridorWidth/2,
            width: corridorWidth/2 + wallThickness,
            height: corridorWidth/2 + wallThickness,
            color: '#2a2a4a',
            health: 100
        });
        
        return walls;
    },
    
    // Spiral - spiral path to center
    generateSpiral() {
        const walls = [];
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const segments = 20;
        const wallThickness = 15;
        
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 6;
            const radius = 50 + t * 250;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Create wall segment
            walls.push({
                x: x,
                y: y,
                width: wallThickness,
                height: 30 + t * 40,
                color: '#2a2a4a',
                health: 100,
                angle: angle + Math.PI/2
            });
        }
        
        return walls;
    },
    
    // Fortress - castle with narrow corridors
    generateFortress() {
        const walls = [];
        const wallThickness = 15;
        const margin = 30;
        
        // Outer walls with gaps for gates
        const gateWidth = 80;
        
        // Top wall
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2,
            y: margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin,
            height: wallThickness,
            color: '#2a2a4a',
            health: 200
        });
        
        // Bottom wall
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2,
            y: CONFIG.CANVAS_HEIGHT - margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin,
            height: wallThickness,
            color: '#2a2a4a',
            health: 200
        });
        
        // Left wall (with gate)
        walls.push({
            x: margin,
            y: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2,
            width: wallThickness,
            height: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2 - margin,
            color: '#2a2a4a',
            health: 100
        });
        walls.push({
            x: margin,
            y: CONFIG.CANVAS_HEIGHT/2 + gateWidth/2,
            width: wallThickness,
            height: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2 - margin,
            color: '#2a2a4a',
            health: 100
        });
        
        // Right wall (with gate)
        walls.push({
            x: CONFIG.CANVAS_WIDTH - margin,
            y: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2,
            width: wallThickness,
            height: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2 - margin,
            color: '#2a2a4a',
            health: 100
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH - margin,
            y: CONFIG.CANVAS_HEIGHT/2 + gateWidth/2,
            width: wallThickness,
            height: CONFIG.CANVAS_HEIGHT/2 - gateWidth/2 - margin,
            color: '#2a2a4a',
            health: 100
        });
        
        // Inner walls (corridors)
        const innerSize = 120;
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 - innerSize/2,
            y: CONFIG.CANVAS_HEIGHT/2,
            width: innerSize,
            height: wallThickness,
            color: '#3a3a5a',
            health: 100
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 - innerSize/2,
            y: CONFIG.CANVAS_HEIGHT/2,
            width: wallThickness,
            height: innerSize,
            color: '#3a3a5a',
            health: 100
        });
        
        return walls;
    },
    
    // Ring - circular arena with ring of walls
    generateRing() {
        const walls = [];
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const innerRadius = 150;
        const outerRadius = 220;
        const segments = 24;
        const wallThickness = 20;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = innerRadius + (outerRadius - innerRadius) / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            walls.push({
                x: x,
                y: y,
                width: wallThickness,
                height: wallThickness,
                color: '#2a2a4a',
                health: 100,
                angle: angle
            });
        }
        
        return walls;
    },
    
    // Chaos - random walls every wave
    generateChaos() {
        const walls = [];
        const numWalls = 8 + Math.floor(Math.random() * 12);
        const wallSize = 40 + Math.random() * 60;
        
        for (let i = 0; i < numWalls; i++) {
            let x, y, valid = false;
            for (let attempts = 0; attempts < 20; attempts++) {
                x = wallSize + Math.random() * (CONFIG.CANVAS_WIDTH - wallSize * 2);
                y = wallSize + Math.random() * (CONFIG.CANVAS_HEIGHT - wallSize * 2);
                
                // Don't spawn too close to player start
                if (Math.hypot(x - CONFIG.CANVAS_WIDTH/2, y - CONFIG.CANVAS_HEIGHT/2) < 100) continue;
                
                valid = true;
                break;
            }
            
            if (valid) {
                walls.push({
                    x: x,
                    y: y,
                    width: wallSize + Math.random() * 60,
                    height: wallSize + Math.random() * 60,
                    color: `hsl(${Math.random() * 60 + 240}, 30%, 20%)`,
                    health: 50 + Math.random() * 100
                });
            }
        }
        return walls;
    },
    
    // Tower - multiple floors with stairs
    generateTower() {
        const walls = [];
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const floors = 4;
        const floorHeight = CONFIG.CANVAS_HEIGHT / floors;
        const wallThickness = 15;
        
        for (let i = 0; i < floors; i++) {
            const y = i * floorHeight + floorHeight/2;
            const width = CONFIG.CANVAS_WIDTH * (1 - i * 0.15);
            
            // Floor walls
            walls.push({
                x: centerX,
                y: y,
                width: width,
                height: wallThickness,
                color: `hsl(${220 + i * 20}, 30%, ${15 + i * 5}%)`,
                health: 150 - i * 20
            });
            
            // Staircase gaps
            if (i < floors - 1) {
                const gapSize = 60;
                walls.push({
                    x: centerX - gapSize/2,
                    y: y + 5,
                    width: gapSize,
                    height: 5,
                    color: '#1a1a3a',
                    health: 100
                });
            }
        }
        
        // Spiral stairs
        const stairSegments = 20;
        for (let i = 0; i < stairSegments; i++) {
            const t = i / stairSegments;
            const angle = t * Math.PI * 4;
            const radius = 50 + t * 150;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            walls.push({
                x: x,
                y: y,
                width: 10,
                height: 10,
                color: '#3a3a5a',
                health: 50
            });
        }
        
        return walls;
    }
};

// === MAP SELECTION UI ===
const MapSelection = {
    selectedMap: 'open_arena',
    
    init() {
        this.createMapSelectionOverlay();
    },
    
    createMapSelectionOverlay() {
        const overlay = document.getElementById('mapSelectionOverlay');
        if (!overlay) {
            // Create overlay if it doesn't exist
            const newOverlay = document.createElement('div');
            newOverlay.id = 'mapSelectionOverlay';
            newOverlay.className = 'overlay';
            newOverlay.style.display = 'none';
            document.body.appendChild(newOverlay);
        }
    },
    
    show() {
        const overlay = document.getElementById('mapSelectionOverlay');
        if (!overlay) return;
        
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="overlay-content" style="max-width: 800px;">
                <h2 class="overlay-title">🗺️ Select Your Arena</h2>
                <p class="overlay-text">Choose a map for your run. Each map has unique walls and challenges.</p>
                <div class="map-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:20px 0;">
                    ${this.generateMapButtons()}
                </div>
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" id="confirmMapBtn" style="width:200px;margin:0 auto;">
                        <span>⚔️</span> Start Battle
                    </button>
                </div>
            </div>
        `;
        
        // Add click handlers for map buttons
        overlay.querySelectorAll('.map-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMap(btn.dataset.mapId));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectMap(btn.dataset.mapId);
            });
        });
        
        // Confirm button
        document.getElementById('confirmMapBtn').addEventListener('click', () => this.confirmMap());
        document.getElementById('confirmMapBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.confirmMap();
        });
    },
    
    generateMapButtons() {
        let html = '';
        for (let [id, map] of Object.entries(MAP_DEFINITIONS)) {
            const selected = id === this.selectedMap ? 'selected' : '';
            html += `
                <div class="map-btn ${selected}" data-map-id="${id}" style="
                    background: ${id === this.selectedMap ? 'rgba(255,215,0,0.2)' : 'rgba(50,50,100,0.3)'};
                    border: ${id === this.selectedMap ? '3px solid #ffd700' : '2px solid #5555aa'};
                    border-radius: 10px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                ">
                    <div style="font-size:2rem;margin-bottom:5px;">${map.icon}</div>
                    <div style="font-weight:bold;color:#fff;font-size:1.1rem;">${map.name}</div>
                    <div style="font-size:0.8rem;color:#aaa;">${map.description}</div>
                    <div style="font-size:0.7rem;color:#666;margin-top:5px;">
                        Difficulty: ${map.difficulty.toUpperCase()}
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    selectMap(mapId) {
        this.selectedMap = mapId;
        // Update UI
        const overlay = document.getElementById('mapSelectionOverlay');
        overlay.querySelectorAll('.map-btn').forEach(btn => {
            btn.style.background = 'rgba(50,50,100,0.3)';
            btn.style.border = '2px solid #5555aa';
            if (btn.dataset.mapId === mapId) {
                btn.style.background = 'rgba(255,215,0,0.2)';
                btn.style.border = '3px solid #ffd700';
            }
        });
    },
    
    confirmMap() {
        // Set the map for the game
        Game.currentMap = this.selectedMap;
        const overlay = document.getElementById('mapSelectionOverlay');
        overlay.style.display = 'none';
        
        // Generate walls for the map
        const walls = MapGenerators.generateMap(this.selectedMap);
        Arena.setWalls(walls);
        
        // Start the game
        Game.startGame();
    }
};
