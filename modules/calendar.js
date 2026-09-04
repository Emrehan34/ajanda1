window.Ajanda = window.Ajanda || {};

// Shared UI helpers
window.Ajanda.UI = {
    openModal(title, bodyHtml, onSave) {
        const titleEl = document.getElementById('modalTitle');
        const bodyEl = document.getElementById('modalBody');
        const footerEl = document.getElementById('modalFooter');
        const overlayEl = document.getElementById('modalOverlay');
        
        if(titleEl) titleEl.textContent = title;
        if(bodyEl) bodyEl.innerHTML = bodyHtml;
        if(footerEl) {
            footerEl.innerHTML = `
                <button class="btn" id="modalCancelBtn">İptal</button>
                <button class="btn btn-primary" id="modalSaveBtn">Kaydet</button>
            `;
            document.getElementById('modalCancelBtn').onclick = this.closeModal;
            document.getElementById('modalSaveBtn').onclick = onSave;
        }
        if(overlayEl) overlayEl.classList.add('active');
    },
    closeModal() {
        const overlayEl = document.getElementById('modalOverlay');
        if(overlayEl) overlayEl.classList.remove('active');
    }
};

const HOLIDAYS = {
    '2026-01-01': 'Yılbaşı',
    '2026-03-28': 'Ramazan Bayramı 1. Gün',
    '2026-03-29': 'Ramazan Bayramı 2. Gün',
    '2026-03-30': 'Ramazan Bayramı 3. Gün',
    '2026-04-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
    '2026-05-01': 'Emek ve Dayanışma Günü',
    '2026-05-19': 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    '2026-06-04': 'Kurban Bayramı 1. Gün',
    '2026-06-05': 'Kurban Bayramı 2. Gün',
    '2026-06-06': 'Kurban Bayramı 3. Gün',
    '2026-06-07': 'Kurban Bayramı 4. Gün',
    '2026-07-15': 'Demokrasi ve Milli Birlik Günü',
    '2026-08-30': 'Zafer Bayramı',
    '2026-10-29': 'Cumhuriyet Bayramı',
};

