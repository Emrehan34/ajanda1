window.Ajanda = window.Ajanda || {};

window.Ajanda.Drawing = {
    drawing: false,
    currentTool: 'pen',
    basePenSize: 2,
    currentColor: '#000000',
    currentPageKey: null,

    init() {
        this.canvas = document.getElementById('drawingCanvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('drawingOverlay');
        
        this.bindEvents();
        this.setupToolbar();
    },

    bindEvents() {
        window.addEventListener('resize', () => {
            if (this.overlay && this.overlay.style.display !== 'none') {
                this.resizeCanvas();
                if(this.currentPageKey) this.loadDrawing(this.currentPageKey);
            }
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    },

    setupToolbar() {
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTool(btn.dataset.tool);
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const colorPicker = document.getElementById('drawingColor');
        if (colorPicker) colorPicker.addEventListener('input', (e) => this.setColor(e.target.value));

        const sizeSlider = document.getElementById('drawingSize');
        if (sizeSlider) sizeSlider.addEventListener('input', (e) => this.setSize(e.target.value));

        const clearBtn = document.getElementById('drawingClear');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());

        const saveBtn = document.getElementById('drawingSave');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveDrawing());

        const closeBtn = document.getElementById('drawingClose');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    },

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
    },

    open(pageKey) {
        if(!this.overlay) return;
        this.currentPageKey = pageKey;
        this.overlay.style.display = 'flex';
        this.resizeCanvas();
        this.loadDrawing(pageKey);
        this.setTool('pen');
    },

    close() {
        this.saveDrawing();
        if(this.overlay) this.overlay.style.display = 'none';
        this.currentPageKey = null;
    },

    onPointerDown(e) {
        this.drawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    },

    onPointerMove(e) {
        if (!this.drawing) return;
        
        const pressure = e.pressure !== undefined ? e.pressure : 0.5;
        let lineWidth = this.basePenSize * (pressure * 2);
        if(lineWidth < 1) lineWidth = 1;
        
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.basePenSize * 5;
        } else if (this.currentTool === 'highlighter') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.hexToRgbA(this.currentColor, 0.3);
            this.ctx.lineWidth = this.basePenSize * 3;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
        }

        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    },

    onPointerUp(e) {
        this.drawing = false;
        this.ctx.beginPath();
    },

    setTool(tool) {
        this.currentTool = tool;
        if(this.canvas) {
            this.canvas.style.cursor = tool === 'eraser' ? 'crosshair' : 'url("pencil-cursor.png"), auto';
        }
    },

    setColor(color) {
        this.currentColor = color;
    },

    setSize(size) {
        this.basePenSize = parseInt(size, 10);
    },

    clearCanvas() {
        if(confirm('Çizimi temizlemek istediğinize emin misiniz?')) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.ctx.clearRect(0, 0, rect.width, rect.height);
        }
    },

    saveDrawing() {
        if(!this.currentPageKey) return;
        const dataUrl = this.canvas.toDataURL();
        let drawings = window.Ajanda.Storage.get('drawings') || [];
        const existingIndex = drawings.findIndex(d => d.pageKey === this.currentPageKey);
        
        const record = {
            id: window.Ajanda.Storage.generateId(),
            pageKey: this.currentPageKey,
            dataUrl: dataUrl,
            createdAt: new Date().toISOString()
        };

        if (existingIndex >= 0) drawings[existingIndex] = record;
        else drawings.push(record);
        
        window.Ajanda.Storage.set('drawings', drawings);
    },

    loadDrawing(pageKey) {
        const drawings = window.Ajanda.Storage.get('drawings') || [];
        const record = drawings.find(d => d.pageKey === pageKey);
        if (record) {
            const img = new Image();
            img.onload = () => {
                const rect = this.canvas.parentElement.getBoundingClientRect();
                this.ctx.clearRect(0, 0, rect.width, rect.height);
                this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = record.dataUrl;
        } else {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.ctx.clearRect(0, 0, rect.width, rect.height);
        }
    },

    hexToRgbA(hex, alpha){
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
        }
        return hex; // fallback
    }
};
