window.Ajanda = window.Ajanda || {};

const STICKERS = {
    'Yüzler': ['😀','😂','🥰','😎','😢','😡','🤔','💪','😴','🤩','😇','🥳','😤','🫡','😍'],
    'Semboller': ['⭐','💡','❤️','✅','❌','⚡','🔥','💯','🎯','💫','✨','💎','🏆','🎪','🎭'],
    'Eğitim': ['📚','📝','✏️','📖','🎓','📐','📏','🔬','🧪','💻','📊','📈','🗂️','📋','🔍'],
    'Yiyecek': ['🍕','🍔','🍟','🍩','☕','🍎','🥗','🎂','🍰','🧁','🥤','🫖','🍪','🥐','🍫'],
    'Aktivite': ['⚽','🎮','🎵','🎨','🏃','🚴','🏊','🎬','📸','🎤','🎹','♟️','🧩','🎲','🎳'],
    'İşaretler': ['📌','📎','🔖','🏷️','📍','🚩','💬','💭','🗨️','🔔','📢','🎀','🌈','☀️','🌙']
};

window.Ajanda.Media = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderStickerPanel();
    },

    cacheDOM() {
        this.stickerPanel = document.getElementById('stickerPanel');
        this.stickerToggle = document.getElementById('stickerToggle');
    },

    bindEvents() {
        if(this.stickerToggle && this.stickerPanel) {
            this.stickerToggle.addEventListener('click', () => {
                this.stickerPanel.style.display = this.stickerPanel.style.display === 'none' ? 'block' : 'none';
            });
        }

        document.addEventListener('paste', (e) => this.handlePaste(e));
    },

    renderStickerPanel() {
        const gridContainer = document.getElementById('stickerGridContainer');
        if(!gridContainer) return;

        let tabsHtml = `<div class="sticker-tabs" style="margin-bottom:10px;">`;
        let contentHtml = `<div class="sticker-content">`;

        let first = true;
        for(let category in STICKERS) {
            tabsHtml += `<button class="sticker-tab ${first ? 'active' : ''}" data-target="cat-${category.replace(/[^a-zA-Z0-9]/g, '')}">${category}</button>`;
            
            contentHtml += `<div class="sticker-grid" id="cat-${category.replace(/[^a-zA-Z0-9]/g, '')}" style="display: ${first ? 'grid' : 'none'};">`;
            STICKERS[category].forEach(emoji => {
                contentHtml += `<button class="sticker-item" data-emoji="${emoji}">${emoji}</button>`;
            });
            contentHtml += `</div>`;
            first = false;
        }
        tabsHtml += `</div>`;
        contentHtml += `</div>`;

        gridContainer.innerHTML = tabsHtml + contentHtml;

        // Close button support
        const closeBtn = document.getElementById('closeStickerPanel');
        if(closeBtn && this.stickerPanel) {
            closeBtn.onclick = () => this.stickerPanel.style.display = 'none';
        }

        // Tab events
        const tabs = gridContainer.querySelectorAll('.sticker-tab');
        const grids = gridContainer.querySelectorAll('.sticker-grid');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                grids.forEach(g => g.style.display = 'none');
                
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).style.display = 'grid';
            });
        });

        // Emoji click
        const items = gridContainer.querySelectorAll('.sticker-item');
        items.forEach(item => {
            // Prevent focus steal so document.activeElement remains the input
            item.addEventListener('mousedown', (e) => e.preventDefault());
            
            item.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.copyToClipboard(emoji);
                this.insertEmoji(emoji, document.activeElement);
                this.showToast('Kopyalandı: ' + emoji);
            });
        });
    },

    handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    this.showImagePreview(dataUrl);
                };
                reader.readAsDataURL(blob);
                event.preventDefault(); // Prevent default paste if we handle image
            }
        }
    },

    showImagePreview(dataUrl) {
        const bodyHtml = `
            <div>
                <img src="${dataUrl}" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom:10px;">
                <p>Bu resmi galeriye kaydetmek ister misiniz?</p>
            </div>
        `;
        window.Ajanda.UI.openModal('Resim Yapıştırıldı', bodyHtml, () => {
            let gallery = window.Ajanda.Storage.get('media_gallery') || [];
            gallery.push({
                id: window.Ajanda.Storage.generateId(),
                dataUrl: dataUrl,
                createdAt: new Date().toISOString()
            });
            window.Ajanda.Storage.set('media_gallery', gallery);
            this.showToast('Galeriye kaydedildi!');
        });
    },

    showToast(message) {
        let toast = document.querySelector('.toast');
        if(!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => toast.classList.remove('show'), 2000);
    },

    insertEmoji(emoji, targetInput) {
        if (targetInput && (targetInput.tagName === 'INPUT' || targetInput.tagName === 'TEXTAREA')) {
            const start = targetInput.selectionStart;
            const end = targetInput.selectionEnd;
            const text = targetInput.value;
            targetInput.value = text.substring(0, start) + emoji + text.substring(end);
            targetInput.selectionStart = targetInput.selectionEnd = start + emoji.length;
        }
    },

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => console.error('Kopyalama başarısız', err));
        }
    }
};
