// ============================================
// WAVEFORGE - Camera System
// ============================================

const Camera = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    worldWidth: 1600,
    worldHeight: 1200,
    smoothness: 0.1,
    
    init() {
        this.width = CONFIG.CANVAS_WIDTH;
        this.height = CONFIG.CANVAS_HEIGHT;
        this.worldWidth = CONFIG.CANVAS_WIDTH * 2;
        this.worldHeight = CONFIG.CANVAS_HEIGHT * 2;
        this.x = 0;
        this.y = 0;
    },
    
    follow(player) {
        if (!player) return;
        const targetX = player.x - this.width / 2;
        const targetY = player.y - this.height / 2;
        const clampedX = Math.max(0, Math.min(this.worldWidth - this.width, targetX));
        const clampedY = Math.max(0, Math.min(this.worldHeight - this.height, targetY));
        this.x += (clampedX - this.x) * this.smoothness;
        this.y += (clampedY - this.y) * this.smoothness;
    },
    
    worldToScreen(worldX, worldY) {
        return { x: worldX - this.x, y: worldY - this.y };
    },
    
    screenToWorld(screenX, screenY) {
        return { x: screenX + this.x, y: screenY + this.y };
    },
    
    isVisible(worldX, worldY, margin = 50) {
        return worldX >= this.x - margin && 
               worldX <= this.x + this.width + margin &&
               worldY >= this.y - margin && 
               worldY <= this.y + this.height + margin;
    },
    
    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    },
    
    restore(ctx) {
        ctx.restore();
    },
    
    drawBounds(ctx) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
    }
};
