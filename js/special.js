// Файл для управления напитками месяца и недели (одиночный выбор)

let currentMenu = { drinks: [], food: [] };

function populateSpecialDrinkSelectors(menu) {
  console.log('Заполняем селекты напитков:', menu);
  currentMenu = menu;
  const monthSelect = document.getElementById('drink-of-month');
  const weekSelect = document.getElementById('drink-of-week');

  if (!monthSelect || !weekSelect) {
    console.error('Селекты не найдены!');
    return;
  }

  monthSelect.innerHTML = '<option value="">— Не выбрано —</option>';
  weekSelect.innerHTML = '<option value="">— Не выбрано —</option>';

  if (menu.drinks && menu.drinks.length > 0) {
    console.log('Добавляем напитки в селекты:', menu.drinks.length);
    menu.drinks.forEach((item) => {
      const option1 = document.createElement('option');
      const option2 = document.createElement('option');
      option1.value = option2.value = item.id;
      option1.textContent = option2.textContent = item.name;
      monthSelect.appendChild(option1);
      weekSelect.appendChild(option2);
    });
  } else {
    console.warn('Нет напитков для добавления в селекты');
  }
}

function displaySpecialDrinkPreview(type, itemId) {
  const target = document.getElementById(`${type}-preview`);
  const drink = currentMenu.drinks.find((d) => d.id == itemId);
  if (!target) return;

  if (!drink || !itemId) {
    target.innerHTML = '<p style="color:#999">Не выбрано</p>';
    return;
  }

  target.innerHTML = `
    <div class="special-drink-card">
      <img src="${drink.image}" alt="${drink.name}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;">
      <div style="margin-left: 10px;">
        <h4 style="margin: 0; color: #b85c1d;">${drink.name}</h4>
        <p style="margin: 5px 0; color: #666;">${drink.weight}</p>
        <strong style="color: #b85c1d;">${drink.price} ₽</strong>
      </div>
    </div>
  `;
}

function loadSpecialDrinks() {
  database
    .ref('specials')
    .once('value')
    .then((snapshot) => {
      const data = snapshot.val() || {};

      const monthSelect = document.getElementById('drink-of-month');
      const weekSelect = document.getElementById('drink-of-week');

      if (data.drinkOfMonth && monthSelect) {
        monthSelect.value = data.drinkOfMonth;
        displaySpecialDrinkPreview('month', data.drinkOfMonth);
      }
      if (data.drinkOfWeek && weekSelect) {
        weekSelect.value = data.drinkOfWeek;
        displaySpecialDrinkPreview('week', data.drinkOfWeek);
      }
    })
    .catch((error) => {
      console.error('Ошибка загрузки специальных напитков:', error);
    });
}

// Обработчики событий для автосохранения при изменении
document.addEventListener('DOMContentLoaded', () => {
  const monthSelect = document.getElementById('drink-of-month');
  const weekSelect = document.getElementById('drink-of-week');

  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      displaySpecialDrinkPreview('month', e.target.value);
    });
  }

  if (weekSelect) {
    weekSelect.addEventListener('change', (e) => {
      displaySpecialDrinkPreview('week', e.target.value);
    });
  }
});

// Экспортируем функцию, вызываемую из admin.js после загрузки меню
window.initSpecialDrinks = function (menu) {
  console.log('initSpecialDrinks вызвана с меню:', menu);
  populateSpecialDrinkSelectors(menu);
  loadSpecialDrinks();
};

// Функция для отображения специальных напитков на главной странице
window.renderSpecialDrinksOnMainPage = function () {
  Promise.all([
    database.ref('menu').once('value'),
    database.ref('specials').once('value'),
  ])
    .then(([menuSnap, specialSnap]) => {
      const menu = menuSnap.val();
      const specials = specialSnap.val();

      if (!menu || !menu.drinks) return;

      const drinks = menu.drinks;

      // Находим напитки по ID
      const drinkOfMonth = specials?.drinkOfMonth
        ? drinks.find((d) => d.id == specials.drinkOfMonth)
        : null;
      const drinkOfWeek = specials?.drinkOfWeek
        ? drinks.find((d) => d.id == specials.drinkOfWeek)
        : null;

      // Отображаем на главной странице
      const monthContainer = document.querySelector('.drink-of-the-month');
      const weekContainer = document.querySelector('.drinks-of-the-week');

      if (monthContainer) {
        if (drinkOfMonth) {
          monthContainer.innerHTML = createDrinkCardHTML(drinkOfMonth);
        } else {
          monthContainer.innerHTML = '<p>Напиток месяца не выбран</p>';
        }
      }

      if (weekContainer) {
        if (drinkOfWeek) {
          weekContainer.innerHTML = createDrinkCardHTML(drinkOfWeek);
        } else {
          weekContainer.innerHTML = '<p>Напиток недели не выбран</p>';
        }
      }

      // Настраиваем обработчики для кнопок "Добавить в корзину"
      if (window.setupCartButtons) {
        window.setupCartButtons();
      } else {
        console.error(
          'Функция setupCartButtons не найдена в глобальном объекте window'
        );
      }
    })
    .catch((error) => {
      console.error(
        'Ошибка загрузки специальных напитков для главной страницы:',
        error
      );
    });
};

function createDrinkCardHTML(drink) {
  return `
    <div class="menu-item featured">
      <img src="${drink.image}" alt="${drink.name}">
      <div class="item-details">
        <h4>${drink.name}</h4>
        <p>${drink.weight}</p>
        <strong>${drink.price} ₽</strong>
        <button class="btn add-to-cart" data-id="${drink.id}" data-name="${drink.name}" data-price="${drink.price}">Добавить в корзину</button>
      </div>
    </div>
  `;
}
