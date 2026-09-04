window.Ajanda = window.Ajanda || {};
window.Ajanda.Daily = {
    selectedDate: null,
    
    init() {
        const datePicker = document.getElementById('dailyDatePicker');
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        
        const today = new Date();
        this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (datePicker) {
            datePicker.value = this.selectedDate;
            datePicker.addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.render();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.changeDay(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.changeDay(1));
        }

        const addBtn = document.getElementById('dailyAddBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addItem(9)); // Default to 09:00
        }
        
        this.render();
    },
    
    changeDay(offset) {
        const d = new Date(this.selectedDate);
        d.setDate(d.getDate() + offset);
        this.selectedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const datePicker = document.getElementById('dailyDatePicker');
        if (datePicker) datePicker.value = this.selectedDate;
        
        this.render();
    },
    
    render() {
        const container = document.getElementById('dailyTimeline');
        const summary = document.getElementById('dailySummary');
        if (!container) return;
        
        container.innerHTML = '';
        
        const allItems = window.Ajanda.Storage.get('daily', []);
        
        // Filter items for selected date (including recurring)
        const dObj = new Date(this.selectedDate);
        const dayOfWeek = dObj.getDay();
        
        const dayItems = allItems.filter(item => {
            if (item.date === this.selectedDate) return true;
            if (item.recurring === 'daily') {
                return new Date(item.date) <= dObj;
            }
            if (item.recurring === 'weekly') {
                return new Date(item.date) <= dObj && new Date(item.date).getDay() === dayOfWeek;
            }
            return false;
        });
        
        const completedCount = dayItems.filter(i => i.completed).length;
        if(summary) summary.textContent = `${completedCount}/${dayItems.length} görev tamamlandı`;
        
        for (let hour = 6; hour <= 23; hour++) {
            const hourItems = dayItems.filter(i => parseInt(i.hour) === hour);
            
            const row = document.createElement('div');
            row.className = 'timeline-row';
            row.style = 'display:flex; border-bottom:1px solid #eee; padding:10px 0; min-height:50px;';
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.style = 'width:60px; font-weight:bold; color:var(--text-secondary);';
            timeLabel.textContent = `${String(hour).padStart(2, '0')}:00`;
            row.appendChild(timeLabel);
            
            const content = document.createElement('div');
            content.className = 'timeline-content';
            content.style = 'flex-grow:1; display:flex; flex-direction:column; gap:5px;';
            
            if (hourItems.length === 0) {
                row.style.cursor = 'pointer';
                row.onclick = () => this.addItem(hour);
            } else {
                hourItems.forEach(item => {
                    const card = document.createElement('div');
                    card.style = `border-left: 4px solid ${item.color || 'var(--border)'}; padding:10px; background:var(--bg-secondary); display:flex; align-items:center; justify-content:space-between; border-radius:4px; opacity: ${item.completed ? '0.6' : '1'}`;
                    
                    card.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="window.Ajanda.Daily.toggleComplete('${item.id}')">
                            <span style="text-decoration: ${item.completed ? 'line-through' : 'none'};">
                                ${item.emoji || ''} <strong>${item.title}</strong>
                            </span>
                        </div>
                        <button onclick="window.Ajanda.Daily.deleteItem('${item.id}')" style="color:red; background:none; border:none; cursor:pointer;">Sil</button>
                    `;
                    content.appendChild(card);
                });
            }
            
            row.appendChild(content);
            container.appendChild(row);
        }
    },
    
    addItem(hour) {
        const html = `
            <div class="form-group">
                <label>Başlık:</label>
                <input type="text" id="dailyTitle" class="form-control">
            </div>
            <div class="form-group">
                <label>Açıklama:</label>
                <textarea id="dailyDesc" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>Renk:</label>
                <select id="dailyColor" class="form-control">
                    <option value="blue">Mavi</option>
                    <option value="red">Kırmızı</option>
                    <option value="green">Yeşil</option>
                    <option value="yellow">Sarı</option>
                    <option value="purple">Mor</option>
                </select>
            </div>
            <div class="form-group">
                <label>Emoji:</label>
                <input type="text" id="dailyEmoji" class="form-control" maxlength="2">
            </div>
            <div class="form-group">
                <label>Tekrar:</label>
                <select id="dailyRecurring" class="form-control">
                    <option value="none">Tekrar Yok</option>
                    <option value="daily">Her Gün</option>
                    <option value="weekly">Her Hafta</option>
                </select>
            </div>
        `;
        
        window.Ajanda.UI.openModal(`${String(hour).padStart(2, '0')}:00 İçin Yeni Görev`, html, () => {
            const title = document.getElementById('dailyTitle').value;
            if (!title) return alert("Başlık zorunludur!");
            
            const items = window.Ajanda.Storage.get('daily', []);
            items.push({
                id: window.Ajanda.Storage.generateId(),
                date: this.selectedDate,
                hour: hour,
                title: title,
                description: document.getElementById('dailyDesc').value,
                color: document.getElementById('dailyColor').value,
                emoji: document.getElementById('dailyEmoji').value,
                completed: false,
                recurring: document.getElementById('dailyRecurring').value
            });
            window.Ajanda.Storage.set('daily', items);
            window.Ajanda.UI.closeModal();
            this.render();
        });
    },
    
    toggleComplete(id) {
        const items = window.Ajanda.Storage.get('daily', []);
        const item = items.find(i => i.id === id);
        if (item) {
            item.completed = !item.completed;
            window.Ajanda.Storage.set('daily', items);
            this.render();
        }
    },
    
    deleteItem(id) {
        if (confirm("Görevi silmek istediğinize emin misiniz?")) {
            let items = window.Ajanda.Storage.get('daily', []);
            items = items.filter(i => i.id !== id);
            window.Ajanda.Storage.set('daily', items);
            this.render();
        }
    }
};
