window.Ajanda = window.Ajanda || {};

window.Ajanda.Lists = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderShopping();
        this.renderTodo();
        this.renderEmojiPicker();
    },

    cacheDOM() {
        this.shoppingList = document.getElementById('shoppingList');
        this.todoList = document.getElementById('todoList');
        this.shoppingInput = document.getElementById('shoppingInput');
        this.shoppingColor = document.getElementById('shoppingColor');
        this.shoppingEmoji = document.getElementById('shoppingEmoji');
        this.addShoppingBtn = document.getElementById('shoppingAddBtn');
        
        this.todoInput = document.getElementById('todoInput');
        this.todoPriority = document.getElementById('todoPriority');
        this.todoDueDate = document.getElementById('todoDueDate');
        this.todoColor = document.getElementById('todoColor');
        this.todoEmoji = document.getElementById('todoEmoji');
        this.addTodoBtn = document.getElementById('todoAddBtn');

        this.listTabShopping = document.getElementById('listTabShopping');
        this.listTabTodo = document.getElementById('listTabTodo');
        
        this.shoppingSection = document.getElementById('shoppingArea');
        this.todoSection = document.getElementById('todoArea');
    },

    bindEvents() {
        if(this.listTabShopping) {
            this.listTabShopping.addEventListener('click', () => {
                this.listTabShopping.classList.add('active');
                this.listTabTodo.classList.remove('active');
                this.shoppingSection.style.display = 'block';
                this.todoSection.style.display = 'none';
            });
        }

        if(this.listTabTodo) {
            this.listTabTodo.addEventListener('click', () => {
                this.listTabTodo.classList.add('active');
                this.listTabShopping.classList.remove('active');
                this.todoSection.style.display = 'block';
                this.shoppingSection.style.display = 'none';
            });
        }

        if(this.addShoppingBtn) {
            this.addShoppingBtn.addEventListener('click', () => this.addShopping());
        }

        if(this.addTodoBtn) {
            this.addTodoBtn.addEventListener('click', () => this.addTodo());
        }
    },

    getItems(key) {
        return window.Ajanda.Storage.get(key) || [];
    },

    saveItems(key, items) {
        window.Ajanda.Storage.set(key, items);
    },

    renderShopping() {
        if(!this.shoppingList) return;
        const items = this.getItems('shopping');
        
        items.sort((a, b) => {
            if(a.completed !== b.completed) return a.completed ? 1 : -1;
            return (a.order || 0) - (b.order || 0);
        });

        this.shoppingList.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = `list-item ${item.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.id = item.id;
            
            li.innerHTML = `
                <span class="drag-handle">⣿</span>
                <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="window.Ajanda.Lists.toggleItem('shopping', '${item.id}')">
                <span class="emoji">${item.emoji || ''}</span>
                <span class="text" style="color: ${item.color || '#000'}">${item.text}</span>
                <button class="delete-btn" onclick="window.Ajanda.Lists.deleteItem('shopping', '${item.id}')">🗑️</button>
            `;
            
            this.addDragEvents(li, 'shopping');
            this.shoppingList.appendChild(li);
        });
    },

    renderTodo() {
        if(!this.todoList) return;
        const items = this.getItems('todos');
        
        items.sort((a, b) => {
            if(a.completed !== b.completed) return a.completed ? 1 : -1;
            return (a.order || 0) - (b.order || 0);
        });

        this.todoList.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = `list-item ${item.completed ? 'completed' : ''} priority-${item.priority || 'normal'}`;
            li.draggable = true;
            li.dataset.id = item.id;
            
            let dateHtml = '';
            if(item.dueDate) {
                const isOverdue = !item.completed && item.dueDate < today;
                dateHtml = `<span class="due-date ${isOverdue ? 'overdue' : ''}" style="color:${isOverdue?'red':'inherit'}">${item.dueDate}</span>`;
            }

            let borderStyle = 'border-left: 4px solid gray; padding-left: 5px;';
            if (item.priority === 'onemli') borderStyle = 'border-left: 4px solid orange; padding-left: 5px;';
            else if (item.priority === 'acil') borderStyle = 'border-left: 4px solid red; padding-left: 5px;';
            
            li.style = borderStyle;

            li.innerHTML = `
                <span class="drag-handle">⣿</span>
                <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="window.Ajanda.Lists.toggleItem('todos', '${item.id}')">
                <span class="emoji">${item.emoji || ''}</span>
                <span class="text" style="color: ${item.color || '#000'}">${item.text}</span>
                ${dateHtml}
                <button class="delete-btn" onclick="window.Ajanda.Lists.deleteItem('todos', '${item.id}')">🗑️</button>
            `;
            
            this.addDragEvents(li, 'todos');
            this.todoList.appendChild(li);
        });
    },

    addShopping() {
        if(!this.shoppingInput || !this.shoppingInput.value.trim()) return;
        const items = this.getItems('shopping');
        const newItem = {
            id: window.Ajanda.Storage.generateId(),
            text: this.shoppingInput.value.trim(),
            completed: false,
            emoji: this.shoppingEmoji ? this.shoppingEmoji.value : '',
            color: this.shoppingColor ? this.shoppingColor.value : '#000000',
            order: items.length
        };
        items.push(newItem);
        this.saveItems('shopping', items);
        this.shoppingInput.value = '';
        this.renderShopping();
    },

    addTodo() {
        if(!this.todoInput || !this.todoInput.value.trim()) return;
        const items = this.getItems('todos');
        const newItem = {
            id: window.Ajanda.Storage.generateId(),
            text: this.todoInput.value.trim(),
            completed: false,
            priority: this.todoPriority ? this.todoPriority.value : 'normal',
            dueDate: this.todoDueDate ? this.todoDueDate.value : '',
            emoji: this.todoEmoji ? this.todoEmoji.value : '',
            color: this.todoColor ? this.todoColor.value : '#000000',
            order: items.length
        };
        items.push(newItem);
        this.saveItems('todos', items);
        this.todoInput.value = '';
        if(this.todoDueDate) this.todoDueDate.value = '';
        this.renderTodo();
    },

    toggleItem(storageKey, id) {
        const items = this.getItems(storageKey);
        const item = items.find(i => i.id === id);
        if(item) {
            item.completed = !item.completed;
            this.saveItems(storageKey, items);
            if(storageKey === 'shopping') this.renderShopping();
            else this.renderTodo();
        }
    },

    deleteItem(storageKey, id) {
        let items = this.getItems(storageKey);
        items = items.filter(i => i.id !== id);
        this.saveItems(storageKey, items);
        if(storageKey === 'shopping') this.renderShopping();
        else this.renderTodo();
    },

    addDragEvents(el, storageKey) {
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            setTimeout(() => el.classList.add('dragging'), 0);
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            this.updateOrder(storageKey);
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            const list = el.parentNode;
            const draggingEl = list.querySelector('.dragging');
            if(!draggingEl) return;
            const afterElement = this.getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggingEl);
            } else {
                list.insertBefore(draggingEl, afterElement);
            }
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.list-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    updateOrder(storageKey) {
        const listEl = storageKey === 'shopping' ? this.shoppingList : this.todoList;
        if(!listEl) return;
        const currentIds = [...listEl.querySelectorAll('.list-item')].map(li => li.dataset.id);
        const items = this.getItems(storageKey);
        
        currentIds.forEach((id, index) => {
            const item = items.find(i => i.id === id);
            if(item) item.order = index;
        });
        
        this.saveItems(storageKey, items);
    },

    renderEmojiPicker() {
        const emojis = ['🛒', '📦', '🎁', '💊', '🥛', '🍞', '🧹', '📱', '💡', '⭐'];
        ['shoppingEmojiPicker', 'todoEmojiPicker'].forEach(pickerId => {
            const picker = document.getElementById(pickerId);
            if(picker) {
                picker.innerHTML = emojis.map(e => `<button type="button" class="emoji-btn" style="cursor:pointer; margin:2px;">${e}</button>`).join('');
                picker.addEventListener('click', (e) => {
                    if(e.target.classList.contains('emoji-btn')) {
                        const targetInput = pickerId === 'shoppingEmojiPicker' ? this.shoppingEmoji : this.todoEmoji;
                        if(targetInput) targetInput.value = e.target.textContent;
                    }
                });
            }
        });
    }
};
