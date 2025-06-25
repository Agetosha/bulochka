// Обработка кнопок "Заказать", исключая внешние ссылки

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach(btn => {
    // Игнорируем кнопки-ссылки (например, на 2ГИС или Google Maps)
    if (btn.tagName === "A") return;

    btn.addEventListener("click", () => {
      alert("Спасибо за интерес! Заказы принимаются в кафе ☕");
    });
  });
});
