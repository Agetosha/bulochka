// Глобальная функция для настройки кнопок корзины
window.setupCartButtons = function () {
  document.querySelectorAll('.add-to-cart').forEach((button) => {
    // Проверяем, не был ли уже добавлен обработчик
    if (button.dataset.hasClickListener === 'true') return;

    button.dataset.hasClickListener = 'true';
    button.addEventListener('click', function (e) {
      e.stopPropagation();

      // Анимация кнопки
      this.classList.add('add-to-cart-animation');
      setTimeout(() => {
        this.classList.remove('add-to-cart-animation');
      }, 500);

      const id = button.dataset.id;
      const name = button.dataset.name;
      const price = parseInt(button.dataset.price);

      // Проверяем, есть ли товар уже в корзине
      const existingItem = window.cart.find((item) => item.id === id);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        window.cart.push({ id, name, price, quantity: 1 });
      }

      window.updateCart();
    });
  });
};

// Глобальные переменные для корзины
window.cart = [];

// Глобальные функции для работы с корзиной
window.updateCart = function () {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');

  if (!cartItems || !cartCount || !cartTotal) return;

  cartItems.innerHTML = '';

  if (window.cart.length === 0) {
    cartItems.innerHTML = '<p>Корзина пуста</p>';
    cartCount.textContent = '0';
    cartTotal.textContent = 'Итого: 0 руб.';
    return;
  }

  let total = 0;
  window.cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartItems.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-name">${item.name} x${item.quantity}</div>
        <div class="cart-item-price">${itemTotal} руб.</div>
        <button class="remove-item" data-id="${item.id}">✕</button>
      </div>
    `;
  });

  cartCount.textContent = window.cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  cartTotal.textContent = `Итого: ${total} руб.`;

  document.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      window.cart = window.cart.filter((item) => item.id !== id);
      window.updateCart();
      window.animateCartIcon();
    });
  });

  window.animateCartIcon();
};

window.animateCartIcon = function () {
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
      cartIcon.style.transform = 'scale(1)';
    }, 300);
  }
};

window.openCart = function () {
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) {
    cartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
};

window.closeCart = function () {
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) {
    cartModal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetch('php/get_hours.php')
    .then((response) => response.json())
    .then((data) => {
      if (data.hero) {
        document.getElementById('working-hours-hero').textContent = data.hero;
      }
      if (data.about) {
        document.getElementById('working-hours-about').textContent = data.about;
      }
      if (data.contacts) {
        document.getElementById('working-hours-contacts').textContent =
          data.contacts;
      }
    })
    .catch((error) => console.error('Error loading working hours:', error));

  async function loadMenu() {
    try {
      // Пробуем взять из кэша
      const cachedMenu = localStorage.getItem('menuCache');
      if (cachedMenu) {
        try {
          const menuData = JSON.parse(cachedMenu);
          renderMenuItems(menuData.menu.drinks, '.menu-grid.drinks');
          renderMenuItems(menuData.menu.food, '.menu-grid.food');
          renderMenuItems(
            menuData.menu.drinksOfMonth,
            '.menu-grid.drink-of-the-month'
          );
          renderMenuItems(
            menuData.menu.drinksOfWeek,
            '.menu-grid.drinks-of-the-week'
          );
          window.setupCartButtons();
        } catch (e) {
          console.error('Ошибка чтения кэша:', e);
          localStorage.removeItem('menuCache');
        }
      }

      // Загружаем из Firebase
      const snapshot = await database.ref('menu').once('value');
      const menuData = { menu: snapshot.val() };

      // Обновляем кэш и DOM
      localStorage.setItem('menuCache', JSON.stringify(menuData));
      renderMenuItems(menuData.menu.drinks, '.menu-grid.drinks');
      renderMenuItems(menuData.menu.food, '.menu-grid.food');
      window.setupCartButtons();
    } catch (error) {
      console.error('Error loading menu:', error);
      document.querySelectorAll('.menu-grid').forEach((grid) => {
        grid.innerHTML =
          '<p>Не удалось загрузить меню. Пожалуйста, попробуйте позже.</p>';
      });
    }
  }
  // NEW: Заменяем старый код загрузки на вызов функции
  loadMenu(); // Вместо всего блока fetch().then().catch()

  // Функция для отображения элементов меню
  function renderMenuItems(items, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '';

    // Проверяем, что items существует и является массивом
    if (!items || !Array.isArray(items)) {
      container.innerHTML = '<p>Нет данных для отображения</p>';
      return;
    }

    items.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" loading="lazy" 
            onclick="openImageModal('${item.image}', '${item.name}')">
        <div class="menu-item-content">
          <h3>${item.name}</h3>
          <p>${item.description || ''}</p>
          <div class="menu-item-details">
            <p class="item-price">${item.price} ₽</p>
            <p class="item-weight">${item.weight || item.volume || ''}</p>
            <button class="btn add-to-cart" 
                    data-id="${item.id}" 
                    data-name="${item.name}" 
                    data-price="${item.price}">
                Добавить в корзину
            </button>
          </div>
        </div>
      `;
      container.appendChild(menuItem);
    });
  }

  // Бургер для напитков
  const burgerDrinks = document.getElementById('menu-burger-drinks');
  const gridDrinks = document.querySelector('.menu-grid.drinks');
  if (burgerDrinks && gridDrinks) {
    burgerDrinks.addEventListener('click', () => {
      gridDrinks.classList.toggle('open');
      burgerDrinks.classList.toggle('open');
    });
  }

  // Бургер для еды
  const burgerFood = document.getElementById('menu-burger-food');
  const gridFood = document.querySelector('.menu-grid.food');
  if (burgerFood && gridFood) {
    burgerFood.addEventListener('click', () => {
      gridFood.classList.toggle('open');
      burgerFood.classList.toggle('open');
    });
  }

  // Показывать меню на десктопе всегда
  function toggleMenuGridOnResize() {
    const isMobile = window.innerWidth <= 1024;
    document.querySelectorAll('.menu-grid').forEach((grid) => {
      if (isMobile) {
        grid.classList.remove('open');
      } else {
        grid.classList.add('open');
      }
    });
  }

  toggleMenuGridOnResize();
  window.addEventListener('resize', toggleMenuGridOnResize);

  // ======== Функционал корзины ========
  // Используем глобальные переменные и функции

  // Инициализация корзины
  const cartIcon = document.getElementById('cart-icon');
  const closeBtn = document.querySelector('.close');

  if (cartIcon) cartIcon.addEventListener('click', window.openCart);
  if (closeBtn) closeBtn.addEventListener('click', window.closeCart);

  // Отправка формы
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (window.cart.length === 0) {
        alert('Корзина пуста! Пожалуйста, добавьте товары.');
        return;
      }

      const phoneInput = this.querySelector('input[name="phone"]');
      const phoneRegex =
        /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

      if (!phoneRegex.test(phoneInput.value)) {
        alert('Пожалуйста, введите корректный российский номер телефона.');
        return;
      }

      const orderItems = window.cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const total = window.cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      sessionStorage.setItem(
        'customerName',
        this.querySelector('input[name="name"]').value
      );
      sessionStorage.setItem('customerPhone', phoneInput.value);
      sessionStorage.setItem(
        'customerComment',
        this.querySelector('textarea[name="comment"]').value || 'не указано'
      );

      sessionStorage.setItem('orderItems', JSON.stringify(orderItems));
      sessionStorage.setItem('orderTotal', total.toString());

      console.log('Saved to sessionStorage:', {
        orderItems,
        total,
        name: this.querySelector('input[name="name"]').value,
        phone: phoneInput.value,
        comment: this.querySelector('textarea[name="comment"]').value,
      });

      window.location.href = 'payment.html';
    });
  }

  // Обработчик для кнопки "Продолжить выбор"
  document
    .getElementById('continue-shopping')
    ?.addEventListener('click', closeCart);

  // Обработчик кнопки входа
  document
    .getElementById('login-link')
    ?.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'login.html';
    });

  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('nav');
  const overlay = document.querySelector('.overlay');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      this.classList.toggle('open');
      nav.classList.toggle('open');
      overlay.classList.toggle('active');
      document.body.style.overflow = nav.classList.contains('open')
        ? 'hidden'
        : '';
    });

    // Закрытие меню при клике на ссылку или overlay
    [overlay, ...document.querySelectorAll('nav a')].forEach((element) => {
      element.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        nav.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Инициализируем корзину при загрузке
  window.updateCart();
});

function openImageModal(src, title) {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="image-modal-content">
      <span class="close-modal">&times;</span>
      <img src="${src}" alt="${title}">
      <p>${title}</p>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden'; // Блокируем скролл

  modal.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.style.overflow = '';
  });
}
