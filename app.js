window.Ajanda = window.Ajanda || {};

// Mock Storage and UI for fallback if not fully implemented in HTML yet
window.Ajanda.Storage = window.Ajanda.Storage || {
    get(key) { return JSON.parse(localStorage.getItem('ajanda_' + key)); },
    set(key, data) { localStorage.setItem('ajanda_' + key, JSON.stringify(data)); },
    generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },
    exportAll() {
        let data = {};
        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key.startsWith('ajanda_')) {
                data[key.replace('ajanda_', '')] = JSON.parse(localStorage.getItem(key));
            }
        }
        return JSON.stringify(data);
    },
    importAll(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for(let key in data) {
                this.set(key, data[key]);
            }
        } catch(e) { alert('Hata: Geçersiz dosya formatı.'); }
    }
};

window.Ajanda.UI = window.Ajanda.UI || {
    openModal(title, bodyHtml, onSaveFn) {
        const modal = document.getElementById('ajandaModal') || this.createModal();
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = bodyHtml;
        modal.classList.add('active');
        
        const saveBtn = modal.querySelector('.modal-save');
        saveBtn.onclick = () => {
            if(onSaveFn) onSaveFn();
            this.closeModal();
        };
    },
    closeModal() {
        const modal = document.getElementById('ajandaModal');
        if(modal) modal.classList.remove('active');
    },
    createModal() {
        const div = document.createElement('div');
        div.id = 'ajandaModal';
        div.className = 'modal';
        div.innerHTML = `
            <div class="modal-overlay" id="modalOverlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button id="modalClose" class="modal-close">&times;</button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button class="modal-save">Kaydet</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        
        div.querySelector('#modalClose').addEventListener('click', () => this.closeModal());
        div.querySelector('#modalOverlay').addEventListener('click', () => this.closeModal());
        
        return div;
    }
};

window.Ajanda.state = {
    currentMonth: new Date().getMonth(),    // 0-11
    currentYear: new Date().getFullYear(),
    currentTab: 'takvim',
    theme: 'klasik',
    font: 'modern',
    soundEnabled: true,
    selectedDate: null
};

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyTheme();
    applyFont();
    setupNavigation();
    setupTabs();
    setupSettings();
    setupPageFlip();
    
    // Initialize all modules
    if (window.Ajanda.Calendar) window.Ajanda.Calendar.init();
    if (window.Ajanda.Daily) window.Ajanda.Daily.init();
    if (window.Ajanda.Finance) window.Ajanda.Finance.init();
    if (window.Ajanda.Lists) window.Ajanda.Lists.init();
    if (window.Ajanda.Schedule) window.Ajanda.Schedule.init();
    if (window.Ajanda.Drawing) window.Ajanda.Drawing.init();
    if (window.Ajanda.Media) window.Ajanda.Media.init();
    if (window.Ajanda.Notes) window.Ajanda.Notes.init();
    
    updateMonthDisplay();

    // Global Key Events
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') window.Ajanda.UI.closeModal();
    });
});

function loadSettings() {
    const defaultSettings = { theme: 'klasik', font: 'modern', soundEnabled: true };
    const saved = window.Ajanda.Storage.get('settings') || {};
    window.Ajanda.state.theme = saved.theme || defaultSettings.theme;
    window.Ajanda.state.font = saved.font || defaultSettings.font;
    window.Ajanda.state.soundEnabled = saved.soundEnabled !== undefined ? saved.soundEnabled : defaultSettings.soundEnabled;
}

function saveSettings() {
    window.Ajanda.Storage.set('settings', {
        theme: window.Ajanda.state.theme,
        font: window.Ajanda.state.font,
        soundEnabled: window.Ajanda.state.soundEnabled
    });
}

function applyTheme() {
    document.body.dataset.theme = window.Ajanda.state.theme;
}

function applyFont() {
    document.body.dataset.font = window.Ajanda.state.font;
}

function updateMonthDisplay() {
    const lblMonth = document.getElementById('currentMonthLabel');
    const lblYear = document.getElementById('currentYearLabel');
    if(lblMonth) lblMonth.textContent = MONTHS[window.Ajanda.state.currentMonth];
    if(lblYear) lblYear.textContent = window.Ajanda.state.currentYear;
}

function setupNavigation() {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    if(prevBtn) {
        prevBtn.addEventListener('click', () => {
            window.Ajanda.state.currentMonth--;
            if(window.Ajanda.state.currentMonth < 0) {
                window.Ajanda.state.currentMonth = 11;
                window.Ajanda.state.currentYear--;
            }
            onMonthChange();
        });
    }

    if(nextBtn) {
        nextBtn.addEventListener('click', () => {
            window.Ajanda.state.currentMonth++;
            if(window.Ajanda.state.currentMonth > 11) {
                window.Ajanda.state.currentMonth = 0;
                window.Ajanda.state.currentYear++;
            }
            onMonthChange();
        });
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Tab butonlarını güncelle
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            window.Ajanda.state.currentTab = tab.dataset.tab;
            
            // Tüm section'ları gizle, hedefi göster
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById('section-' + tab.dataset.tab);
            if(targetSection) targetSection.classList.add('active');
            
            // Sayfa çevirme efekti
            playPageFlip();
        });
    });
}

function onMonthChange() {
    playPageFlip();
    updateMonthDisplay();
    
    if (window.Ajanda.Calendar) window.Ajanda.Calendar.render();
    if (window.Ajanda.Finance) window.Ajanda.Finance.render();
}

function setupPageFlip() {
    // Add page flip overlay if not exists
    if(!document.getElementById('pageFlipOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'pageFlipOverlay';
        overlay.className = 'page-flip-overlay';
        document.body.appendChild(overlay);
    }
}

function playPageFlip() {
    const overlay = document.getElementById('pageFlipOverlay');
    if(overlay) {
        overlay.classList.remove('flipping');
        void overlay.offsetWidth; // Force reflow
        overlay.classList.add('flipping');
        setTimeout(() => overlay.classList.remove('flipping'), 700);
    }
    
    if (window.Ajanda.state.soundEnabled) {
        playPageTurnSound();
    }
}

function playPageTurnSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.3;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const envelope = Math.sin(Math.PI * t / duration);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.15;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 0.5;
        
        source.connect(filter);
        filter.connect(ctx.destination);
        source.start();
        
        setTimeout(() => ctx.close(), 500);
    } catch(e) { }
}

function setupSettings() {
    const btn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    
    if(btn && modal) {
        btn.addEventListener('click', () => modal.classList.add('active'));
        
        // Ayarlar modalını kapatma
        const closeBtn = document.getElementById('settingsCloseBtn');
        if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });
    }

    // Ses toggle (topbar)
    const soundToggle = document.getElementById('soundToggle');
    if(soundToggle) {
        soundToggle.textContent = window.Ajanda.state.soundEnabled ? '🔊' : '🔇';
        soundToggle.addEventListener('click', () => {
            window.Ajanda.state.soundEnabled = !window.Ajanda.state.soundEnabled;
            soundToggle.textContent = window.Ajanda.state.soundEnabled ? '🔊' : '🔇';
            // Settings modaldaki checkbox'ı da güncelle
            const cb = document.getElementById('settingSoundToggle');
            if(cb) cb.checked = window.Ajanda.state.soundEnabled;
            saveSettings();
        });
    }

    // Settings modaldaki ses checkbox
    const settingSoundCb = document.getElementById('settingSoundToggle');
    if(settingSoundCb) {
        settingSoundCb.checked = window.Ajanda.state.soundEnabled;
        settingSoundCb.addEventListener('change', () => {
            window.Ajanda.state.soundEnabled = settingSoundCb.checked;
            if(soundToggle) soundToggle.textContent = window.Ajanda.state.soundEnabled ? '🔊' : '🔇';
            saveSettings();
        });
    }

    // Tema seçimi
    const themeOptions = document.getElementById('themeOptions');
    if(themeOptions) {
        themeOptions.querySelectorAll('[data-theme]').forEach(opt => {
            if(opt.dataset.theme === window.Ajanda.state.theme) opt.classList.add('active');
            opt.addEventListener('click', () => {
                themeOptions.querySelectorAll('[data-theme]').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                window.Ajanda.state.theme = opt.dataset.theme;
                applyTheme();
                saveSettings();
            });
        });
    }

    // Font seçimi (select element)
    const fontOptions = document.getElementById('fontOptions');
    if(fontOptions) {
        fontOptions.value = window.Ajanda.state.font;
        fontOptions.addEventListener('change', () => {
            window.Ajanda.state.font = fontOptions.value;
            applyFont();
            saveSettings();
        });
    }

    // Dışa aktarma
    const exportBtn = document.getElementById('exportDataBtn');
    if(exportBtn) {
        exportBtn.addEventListener('click', () => {
            const json = window.Ajanda.Storage.exportAll();
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ajanda_yedek_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // İçe aktarma
    const importBtn = document.getElementById('importDataBtn');
    const importInput = document.getElementById('importFileInput');
    if(importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                window.Ajanda.Storage.importAll(ev.target.result);
                location.reload();
            };
            reader.readAsText(file);
        });
    }

    // Çizim modu toggle
    const drawingToggle = document.getElementById('drawingToggle');
    if(drawingToggle) {
        drawingToggle.addEventListener('click', () => {
            if(window.Ajanda.Drawing) {
                const pageKey = `${window.Ajanda.state.currentYear}-${window.Ajanda.state.currentMonth}-${window.Ajanda.state.currentTab}`;
                window.Ajanda.Drawing.open(pageKey);
            }
        });
    }
}

