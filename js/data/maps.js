// ============================================
// WAVEFORGE - Map Definitions & Selection
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
    
    // Maze - guaranteed paths, no trap boxes
    generateMaze() {
        const walls = [];
        const cellSize = 60;
        const cols = Math.floor((CONFIG.CANVAS_WIDTH - 40) / cellSize);
        const rows = Math.floor((CONFIG.CANVAS_HEIGHT - 40) / cellSize);
        
        // Simple grid with guaranteed paths
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // Keep border cells open
                if (y === 0 || y === rows-1 || x === 0 || x === cols-1) continue;
                // Keep every other cell open (grid pattern)
                if (x % 2 === 0 && y % 2 === 0) continue;
                // Random walls with lower density
                if (Math.random() < 0.35) {
                    walls.push({
                        x: 20 + x * cellSize + cellSize/2,
                        y: 20 + y * cellSize + cellSize/2,
                        width: cellSize,
                        height: cellSize,
                        color: '#2a2a4a',
                        health: 100
                    });
                }
            }
        }
        
        // Add some additional random walls but keep them small and spaced
        const numWalls = 3 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numWalls; i++) {
            const x = 60 + Math.random() * (CONFIG.CANVAS_WIDTH - 120);
            const y = 60 + Math.random() * (CONFIG.CANVAS_HEIGHT - 120);
            // Don't block center
            if (Math.hypot(x - CONFIG.CANVAS_WIDTH/2, y - CONFIG.CANVAS_HEIGHT/2) < 100) continue;
            walls.push({
                x, y,
                width: 30 + Math.random() * 30,
                height: 30 + Math.random() * 30,
                color: '#3a3a5a',
                health: 80
            });
        }
        
        return walls;
    },
    
    // Crossroads - four corridors meeting in center
    generateCrossroads() {
        const walls = [];
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const corridorWidth = 80;
        const wallThickness = 20;
        
        // Four quadrants with corridors - leave gaps for monsters
        // Top-left quadrant walls
        walls.push({
            x: centerX - corridorWidth/2 - wallThickness/2,
            y: centerY - corridorWidth/2 - wallThickness/2,
            width: corridorWidth/2 + wallThickness/2,
            height: corridorWidth/2 + wallThickness/2,
            color: '#2a2a4a',
            health: 100
        });
        
        // Top-right quadrant walls
        walls.push({
            x: centerX + corridorWidth/2 + wallThickness/2,
            y: centerY - corridorWidth/2 - wallThickness/2,
            width: corridorWidth/2 + wallThickness/2,
            height: corridorWidth/2 + wallThickness/2,
            color: '#2a2a4a',
            health: 100
        });
        
        // Bottom-left quadrant walls
        walls.push({
            x: centerX - corridorWidth/2 - wallThickness/2,
            y: centerY + corridorWidth/2 + wallThickness/2,
            width: corridorWidth/2 + wallThickness/2,
            height: corridorWidth/2 + wallThickness/2,
            color: '#2a2a4a',
            health: 100
        });
        
        // Bottom-right quadrant walls
        walls.push({
            x: centerX + corridorWidth/2 + wallThickness/2,
            y: centerY + corridorWidth/2 + wallThickness/2,
            width: corridorWidth/2 + wallThickness/2,
            height: corridorWidth/2 + wallThickness/2,
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
        const gapSize = 30; // Gaps between spiral segments
        
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 6;
            const radius = 50 + t * 250;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Leave gaps for monsters to pass
            if (i % 3 === 0) continue;
            
            walls.push({
                x: x,
                y: y,
                width: wallThickness,
                height: 25 + t * 30,
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
        const gateWidth = 80;
        
        // Outer walls with gaps for gates
        // Top wall
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2,
            y: margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin - gateWidth/2,
            height: wallThickness,
            color: '#2a2a4a',
            health: 200
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 + gateWidth/2,
            y: margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin - gateWidth/2,
            height: wallThickness,
            color: '#2a2a4a',
            health: 200
        });
        
        // Bottom wall
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2,
            y: CONFIG.CANVAS_HEIGHT - margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin - gateWidth/2,
            height: wallThickness,
            color: '#2a2a4a',
            health: 200
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 + gateWidth/2,
            y: CONFIG.CANVAS_HEIGHT - margin,
            width: CONFIG.CANVAS_WIDTH - 2*margin - gateWidth/2,
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
        
        // Inner walls (corridors) with gaps
        const innerSize = 120;
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 - innerSize/2,
            y: CONFIG.CANVAS_HEIGHT/2 - 10,
            width: innerSize,
            height: wallThickness,
            color: '#3a3a5a',
            health: 100
        });
        walls.push({
            x: CONFIG.CANVAS_WIDTH/2 - innerSize/2,
            y: CONFIG.CANVAS_HEIGHT/2 + 10,
            width: innerSize,
            height: wallThickness,
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
        const gapSize = 40; // Gaps between ring segments
        
        for (let i = 0; i < segments; i++) {
            // Leave gaps for monsters to pass
            if (i % 4 === 0) continue;
            
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
        
        // Add some inner ring walls
        for (let i = 0; i < 12; i++) {
            if (i % 3 === 0) continue;
            const angle = (i / 12) * Math.PI * 2;
            const radius = 80;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            walls.push({
                x: x,
                y: y,
                width: 15,
                height: 15,
                color: '#3a3a5a',
                health: 80,
                angle: angle
            });
        }
        
        return walls;
    },
    
    // Chaos - random walls every wave
    generateChaos() {
        const walls = [];
        const numWalls = 6 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < numWalls; i++) {
            let x, y, valid = false;
            for (let attempts = 0; attempts < 20; attempts++) {
                x = 80 + Math.random() * (CONFIG.CANVAS_WIDTH - 160);
                y = 80 + Math.random() * (CONFIG.CANVAS_HEIGHT - 160);
                
                // Don't block center too much
                if (Math.hypot(x - CONFIG.CANVAS_WIDTH/2, y - CONFIG.CANVAS_HEIGHT/2) < 120) continue;
                
                // Don't block corners (keep spawn areas open)
                if (x < 100 && y < 100) continue;
                if (x > CONFIG.CANVAS_WIDTH - 100 && y < 100) continue;
                if (x < 100 && y > CONFIG.CANVAS_HEIGHT - 100) continue;
                if (x > CONFIG.CANVAS_WIDTH - 100 && y > CONFIG.CANVAS_HEIGHT - 100) continue;
                
                valid = true;
                break;
            }
            
            if (valid) {
                walls.push({
                    x, y,
                    width: 30 + Math.random() * 40,
                    height: 30 + Math.random() * 40,
                    color: `hsl(${Math.random() * 60 + 240}, 30%, 20%)`,
                    health: 60 + Math.random() * 60
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
            
            // Floor walls with gaps
            const gapSize = 60 + i * 10;
            walls.push({
                x: centerX - width/2 - 10,
                y: y,
                width: width/2 - gapSize/2,
                height: wallThickness,
                color: `hsl(${220 + i * 20}, 30%, ${15 + i * 5}%)`,
                health: 150 - i * 20
            });
            walls.push({
                x: centerX + gapSize/2 + 10,
                y: y,
                width: width/2 - gapSize/2,
                height: wallThickness,
                color: `hsl(${220 + i * 20}, 30%, ${15 + i * 5}%)`,
                health: 150 - i * 20
            });
        }
        
        // Spiral stairs with gaps
        const stairSegments = 16;
        for (let i = 0; i < stairSegments; i++) {
            if (i % 3 === 0) continue;
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
        // Create the overlay if it doesn't exist
        if (!document.getElementById('mapSelectionOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'mapSelectionOverlay';
            overlay.className = 'overlay';
            overlay.style.display = 'none';
            document.body.appendChild(overlay);
        }
    },
    
    show() {
        const overlay = document.getElementById('mapSelectionOverlay');
        if (!overlay) {
            console.error('MapSelection overlay not found!');
            return;
        }
        
        // Build the HTML
        overlay.innerHTML = `
            <div class="overlay-content" style="max-width: 900px; background: rgba(30,30,60,0.95); padding: 40px; border-radius: 20px; border: 3px solid #ffd700;">
                <h2 class="overlay-title" style="font-size: 3rem; color: #ffd700; margin-bottom: 20px;">🗺️ Select Your Arena</h2>
                <p style="color: #aaa; font-size: 1.2rem; margin-bottom: 30px;">Choose a map for your run. Each map has unique walls and challenges.</p>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:20px 0;">
                    ${this.generateMapButtons()}
                </div>
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" id="confirmMapBtn" style="width:200px;margin:0 auto; padding: 15px 30px; background: linear-gradient(45deg, #ff6b6b, #ffa726); color: white; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
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
        const confirmBtn = document.getElementById('confirmMapBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmMap());
            confirmBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.confirmMap();
            });
        }
        
        // Show the overlay
        overlay.style.display = 'flex';
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
        Game.currentMap = this.selectedMap;
        const overlay = document.getElementById('mapSelectionOverlay');
        overlay.style.display = 'none';
        
        const walls = MapGenerators.generateMap(this.selectedMap);
        Arena.setWalls(walls);
        
        Game.startGameWithMap();
    }
};
