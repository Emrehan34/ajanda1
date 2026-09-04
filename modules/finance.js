window.Ajanda = window.Ajanda || {};

const DEFAULT_CATEGORIES = {
    gelir: ['Maaş', 'Ek Gelir', 'Burs', 'Hediye', 'Diğer'],
    gider: ['Market', 'Fatura', 'Ulaşım', 'Yemek', 'Eğlence', 'Giyim', 'Sağlık', 'Eğitim', 'Kira', 'Diğer']
};

window.Ajanda.Finance = {
    init() {
        const typeSelect = document.getElementById('financeType');
        const form = document.getElementById('financeForm');
        
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.updateCategoryOptions());
            this.updateCategoryOptions(); // Initial load
        }
        
        const dateInput = document.getElementById('financeDate');
        if (dateInput) {
            const today = new Date();
            dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        
        const btn = document.getElementById('financeAddBtn');
        if (btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.addEntry();
        });
        
        this.render();
    },
    
    updateCategoryOptions() {
        // In HTML, financeCategory is an input text, not a select.
        // We will just leave it as text input for now.
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    },
    
    render() {
        window.Ajanda.state = window.Ajanda.state || {};
        const month = window.Ajanda.state.currentMonth !== undefined ? window.Ajanda.state.currentMonth : new Date().getMonth();
        const year = window.Ajanda.state.currentYear || new Date().getFullYear();
        
        const allEntries = window.Ajanda.Storage.get('finance', []);
        
        const currentEntries = allEntries.filter(e => e.month === month + 1 && e.year === year)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        let totalGelir = 0;
        let totalGider = 0;
        
        currentEntries.forEach(e => {
            if (e.type === 'gelir') totalGelir += Number(e.amount);
            else if (e.type === 'gider') totalGider += Number(e.amount);
        });
        
        const kalan = totalGelir - totalGider;
        
        // Geçmiş ayların net bakiyesi (devreden)
        let oncekiAylarBakiye = 0;
        allEntries.forEach(e => {
            const isPast = e.year < year || (e.year === year && e.month < month + 1);
            if(isPast) {
                if(e.type === 'gelir') oncekiAylarBakiye += Number(e.amount);
                else if(e.type === 'gider') oncekiAylarBakiye -= Number(e.amount);
            }
        });

        // Kredi Kartı Borçları (Global)
        const creditCards = window.Ajanda.Storage.get('credit_cards', []);
        let totalDebt = 0;
        creditCards.forEach(cc => { if(!cc.paid) totalDebt += Number(cc.amount); });

        // Update summary
        const summaryEl = document.getElementById('financeSummary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background:var(--bg-secondary); padding:20px; border-radius:12px; border-bottom:4px solid var(--success);">
                        <div style="font-size:14px; color:var(--text-secondary);">Bu Ay Gelir</div>
                        <div style="font-size:24px; font-weight:bold; color:var(--success);">${this.formatCurrency(totalGelir)}</div>
                    </div>
                    <div style="background:var(--bg-secondary); padding:20px; border-radius:12px; border-bottom:4px solid var(--danger);">
                        <div style="font-size:14px; color:var(--text-secondary);">Bu Ay Gider</div>
                        <div style="font-size:24px; font-weight:bold; color:var(--danger);">${this.formatCurrency(totalGider)}</div>
                    </div>
                    <div style="background:var(--bg-secondary); padding:20px; border-radius:12px; border-bottom:4px solid ${kalan >= 0 ? 'var(--info)' : 'var(--danger)'};">
                        <div style="font-size:14px; color:var(--text-secondary);">Bu Ay Kalan</div>
                        <div style="font-size:24px; font-weight:bold;">${this.formatCurrency(kalan)}</div>
                    </div>
                    <div style="background:var(--bg-secondary); padding:20px; border-radius:12px; border-bottom:4px solid var(--warning); position:relative;">
                        <button onclick="window.Ajanda.Finance.showCCModal()" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:16px; cursor:pointer;" title="Kredi Kartı Düzenle">⚙️</button>
                        <div style="font-size:14px; color:var(--text-secondary);">💳 Toplam K.K. Borcu</div>
                        <div style="font-size:24px; font-weight:bold; color:var(--warning);">${this.formatCurrency(totalDebt)}</div>
                    </div>
                </div>
                <div style="background:var(--page-bg); padding:10px; border-radius:8px; border:1px dashed var(--border); margin-bottom:20px; text-align:center;">
                    🔄 Geçmiş aylardan devreden bakiye: <strong>${this.formatCurrency(oncekiAylarBakiye)}</strong> | 
                    Genel Net Durum: <strong>${this.formatCurrency(oncekiAylarBakiye + kalan - totalDebt)}</strong>
                </div>
            `;
        }
        
        // Update table
        const tableBody = document.getElementById('financeTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            currentEntries.forEach(e => {
                const tr = document.createElement('tr');
                const isGelir = e.type === 'gelir';
                tr.innerHTML = `
                    <td style="padding:10px 5px;">${e.date}</td>
                    <td style="padding:10px 5px;"><span style="background:var(--bg-secondary); color:${isGelir ? 'var(--success)' : 'var(--danger)'}; padding:2px 8px; border-radius:12px; font-size:0.8em; font-weight:bold;">${isGelir ? 'Gelir' : 'Gider'}</span></td>
                    <td style="padding:10px 5px;">${e.category}</td>
                    <td style="padding:10px 5px;">${e.description || '-'}</td>
                    <td style="padding:10px 5px; color:${isGelir ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${isGelir ? '+' : '-'}${this.formatCurrency(e.amount)}</td>
                    <td style="padding:10px 5px;"><button onclick="window.Ajanda.Finance.deleteEntry('${e.id}')" style="color:var(--danger); background:none; border:none; cursor:pointer; padding:5px;">🗑️ Sil</button></td>
                `;
                tableBody.appendChild(tr);
            });
        }
        
        this.renderChart(totalGelir, totalGider);
    },
    
    renderChart(gelir, gider) {
        const canvas = document.getElementById('financeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        const max = Math.max(gelir, gider, 1); 
        const maxBarHeight = h - 40; 
        
        const gelirHeight = (gelir / max) * maxBarHeight;
        const giderHeight = (gider / max) * maxBarHeight;
        
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(w * 0.2, h - 20 - gelirHeight, w * 0.2, gelirHeight);
        
        ctx.fillStyle = '#f44336';
        ctx.fillRect(w * 0.6, h - 20 - giderHeight, w * 0.2, giderHeight);
        
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
        ctx.textAlign = 'center';
        ctx.fillText('Gelir', w * 0.3, h - 5);
        ctx.fillText('Gider', w * 0.7, h - 5);
    },
    
    showCCModal() {
        const creditCards = window.Ajanda.Storage.get('credit_cards', []);
        let listHtml = '';
        if(creditCards.length === 0) {
            listHtml = '<p style="color:var(--text-secondary); text-align:center;">Henüz kayıtlı kredi kartı borcu yok.</p>';
        } else {
            listHtml = '<ul style="list-style:none; padding:0; max-height:200px; overflow-y:auto; margin-bottom:15px;">';
            creditCards.forEach(cc => {
                listHtml += `
                    <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid var(--border); ${cc.paid ? 'opacity:0.5; text-decoration:line-through;' : ''}">
                        <div>
                            <strong>${cc.bank}</strong> <br>
                            <small>${cc.desc}</small>
                        </div>
                        <div style="text-align:right;">
                            <strong style="color:var(--warning);">${this.formatCurrency(cc.amount)}</strong><br>
                            <button onclick="window.Ajanda.Finance.toggleCCPaid('${cc.id}')" class="btn ${cc.paid ? 'btn-secondary' : 'btn-primary'}" style="padding:2px 8px; font-size:12px;">${cc.paid ? 'Geri Al' : 'Ödendi İşaretle'}</button>
                            <button onclick="window.Ajanda.Finance.deleteCCDebt('${cc.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">❌</button>
                        </div>
                    </li>
                `;
            });
            listHtml += '</ul>';
        }

        const html = `
            ${listHtml}
            <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
                <h4 style="margin-top:0;">Yeni Borç Ekle</h4>
                <input type="text" id="ccBank" placeholder="Banka/Kart Adı" class="form-control" style="width:100%; margin-bottom:10px;">
                <input type="text" id="ccDesc" placeholder="Açıklama (Örn: Taksit 1/3)" class="form-control" style="width:100%; margin-bottom:10px;">
                <input type="number" id="ccAmount" placeholder="Tutar" class="form-control" style="width:100%;">
            </div>
        `;
        
        window.Ajanda.UI.openModal('💳 Kredi Kartı Borçları', html, () => {
            const bank = document.getElementById('ccBank').value;
            const desc = document.getElementById('ccDesc').value;
            const amount = document.getElementById('ccAmount').value;
            
            if (bank && amount) {
                creditCards.push({
                    id: window.Ajanda.Storage.generateId(),
                    bank: bank,
                    desc: desc,
                    amount: amount,
                    paid: false,
                    dateAdded: new Date().toISOString()
                });
                window.Ajanda.Storage.set('credit_cards', creditCards);
                this.render();
                setTimeout(() => this.showCCModal(), 100);
            } else {
                window.Ajanda.UI.closeModal();
            }
        });
    },

    toggleCCPaid(id) {
        const creditCards = window.Ajanda.Storage.get('credit_cards', []);
        const cc = creditCards.find(c => c.id === id);
        if(cc) {
            cc.paid = !cc.paid;
            window.Ajanda.Storage.set('credit_cards', creditCards);
            this.render();
            this.showCCModal();
        }
    },

    deleteCCDebt(id) {
        if(!confirm('Bu borç kaydını silmek istiyor musunuz?')) return;
        let creditCards = window.Ajanda.Storage.get('credit_cards', []);
        creditCards = creditCards.filter(c => c.id !== id);
        window.Ajanda.Storage.set('credit_cards', creditCards);
        this.render();
        this.showCCModal();
    },

    addEntry() {
        const type = document.getElementById('financeType').value;
        const category = document.getElementById('financeCategory').value;
        const amountStr = document.getElementById('financeAmount').value;
        const description = document.getElementById('financeDesc') ? document.getElementById('financeDesc').value : '';
        const dateStr = document.getElementById('financeDate').value;
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert("Lütfen geçerli bir tutar girin.");
            return;
        }
        if (!dateStr) {
            alert("Lütfen tarih seçin.");
            return;
        }
        
        const dObj = new Date(dateStr);
        
        const entries = window.Ajanda.Storage.get('finance', []);
        entries.push({
            id: window.Ajanda.Storage.generateId(),
            type,
            category,
            amount,
            description,
            date: dateStr,
            month: dObj.getMonth() + 1,
            year: dObj.getFullYear()
        });
        
        window.Ajanda.Storage.set('finance', entries);
        
        // Reset form
        document.getElementById('financeAmount').value = '';
        if(document.getElementById('financeDesc')) document.getElementById('financeDesc').value = '';
        
        this.render();
    },
    
    deleteEntry(id) {
        if(confirm("Silmek istediğinize emin misiniz?")) {
            let entries = window.Ajanda.Storage.get('finance', []);
            entries = entries.filter(e => e.id !== id);
            window.Ajanda.Storage.set('finance', entries);
            this.render();
        }
    }
};
