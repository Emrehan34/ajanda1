window.Ajanda = window.Ajanda || {};

window.Ajanda.Notes = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        this.notesGrid = document.getElementById('notesGrid');
        this.addNoteBtn = document.getElementById('addNoteBtn');
    },

    bindEvents() {
        if(this.addNoteBtn) {
            this.addNoteBtn.addEventListener('click', () => this.showNoteModal());
        }
    },

    render() {
        if(!this.notesGrid) return;
        const notes = window.Ajanda.Storage.get('notes', []);
        
        if (notes.length === 0) {
            this.notesGrid.innerHTML = '<p class="empty-state" style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">Henüz not eklenmemiş. "+ Yeni Not" butonuna tıklayarak başlayın.</p>';
            return;
        }

        let html = '';
        notes.forEach(note => {
            const preview = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
            html += `
                <div class="note-card" style="border-top: 6px solid ${note.color}; background: var(--bg-card); padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); cursor: pointer; position: relative; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                    <button class="note-delete-btn" onclick="event.stopPropagation(); window.Ajanda.Notes.deleteNote('${note.id}')" style="position: absolute; top: 15px; right: 15px; background: var(--bg-secondary); border: none; color: var(--danger); width: 32px; height: 32px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 14px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#ffcccc'" onmouseout="this.style.background='var(--bg-secondary)'">🗑️</button>
                    <div onclick="window.Ajanda.Notes.showNoteModal('${note.id}')">
                        <h3 style="margin-top:0; margin-bottom: 12px; padding-right: 40px; font-size: 20px; color: var(--text-primary); line-height:1.3;">${note.title}</h3>
                        <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; min-height: 70px;">${preview}</p>
                        <small style="display:flex; align-items:center; margin-top: 20px; color: #aaa; font-weight: 500; font-size: 13px;">
                            📅 ${new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </small>
                    </div>
                </div>
            `;
        });
        
        this.notesGrid.innerHTML = html;
    },

    showNoteModal(id = null) {
        const notes = window.Ajanda.Storage.get('notes', []);
        const note = id ? notes.find(n => n.id === id) : { title: '', content: '', color: '#c4956a' };
        
        const html = `
            <style>
                /* Geçici olarak bu modalı büyütmek için */
                .modal-content { max-width: 900px !important; height: 85vh; display: flex; flex-direction: column; }
                .modal-body { flex: 1; display: flex; flex-direction: column; overflow-y: hidden !important; padding: 0 !important; }
                .modal-footer { border-top: 1px solid var(--border); }
                #noteContent { 
                    flex: 1; 
                    width: 100%; 
                    border: none; 
                    border-radius: 0; 
                    resize: none; 
                    font-size: 18px; 
                    line-height: 1.6; 
                    padding: 30px; 
                    background: transparent;
                }
                #noteContent:focus { border: none; outline: none; box-shadow: none; }
                .note-header-tools { display: flex; gap: 15px; padding: 15px 30px; border-bottom: 1px solid var(--border); background: var(--bg-secondary); align-items: center; }
                .note-header-tools input[type="text"] { flex: 1; font-size: 20px; font-weight: bold; border: none; background: transparent; padding: 5px; }
                .note-header-tools input[type="text"]:focus { outline: none; border-bottom: 2px solid var(--accent); }
            </style>
            <div class="note-header-tools">
                <input type="text" id="noteTitle" placeholder="Harika bir başlık..." value="${note.title}">
                <div style="display:flex; align-items:center; gap:5px;">
                    <label style="font-size:14px; color:var(--text-secondary);">Renk:</label>
                    <input type="color" id="noteColor" value="${note.color}" style="width:40px; height:30px; padding:0; cursor:pointer; border:none; border-radius:4px;">
                </div>
            </div>
            <textarea id="noteContent" placeholder="Bugün neler oldu? Fikirlerinizi buraya dökün...">${note.content}</textarea>
        `;
        
        window.Ajanda.UI.openModal(id ? 'Notu Düzenle' : 'Yeni Not', html, () => {
            const title = document.getElementById('noteTitle').value.trim();
            const content = document.getElementById('noteContent').value.trim();
            const color = document.getElementById('noteColor').value;
            
            if (!title) return alert("Başlık zorunludur!");
            
            if (id) {
                // Update
                const index = notes.findIndex(n => n.id === id);
                if(index !== -1) {
                    notes[index].title = title;
                    notes[index].content = content;
                    notes[index].color = color;
                    notes[index].updatedAt = Date.now();
                }
            } else {
                // Create
                notes.unshift({
                    id: window.Ajanda.Storage.generateId(),
                    title: title,
                    content: content,
                    color: color,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
            
            window.Ajanda.Storage.set('notes', notes);
            this.render();
        });
    },

    deleteNote(id) {
        if(confirm("Bu notu silmek istediğinize emin misiniz?")) {
            let notes = window.Ajanda.Storage.get('notes', []);
            notes = notes.filter(n => n.id !== id);
            window.Ajanda.Storage.set('notes', notes);
            this.render();
        }
    }
};
