// Обработка кнопок "Заказать", исключая внешние ссылки

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach((btn) => {
    // Игнорируем кнопки-ссылки (например, на 2ГИС или Google Maps)
    if (btn.tagName === 'A') return;

    btn.addEventListener('click', () => {
      alert('Спасибо за интерес! Заказы пока принимаются только в кафе ☕');
    });
  });

  // Бургер для напитков
  const burgerDrinks = document.getElementById('menu-burger-drinks');
  const gridDrinks = document.querySelector('.menu-grid.drinks');
  burgerDrinks.addEventListener('click', () => {
    gridDrinks.classList.toggle('open');
    burgerDrinks.classList.toggle('active');
  });

  // Бургер для еды
  const burgerFood = document.getElementById('menu-burger-food');
  const gridFood = document.querySelector('.menu-grid.food');
  burgerFood.addEventListener('click', () => {
    gridFood.classList.toggle('open');
    burgerFood.classList.toggle('active');
  });

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
});
