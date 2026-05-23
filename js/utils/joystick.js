// ============================================
// WAVEFORGE - Mobile Joystick
// ============================================

const Joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    currentX: 0,
    currentY: 0,
    maxDistance: 50,
    
    init() {
        const container = document.createElement('div');
        container.id = 'joystickContainer';
        container.className = 'joystick-container';
        container.innerHTML = `
            <div id="joystickBase" class="joystick-base">
                <div id="joystickHandle" class="joystick-handle"></div>
            </div>
        `;
        document.body.appendChild(container);
        
        const base = document.getElementById('joystickBase');
        const handle = document.getElementById('joystickHandle');
        
        const getPosition = (e) => {
            const touch = e.touches[0];
            const rect = base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            const dist = Math.hypot(dx, dy);
            
            if (dist > this.maxDistance) {
                dx = (dx / dist) * this.maxDistance;
                dy = (dy / dist) * this.maxDistance;
            }
            return { x: dx, y: dy };
        };
        
        base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.active = true;
            const rect = base.getBoundingClientRect();
            this.baseX = rect.left + rect.width / 2;
            this.baseY = rect.top + rect.height / 2;
            const pos = getPosition(e);
            this.currentX = pos.x;
            this.currentY = pos.y;
            handle.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            base.classList.add('active');
            
            // Update player joystick state
            Player.joystickActive = true;
            Player.joystickX = pos.x / this.maxDistance;
            Player.joystickY = pos.y / this.maxDistance;
        });
        
        base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.active) return;
            const pos = getPosition(e);
            this.currentX = pos.x;
            this.currentY = pos.y;
            handle.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            Player.joystickX = pos.x / this.maxDistance;
            Player.joystickY = pos.y / this.maxDistance;
        });
        
        base.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.active = false;
            this.currentX = 0;
            this.currentY = 0;
            handle.style.transform = 'translate(0px, 0px)';
            base.classList.remove('active');
            Player.joystickActive = false;
            Player.joystickX = 0;
            Player.joystickY = 0;
        });
        
        base.addEventListener('touchcancel', (e) => {
            this.active = false;
            this.currentX = 0;
            this.currentY = 0;
            handle.style.transform = 'translate(0px, 0px)';
            base.classList.remove('active');
            Player.joystickActive = false;
            Player.joystickX = 0;
            Player.joystickY = 0;
        });
    }
};
