window.Ajanda = window.Ajanda || {};
window.Ajanda.Storage = {
    prefix: 'ajanda_',
    
    get(key, defaultVal = []) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultVal;
        } catch { return defaultVal; }
    },
    
    set(key, data) {
        localStorage.setItem(this.prefix + key, JSON.stringify(data));
        this.showSaveIndicator();
    },
    
    showSaveIndicator() {
        let indicator = document.getElementById('saveIndicator');
        if(!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.innerHTML = '☁️ Otomatik Kaydedildi';
            indicator.style.cssText = 'position:fixed; bottom:20px; right:20px; background:var(--success); color:white; padding:8px 15px; border-radius:20px; font-size:12px; opacity:0; transition:opacity 0.3s; z-index:9999; box-shadow:0 2px 10px rgba(0,0,0,0.1); pointer-events:none;';
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    },
    
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    exportAll() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                data[key] = localStorage.getItem(key);
            }
        }
        return JSON.stringify(data, null, 2);
    },
    
    importAll(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            Object.entries(data).forEach(([key, val]) => {
                if (key.startsWith(this.prefix)) {
                    localStorage.setItem(key, val);
                }
            });
            return true;
        } catch { return false; }
    }
};
