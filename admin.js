document.addEventListener('DOMContentLoaded', () => {
    // Показ уведомлений
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Загрузка меню
    let isMenuLoading = false;
    let loadedImages = new Set(); // Трекер загруженных изображений

async function loadMenu() {
    if (isMenuLoading) return;
    isMenuLoading = true;
    
    try {
        console.log('Загрузка menu.json...');
        const response = await fetch('php/menu.json?nocache=' + Date.now());
        if (!response.ok) throw new Error('Ошибка загрузки');
        const menu = await response.json();
        renderMenu(menu);
    } catch (error) {
        console.error('Error:', error);
        renderMenu({ drinks: [], food: [] });
    } finally {
        isMenuLoading = false;
    }
}

function loadImageWithFallback(imgElement, url) {
    if (!url || loadedImages.has(url)) return;
    
    loadedImages.add(url);
    imgElement.onerror = null; // Сбрасываем старые обработчики
    
    // Проверяем, не плейсхолдер ли это
    if (url.includes('via.placeholder.com')) {
        imgElement.src = url;
        return;
    }
    
    // Создаем тестовый image для проверки
    const tester = new Image();
    tester.onload = function() {
        imgElement.src = url;
    };
    tester.onerror = function() {
        imgElement.src = 'https://via.placeholder.com/300x200?text=Ошибка+загрузки';
    };
    tester.src = url;
}

    // Отображение меню
function renderMenu(menu) {
    console.log('Рендерим меню:', menu); // Логирование
    const container = document.getElementById('menu-container');
    if (!container) {
        console.error('Контейнер меню не найден!');
        return;
    }
    
    // Полная очистка контейнера
    container.innerHTML = `
        <h2>Напитки</h2>
        <div class="admin-menu-grid" id="drinks-container"></div>
        <button class="btn add-item-btn" onclick="window.addNewItem('drinks')">
            + Добавить напиток
        </button>
        
        <h2>Еда</h2>
        <div class="admin-menu-grid" id="food-container"></div>
        <button class="btn add-item-btn" onclick="window.addNewItem('food')">
            + Добавить блюдо
        </button>
    `;

    // Рендерим категории
    renderCategory('drinks', menu.drinks || []);
    renderCategory('food', menu.food || []);
}

function renderCategory(category, items) {
    const container = document.getElementById(`${category}-container`);
    if (!container) {
        console.error(`Контейнер ${category} не найден!`);
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="admin-menu-item" data-id="${item.id}">
            <div class="image-wrapper">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%' height='100%' fill='%23f5f5f5'/%3E%3C/svg%3E" 
                     data-src="${item.image}"
                     alt="${item.name}">
            </div>
            <div class="admin-menu-item-controls">
                <input type="text" value="${item.name}" class="admin-menu-item-name">
                <input type="number" value="${item.price}" class="admin-menu-item-price">
                <input type="text" value="${item.image}" class="admin-menu-item-image">
                <div class="admin-actions">
                    <button class="btn small" onclick="window.saveItem(${item.id}, '${category}', this)">
                        Сохранить
                    </button>
                    <button class="btn small danger" onclick="window.deleteItem(${item.id}, '${category}')">
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Отложенная загрузка изображений
    setTimeout(() => {
        container.querySelectorAll('img[data-src]').forEach(img => {
            loadImageWithFallback(img, img.dataset.src);
        });
    }, 50);

        items.forEach(item => {
            const imgElement = document.getElementById(`img-${item.id}`);
            if (imgElement) {
                setTimeout(() => {
                    loadImageWithFallback(imgElement, item.image);
                }, 100);
            }
        });
    }

    // Глобальные функции
window.addNewItem = function(category) {
    console.log('Добавляем новый товар в категорию:', category);
    const newItem = {
        id: Date.now(),
        name: "Новый товар",
        price: 100,
        image: "https://via.placeholder.com/300x200?text=Новый+товар"
    };

    // Сразу добавляем в DOM без сохранения
    const container = document.getElementById(`${category}-container`);
    if (container) {
        container.insertAdjacentHTML('beforeend', `
            <div class="admin-menu-item" data-id="${newItem.id}">
                <div class="image-wrapper">
                    <img src="${newItem.image}" 
                         alt="${newItem.name}"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки'">
                </div>
                <div class="admin-menu-item-controls">
                    <input type="text" value="${newItem.name}" class="admin-menu-item-name">
                    <input type="number" value="${newItem.price}" class="admin-menu-item-price">
                    <input type="text" value="${newItem.image}" class="admin-menu-item-image">
                    <div class="admin-actions">
                        <button class="btn small" onclick="window.saveItem(${newItem.id}, '${category}', this)">
                            Сохранить
                        </button>
                        <button class="btn small danger" onclick="window.deleteItem(${newItem.id}, '${category}')">
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        `);
        showNotification('Товар добавлен (нажмите Сохранить)');
    }
};

window.saveItem = function(id, category, btn) {
    const itemElement = document.querySelector(`.admin-menu-item[data-id="${id}"]`);
    if (!itemElement) return;

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const name = itemElement.querySelector('.admin-menu-item-name').value.trim();
    const price = parseInt(itemElement.querySelector('.admin-menu-item-price').value);
    const image = itemElement.querySelector('.admin-menu-item-image').value.trim();

    if (!name || isNaN(price)) {
        showNotification('Заполните все поля правильно', true);
        btn.disabled = false;
        btn.textContent = 'Сохранить';
        return;
    }

    fetch('php/menu.json')
        .then(response => response.json())
        .then(menu => {
            menu[category] = menu[category] || [];
            const index = menu[category].findIndex(item => item.id == id);
            
            const itemData = { id, name, price, image };
            if (index >= 0) {
                menu[category][index] = itemData;
            } else {
                menu[category].push(itemData);
            }

            return saveMenuData(menu);
        })
        .then(() => {
            btn.disabled = false;
            btn.textContent = 'Сохранить';
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка сохранения', true);
            btn.disabled = false;
            btn.textContent = 'Сохранить';
        });
};

window.deleteItem = function(id, category) {
    if (!confirm('Удалить этот товар из меню?')) return;

    // Показываем статус удаления
    const deleteBtn = document.querySelector(`.admin-menu-item[data-id="${id}"] .btn.danger`);
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Удаление...';
    }

    fetch('php/menu.json?nocache=' + Date.now())
        .then(response => response.json())
        .then(menu => {
            menu[category] = (menu[category] || []).filter(item => item.id != id);
            return saveMenuData(menu);
        })
        .then(() => {
            // Удаляем только конкретный элемент, а не всё меню
            const itemElement = document.querySelector(`.admin-menu-item[data-id="${id}"]`);
            if (itemElement) itemElement.remove();
            showNotification('Товар удалён');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка удаления', true);
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Удалить';
            }
        });
};

async function saveMenuData(menu) {
    try {
        const response = await fetch('php/save_menu.php?nocache=' + Date.now(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
            },
            body: JSON.stringify(menu)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка сервера');
        }
        
        showNotification('Изменения сохранены');
        return await response.json();
    } catch (error) {
        console.error('Save error:', error);
        throw error;
    }
}

    // Инициализация
    loadMenu();
});