// ============================================
// WAVEFORGE - Message System
// ============================================

const Messages = {
    container: null,
    maxVisible: CONFIG.MAX_VISIBLE_MESSAGES,
    
    init() {
        this.container = document.createElement('div');
        this.container.className = 'message-container';
        document.body.appendChild(this.container);
    },
    
    // Show a message
    show(text, duration = CONFIG.MESSAGE_DURATION) {
        if (!this.container) return;
        
        // Remove oldest if too many
        const currentMessages = this.container.querySelectorAll('.message-item');
        if (currentMessages.length >= this.maxVisible) {
            const oldest = currentMessages[0];
            oldest.classList.remove('show');
            oldest.classList.add('hide');
            setTimeout(() => { if (oldest.parentNode) oldest.remove(); }, 300);
        }
        
        const msgEl = document.createElement('div');
        msgEl.className = 'message-item';
        msgEl.textContent = text;
        this.container.appendChild(msgEl);
        
        requestAnimationFrame(() => msgEl.classList.add('show'));
        
        setTimeout(() => {
            msgEl.classList.remove('show');
            msgEl.classList.add('hide');
            setTimeout(() => { if (msgEl.parentNode) msgEl.remove(); }, 300);
        }, duration);
    }
};