window.Ajanda.Calendar = {
    selectedDate: null,
    
    init() {
        // App.js should set window.Ajanda.state.currentMonth and currentYear
        const today = new Date();
        window.Ajanda.state = window.Ajanda.state || {};
        window.Ajanda.state.currentMonth = window.Ajanda.state.currentMonth !== undefined ? window.Ajanda.state.currentMonth : today.getMonth();
        window.Ajanda.state.currentYear = window.Ajanda.state.currentYear || today.getFullYear();
        
        // Setup close modal behavior if needed globally
        const closeBtn = document.getElementById('modalClose');
        if(closeBtn) closeBtn.onclick = () => window.Ajanda.UI.closeModal();
        
        // Takvim sayfasındaki varsayılan butonlara işlev ekle
        const addEventBtn = document.getElementById('addEventBtn');
        if(addEventBtn) addEventBtn.onclick = () => this.showAddEventModal();
        
        const addBirthdayBtn = document.getElementById('addBirthdayBtn');
        if(addBirthdayBtn) addBirthdayBtn.onclick = () => this.showAddBirthdayModal();
        
        this.render();
    },

    render() {
        const month = window.Ajanda.state.currentMonth;
        const year = window.Ajanda.state.currentYear;
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 0 = Sunday, 1 = Monday. Convert so Monday is 0.
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const events = window.Ajanda.Storage.get('events', []);
        const birthdays = window.Ajanda.Storage.get('birthdays', []);
        
        // Render previous month trailing days
        for (let i = startDay - 1; i >= 0; i--) {
            const d = prevMonthLastDay - i;
            const cell = this.createDayCell(d, 'other-month');
            grid.appendChild(cell);
        }
        
        // Render current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const cell = this.createDayCell(i, 'current-month', dateStr);
            
            if (dateStr === todayStr) cell.classList.add('today');
            if (dateStr === this.selectedDate) cell.classList.add('selected');
            
            if (HOLIDAYS[dateStr]) {
                cell.classList.add('holiday');
                cell.title = HOLIDAYS[dateStr];
            }
            
            const hasBday = birthdays.some(b => b.month === month + 1 && b.day === i);
            if (hasBday) {
                cell.classList.add('birthday');
                cell.innerHTML += '<span class="bday-icon">🎂</span>';
            }
            
            const hasEvent = events.some(e => e.date === dateStr);
            if (hasEvent) {
                cell.classList.add('has-event');
                cell.innerHTML += '<span class="event-dot"></span>';
            }
            
            grid.appendChild(cell);
        }
        
        // Render next month leading days
        const totalCells = startDay + lastDay.getDate();
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            const cell = this.createDayCell(i, 'other-month');
            grid.appendChild(cell);
        }
    },
    
    createDayCell(dayNum, className, dateStr = null) {
        const cell = document.createElement('div');
        cell.className = `calendar-day ${className}`;
        cell.textContent = dayNum;
        
        if (dateStr) {
            cell.onclick = () => this.selectDay(dateStr);
        }
        return cell;
    },
    
    selectDay(dateStr) {
        this.selectedDate = dateStr;
        this.render();
        this.renderDayDetail();
    },
    
    renderDayDetail() {
        const detailContainer = document.getElementById('dayDetail');
        if (!detailContainer) return;
        
        if (!this.selectedDate) {
            detailContainer.innerHTML = '<p>Lütfen bir gün seçin.</p>';
            return;
        }
        
        let html = `<h3>${this.selectedDate} Detayları</h3>`;
        
        if (HOLIDAYS[this.selectedDate]) {
            html += `<div class="holiday-detail" style="color:red; margin-bottom: 10px;">🎉 ${HOLIDAYS[this.selectedDate]}</div>`;
        }
        
        const [y, m, d] = this.selectedDate.split('-').map(Number);
        const birthdays = window.Ajanda.Storage.get('birthdays', []).filter(b => b.month === m && b.day === d);
        
        birthdays.forEach(b => {
            html += `<div class="birthday-detail" style="color:pink; margin-bottom: 10px;">${b.emoji || '🎂'} ${b.name} Doğum Günü!</div>`;
        });
        
        const events = window.Ajanda.Storage.get('events', [])
            .filter(e => e.date === this.selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time));
            
        if (events.length === 0) {
            html += '<p>Etkinlik yok.</p>';
        } else {
            html += '<ul class="event-list" style="list-style:none; padding:0;">';
            events.forEach(e => {
                html += `
                    <li style="border-left: 4px solid ${e.color || '#ccc'}; margin-bottom: 5px; padding-left: 10px; display:flex; justify-content:space-between;">
                        <span><strong>${e.time}</strong> ${e.emoji || ''} ${e.title}</span>
                        <button onclick="window.Ajanda.Calendar.deleteEvent('${e.id}')" style="color:red; background:none; border:none; cursor:pointer;">Sil</button>
                    </li>
                `;
            });
            html += '</ul>';
        }
        
        html += `<div style="margin-top: 15px;">
            <button onclick="window.Ajanda.Calendar.showAddEventModal()" class="btn btn-primary">Etkinlik Ekle</button>
            <button onclick="window.Ajanda.Calendar.showAddBirthdayModal()" class="btn">Doğum Günü Ekle</button>
        </div>`;
        
        detailContainer.innerHTML = html;
    },
    
    showAddEventModal() {
        if (!this.selectedDate) return alert("Önce bir gün seçin!");
        
        const html = `
            <div class="form-group">
                <label>Başlık:</label>
                <input type="text" id="eventTitle" class="form-control">
            </div>
            <div class="form-group">
                <label>Saat:</label>
                <input type="time" id="eventTime" class="form-control">
            </div>
            <div class="form-group">
                <label>Açıklama:</label>
                <textarea id="eventDesc" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>Renk:</label>
                <select id="eventColor" class="form-control">
                    <option value="red">Kırmızı</option>
                    <option value="blue">Mavi</option>
                    <option value="green">Yeşil</option>
                    <option value="yellow">Sarı</option>
                    <option value="purple">Mor</option>
                </select>
            </div>
            <div class="form-group">
                <label>Emoji:</label>
                <input type="text" id="eventEmoji" class="form-control" maxlength="2">
            </div>
        `;
        
        window.Ajanda.UI.openModal('Yeni Etkinlik', html, () => {
            const title = document.getElementById('eventTitle').value;
            const time = document.getElementById('eventTime').value;
            if (!title || !time) return alert("Başlık ve Saat zorunludur!");
            
            const events = window.Ajanda.Storage.get('events', []);
            events.push({
                id: window.Ajanda.Storage.generateId(),
                date: this.selectedDate,
                time: time,
                title: title,
                description: document.getElementById('eventDesc').value,
                color: document.getElementById('eventColor').value,
                emoji: document.getElementById('eventEmoji').value
            });
            window.Ajanda.Storage.set('events', events);
            window.Ajanda.UI.closeModal();
            this.render();
            this.renderDayDetail();
        });
    },
    
    showAddBirthdayModal() {
        if (!this.selectedDate) return;
        const [y, m, d] = this.selectedDate.split('-').map(Number);
        
        const html = `
            <div class="form-group">
                <label>Kişi Adı:</label>
                <input type="text" id="bdayName" class="form-control">
            </div>
            <div class="form-group">
                <label>Gün:</label>
                <input type="number" id="bdayDay" value="${d}" min="1" max="31" class="form-control">
            </div>
            <div class="form-group">
                <label>Ay:</label>
                <input type="number" id="bdayMonth" value="${m}" min="1" max="12" class="form-control">
            </div>
            <div class="form-group">
                <label>Emoji:</label>
                <input type="text" id="bdayEmoji" value="🎂" class="form-control" maxlength="2">
            </div>
        `;
        
        window.Ajanda.UI.openModal('Yeni Doğum Günü', html, () => {
            const name = document.getElementById('bdayName').value;
            const day = parseInt(document.getElementById('bdayDay').value);
            const month = parseInt(document.getElementById('bdayMonth').value);
            
            if (!name) return alert("Ad zorunludur!");
            
            const birthdays = window.Ajanda.Storage.get('birthdays', []);
            birthdays.push({
                id: window.Ajanda.Storage.generateId(),
                name: name,
                day: day,
                month: month,
                emoji: document.getElementById('bdayEmoji').value || '🎂'
            });
            window.Ajanda.Storage.set('birthdays', birthdays);
            window.Ajanda.UI.closeModal();
            this.render();
            this.renderDayDetail();
        });
    },
    
    deleteEvent(id) {
        if(confirm("Silmek istediğinize emin misiniz?")) {
            let events = window.Ajanda.Storage.get('events', []);
            events = events.filter(e => e.id !== id);
            window.Ajanda.Storage.set('events', events);
            this.render();
            this.renderDayDetail();
        }
    }
};
