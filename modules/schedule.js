window.Ajanda = window.Ajanda || {};

window.Ajanda.Schedule = {
    days: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'],
    
    init() {
        this.ensureDefaultSchedule();
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        this.scheduleSelector = document.getElementById('scheduleProgramSelect');
        this.scheduleGrid = document.getElementById('scheduleGrid');
        this.addProgramBtn = document.getElementById('scheduleAddProgramBtn');
        this.addTimeSlotBtn = document.getElementById('scheduleAddSlotBtn');
    },

    bindEvents() {
        if(this.scheduleSelector) {
            this.scheduleSelector.addEventListener('change', (e) => {
                window.Ajanda.Storage.set('schedule_active', e.target.value);
                this.render();
            });
        }
        
        if(this.addProgramBtn) {
            this.addProgramBtn.addEventListener('click', () => this.addProgram());
        }

        if(this.addTimeSlotBtn) {
            this.addTimeSlotBtn.addEventListener('click', () => this.addTimeSlot());
        }
    },

    getSchedules() {
        return window.Ajanda.Storage.get('schedules') || [];
    },

    saveSchedules(schedules) {
        window.Ajanda.Storage.set('schedules', schedules);
    },

    getActiveScheduleId() {
        let activeId = window.Ajanda.Storage.get('schedule_active');
        const schedules = this.getSchedules();
        if (!activeId && schedules.length > 0) {
            activeId = schedules[0].id;
            window.Ajanda.Storage.set('schedule_active', activeId);
        }
        return activeId;
    },

    getActiveSchedule() {
        const schedules = this.getSchedules();
        return schedules.find(s => s.id === this.getActiveScheduleId());
    },

    ensureDefaultSchedule() {
        let schedules = this.getSchedules();
        if (schedules.length === 0) {
            const defaultSchedule = {
                id: window.Ajanda.Storage.generateId(),
                name: 'Ders Programı',
                timeSlots: 8, // 8 hours default
                slots: []
            };
            schedules.push(defaultSchedule);
            this.saveSchedules(schedules);
            window.Ajanda.Storage.set('schedule_active', defaultSchedule.id);
        }
    },

    formatTime(hourIndex) {
        const startHour = 8 + Math.floor((hourIndex * 60) / 60);
        const startMin = (hourIndex * 60) % 60;
        const endHour = 8 + Math.floor(((hourIndex * 60) + 45) / 60);
        const endMin = ((hourIndex * 60) + 45) % 60;
        
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(startHour)}:${pad(startMin)} - ${pad(endHour)}:${pad(endMin)}`;
    },

    render() {
        if(!this.scheduleSelector || !this.scheduleGrid) return;
        
        const schedules = this.getSchedules();
        const activeId = this.getActiveScheduleId();
        const activeSchedule = this.getActiveSchedule();

        this.scheduleSelector.innerHTML = schedules.map(s => 
            `<option value="${s.id}" ${s.id === activeId ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        if (!activeSchedule) return;

        let tableHtml = `<table class="schedule-table"><thead><tr><th>Saat</th>`;
        this.days.forEach(day => tableHtml += `<th>${day}</th>`);
        tableHtml += `</tr></thead><tbody>`;

        const timeSlots = activeSchedule.timeSlots || 8;

        for (let hour = 0; hour < timeSlots; hour++) {
            tableHtml += `<tr><td class="time-cell">${this.formatTime(hour)}</td>`;
            for (let day = 0; day < 5; day++) {
                const slot = activeSchedule.slots.find(s => s.day === day && s.hour === hour);
                if (slot) {
                    tableHtml += `
                        <td class="slot-cell filled" 
                            style="background-color: ${slot.color || '#e0f7fa'}" 
                            onclick="window.Ajanda.Schedule.showCellModal(${day}, ${hour})">
                            <div class="subject">${slot.subject}</div>
                            <div class="details">${slot.teacher || ''} <br> ${slot.room || ''}</div>
                        </td>
                    `;
                } else {
                    tableHtml += `
                        <td class="slot-cell empty" onclick="window.Ajanda.Schedule.showCellModal(${day}, ${hour})">
                            <span class="hover-plus">+</span>
                        </td>
                    `;
                }
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table>`;
        
        this.scheduleGrid.innerHTML = tableHtml;
    },

    showCellModal(day, hour) {
        const activeSchedule = this.getActiveSchedule();
        const slot = activeSchedule.slots.find(s => s.day === day && s.hour === hour) || { subject: '', teacher: '', room: '', color: '#e0f7fa' };

        const bodyHtml = `
            <div class="form-group">
                <label>Ders Adı</label>
                <input type="text" id="slotSubject" value="${slot.subject}">
            </div>
            <div class="form-group">
                <label>Öğretmen</label>
                <input type="text" id="slotTeacher" value="${slot.teacher}">
            </div>
            <div class="form-group">
                <label>Sınıf/Oda</label>
                <input type="text" id="slotRoom" value="${slot.room}">
            </div>
            <div class="form-group">
                <label>Renk</label>
                <input type="color" id="slotColor" value="${slot.color}">
            </div>
            ${slot.subject ? '<button id="deleteSlotBtn" style="color:red; margin-top:10px;">Sil</button>' : ''}
        `;

        window.Ajanda.UI.openModal('Ders Düzenle', bodyHtml, () => {
            const subject = document.getElementById('slotSubject').value.trim();
            const teacher = document.getElementById('slotTeacher').value.trim();
            const room = document.getElementById('slotRoom').value.trim();
            const color = document.getElementById('slotColor').value;

            let schedules = this.getSchedules();
            let sched = schedules.find(s => s.id === activeSchedule.id);
            
            sched.slots = sched.slots.filter(s => !(s.day === day && s.hour === hour));
            
            if (subject) {
                sched.slots.push({ day, hour, subject, teacher, room, color });
            }
            
            this.saveSchedules(schedules);
            this.render();
        });

        const delBtn = document.getElementById('deleteSlotBtn');
        if(delBtn) {
            delBtn.addEventListener('click', () => {
                let schedules = this.getSchedules();
                let sched = schedules.find(s => s.id === activeSchedule.id);
                sched.slots = sched.slots.filter(s => !(s.day === day && s.hour === hour));
                this.saveSchedules(schedules);
                window.Ajanda.UI.closeModal();
                this.render();
            });
        }
    },

    addProgram() {
        const name = prompt('Yeni program adı:');
        if (name && name.trim()) {
            const schedules = this.getSchedules();
            const newSchedule = {
                id: window.Ajanda.Storage.generateId(),
                name: name.trim(),
                timeSlots: 8,
                slots: []
            };
            schedules.push(newSchedule);
            this.saveSchedules(schedules);
            window.Ajanda.Storage.set('schedule_active', newSchedule.id);
            this.render();
        }
    },

    addTimeSlot() {
        const schedules = this.getSchedules();
        let sched = schedules.find(s => s.id === this.getActiveScheduleId());
        if (sched) {
            sched.timeSlots = (sched.timeSlots || 8) + 1;
            this.saveSchedules(schedules);
            this.render();
        }
    }
};
