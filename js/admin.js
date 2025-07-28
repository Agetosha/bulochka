document.addEventListener('DOMContentLoaded', () => {
  // Показ уведомлений
  window.showNotification = function (message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 10);

    // Убираем через 3 секунды
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Загрузка меню
  let isMenuLoading = false;
  let loadedImages = new Set(); // Трекер загруженных изображений

  async function loadMenu() {
    try {
      console.log('Загрузка меню из Firebase...');
      const snapshot = await database.ref('/menu').once('value');
      const menu = snapshot.val();

      console.log('Полученные данные:', menu);

      if (!menu) {
        console.log('Меню не найдено, создаём пустое');
        const defaultMenu = {
          drinks: [],
          food: [],
        };
        await database.ref('/menu').set(defaultMenu);
        renderMenu(defaultMenu);
      } else {
        renderMenu(menu);
        // Вызываем функцию из special.js
        if (window.initSpecialDrinks) {
          window.initSpecialDrinks(menu);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      renderMenu({ drinks: [], food: [] });
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
    tester.onload = function () {
      imgElement.src = url;
    };
    tester.onerror = function () {
      imgElement.src =
        'https://via.placeholder.com/300x200?text=Ошибка+загрузки';
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

    container.innerHTML = items
      .map(
        (item) => `
        <div class="admin-menu-item" data-id="${item.id}">
            <div class="image-wrapper">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%' height='100%' fill='%23f5f5f5'/%3E%3C/svg%3E" 
                    data-src="${item.image}"
                    alt="${item.name}">
            </div>
            <div class="admin-menu-item-controls">
                <input type="text" value="${
                  item.name || ''
                }" class="admin-menu-item-name" placeholder="Название товара">
                <input type="number" value="${
                  item.price || ''
                }" class="admin-menu-item-price" placeholder="Цена (руб)">
                <input type="text" value="${
                  item.weight || ''
                }" class="admin-menu-item-weight" placeholder="Вес (г/мл)">
                <input type="text" value="${
                  item.image || ''
                }" class="admin-menu-item-image" placeholder="Ссылка на изображение">
                <div class="admin-actions">
                    <button class="btn small" onclick="window.saveItem(${
                      item.id
                    }, '${category}', this)">
                        Сохранить
                    </button>
                    <button class="btn small danger" onclick="window.deleteItem(${
                      item.id
                    }, '${category}')">
                        Удалить
                    </button>
                </div>
            </div>
        </div>

        `
      )
      .join('');

    // Отложенная загрузка изображений
    setTimeout(() => {
      container.querySelectorAll('img[data-src]').forEach((img) => {
        loadImageWithFallback(img, img.dataset.src);
      });
    }, 50);

    items.forEach((item) => {
      const imgElement = document.getElementById(`img-${item.id}`);
      if (imgElement) {
        setTimeout(() => {
          loadImageWithFallback(imgElement, item.image);
        }, 100);
      }
    });
  }

  // Глобальные функции
  window.addNewItem = async function (category) {
    console.log('Добавляем новый товар в категорию:', category);
    const newItem = {
      id: Date.now(),
      name: 'Новый товар',
      weight: category === 'drinks' ? '250 мл' : '100 г',
      price: 100,
      image:
        'https://avatars.mds.yandex.net/i?id=d38b357ee74445becb025f11c6beae33e1578580-5269853-images-thumbs&n=13',
    };

    // Сразу добавляем в DOM
    const container = document.getElementById(`${category}-container`);
    if (container) {
      container.insertAdjacentHTML(
        'beforeend',
        `
                    <div class="admin-menu-item" data-id="${newItem.id}">
                        <div class="image-wrapper">
                            <img src="${newItem.image}" alt="${newItem.name}">
                        </div>
                        <div class="admin-menu-item-controls">
                            <input type="text" value="${newItem.name}" class="admin-menu-item-name">
                            <input type="number" value="${newItem.price}" class="admin-menu-item-price">
                            <!-- Добавлено поле для веса -->
                            <input type="text" value="${newItem.weight}" class="admin-menu-item-weight" placeholder="Вес (г)">
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
                `
      );

      // Автоматически сохраняем новый товар
      try {
        const snapshot = await database.ref('menu').once('value');
        const menu = snapshot.val() || { drinks: [], food: [] };

        if (!menu[category]) menu[category] = [];
        menu[category].push(newItem);

        await database.ref('menu').set(menu);
        showNotification('Товар успешно добавлен и сохранён');
      } catch (error) {
        console.error('Ошибка при добавлении товара:', error);
        showNotification('Ошибка при добавлении товара', true);
      }
    }
  };

  window.saveItem = function (id, category, btn) {
    // Проверка авторизации перед сохранением
    if (!firebase.auth().currentUser) {
      showNotification('Требуется авторизация', true);
      return;
    }

    const itemElement = document.querySelector(
      `.admin-menu-item[data-id="${id}"]`
    );
    if (!itemElement) return;

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const name = itemElement
      .querySelector('.admin-menu-item-name')
      .value.trim();
    const weight = itemElement
      .querySelector('.admin-menu-item-weight')
      .value.trim();
    const price = parseInt(
      itemElement.querySelector('.admin-menu-item-price').value
    );
    const image = itemElement
      .querySelector('.admin-menu-item-image')
      .value.trim();

    if (!name || isNaN(price)) {
      showNotification('Заполните все поля правильно', true);
      btn.disabled = false;
      btn.textContent = 'Сохранить';
      return;
    }

    // Получаем текущее меню из Firebase
    database
      .ref('menu')
      .once('value')
      .then((snapshot) => {
        const menu = snapshot.val() || { drinks: [], food: [] };
        const itemData = { id, name, weight, price, image };

        if (!menu[category]) menu[category] = [];
        const index = menu[category].findIndex((item) => item.id == id);

        if (index >= 0) {
          menu[category][index] = itemData;
        } else {
          menu[category].push(itemData);
        }

        return database.ref('menu').set(menu);
      })
      .then(() => {
        btn.disabled = false;
        btn.textContent = 'Сохранить';
        showNotification('Товар успешно сохранён');
      })
      .catch((error) => {
        showNotification('Ошибка сохранения', true);
        btn.disabled = false;
        btn.textContent = 'Сохранить';
      });
  };

  window.deleteItem = function (id, category) {
    // Проверка авторизации перед удалением
    if (!firebase.auth().currentUser) {
      showNotification('Требуется авторизация', true);
      return;
    }

    if (!confirm('Удалить этот товар из меню?')) return;

    const deleteBtn = document.querySelector(
      `.admin-menu-item[data-id="${id}"] .btn.danger`
    );
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Удаление...';
    }

    database
      .ref('menu')
      .once('value')
      .then((snapshot) => {
        const menu = snapshot.val();
        menu[category] = menu[category].filter((item) => item.id != id);
        return database.ref('menu').set(menu);
      })
      .then(() => {
        const itemElement = document.querySelector(
          `.admin-menu-item[data-id="${id}"]`
        );
        if (itemElement) itemElement.remove();
        showNotification('Товар успешно удалён');
      })
      .catch((error) => {
        showNotification('Ошибка удаления', true);
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.textContent = 'Удалить';
        }
      });
  };

  async function saveMenuData(menu) {
    try {
      await database.ref('menu').set(menu);
      showNotification('Изменения сохранены');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      showNotification('Ошибка сохранения', true);
      throw error;
    }
  }

  // Инициализация
  loadMenu();

  const saveBtn = document.getElementById('save-hours');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const openTime = document.getElementById('open-time').value;
      const closeTime = document.getElementById('close-time').value;
      const scheduleText = document.getElementById('schedule-text').value;

      const workingHoursRef = database.ref('workingHours');

      workingHoursRef
        .set({
          open: openTime,
          close: closeTime,
          text: scheduleText,
        })
        .then(() => {
          showNotification('Часы работы успешно обновлены');
        })
        .catch((error) => {
          console.error('Ошибка при сохранении времени:', error);
          showNotification('Ошибка при сохранении часов работы', true);
        });
    });
  }

  // Обработчик сохранения специальных напитков
  function setupSpecialDrinksSaveHandler() {
    const saveButton = document.getElementById('save-featured');
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        console.log('Нажата кнопка сохранения специальных напитков');

        const monthSelect = document.getElementById('drink-of-month');
        const weekSelect = document.getElementById('drink-of-week');

        if (!monthSelect || !weekSelect) {
          console.error('Селекты не найдены');
          showNotification('Ошибка: селекты не найдены', true);
          return;
        }

        const selectedMonth = monthSelect.value;
        const selectedWeek = weekSelect.value;

        console.log('Выбранные напитки:', { selectedMonth, selectedWeek });

        try {
          // Проверяем авторизацию
          if (!firebase.auth().currentUser) {
            showNotification('Требуется авторизация', true);
            return;
          }

          saveButton.disabled = true;
          saveButton.textContent = 'Сохранение...';

          await database.ref('specials').set({
            drinkOfMonth: selectedMonth || null,
            drinkOfWeek: selectedWeek || null,
          });

          showNotification('Напитки месяца и недели успешно обновлены!');
          console.log('Специальные напитки сохранены успешно');
        } catch (error) {
          console.error('Ошибка сохранения:', error);
          showNotification('Ошибка при сохранении напитков', true);
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = 'Сохранить выбор';
        }
      });
    }
  }

  // Вызываем настройку обработчика
  setupSpecialDrinksSaveHandler();

  function loadWorkingHours() {
    const ref = database.ref('workingHours');
    ref
      .once('value')
      .then((snapshot) => {
        const data = snapshot.val();
        if (data) {
          document.getElementById('open-time').value = data.open || '';
          document.getElementById('close-time').value = data.close || '';
          document.getElementById('schedule-text').value = data.text || '';
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки часов работы:', error);
        showNotification('Ошибка загрузки часов работы', true);
      });
  }

  loadWorkingHours();
});
