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
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cx = x * roomSize + roomSize / 2;
                const cy = y * roomSize + roomSize / 2;
                
                if (Math.random() < 0.3) {
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

const MapSelection = {
    selectedMap: 'empty_arena',

    init() {
        if (!document.getElementById('mapSelectionOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'mapSelectionOverlay';
            overlay.className = 'overlay';
            overlay.style.display = 'none';
            document.body.appendChild(overlay);
        }
        console.log('✅ MapSelection initialized');
    },

    show() {
        console.log('🟢 MapSelection.show() called');
        const overlay = document.getElementById('mapSelectionOverlay');
        if (!overlay) {
            console.error('❌ MapSelection overlay not found!');
            return;
        }

        overlay.innerHTML = `
            <div class="overlay-content" style="max-width: 900px; background: rgba(30,30,60,0.95); padding: 40px; border-radius: 20px; border: 3px solid #ffd700;">
                <h2 class="overlay-title" style="font-size: 3rem; color: #ffd700; margin-bottom: 20px;">🗺️ Select Your Arena</h2>
                <p style="color: #aaa; font-size: 1.2rem; margin-bottom: 30px;">Choose a map for your run.</p>
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

        overlay.querySelectorAll('.map-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMap(btn.dataset.mapId));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectMap(btn.dataset.mapId);
            });
        });

        const confirmBtn = document.getElementById('confirmMapBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmMap());
            confirmBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.confirmMap();
            });
        }

        overlay.style.display = 'flex';
        console.log('✅ Map selection displayed');
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
        console.log(`🟢 Selected map: ${mapId}`);
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
        console.log('🟢 confirmMap() called');
        Game.currentMap = this.selectedMap;
        document.getElementById('mapSelectionOverlay').style.display = 'none';
        
        const walls = MapGenerators.generateMap(this.selectedMap);
        Arena.setWalls(walls);
        
        console.log(`✅ Map confirmed: ${this.selectedMap}, calling startGameWithMap()`);
        Game.startGameWithMap();
    }
};
