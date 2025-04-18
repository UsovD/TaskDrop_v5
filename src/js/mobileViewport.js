// Функция для установки реальной высоты viewport на мобильных устройствах
const setAppHeight = () => {
  // Мобильные браузеры меняют высоту при появлении/скрытии адресной строки
  const vh = window.innerHeight * 0.01;
  
  // Устанавливаем CSS-переменные для высоты viewport
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  
  // Устанавливаем дополнительные метрики для отладки
  document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`);
  document.documentElement.style.setProperty('--window-outer-height', `${window.outerHeight}px`);
  document.documentElement.style.setProperty('--screen-height', `${window.screen.height}px`);
};

// Запускаем при загрузке страницы
window.addEventListener('DOMContentLoaded', setAppHeight);

// Запускаем при изменении размеров окна
window.addEventListener('resize', () => {
  // Используем debounce для повышения производительности
  if (window.resizeDebounce) clearTimeout(window.resizeDebounce);
  window.resizeDebounce = setTimeout(setAppHeight, 100);
});

// Запускаем при изменении ориентации устройства
window.addEventListener('orientationchange', () => {
  // Небольшая задержка для корректной обработки в iOS
  setTimeout(setAppHeight, 200);
});

// Запускаем при прокрутке для обработки появления/исчезновения адресной строки в мобильных браузерах
window.addEventListener('scroll', () => {
  // Дебаунсинг для производительности
  if (window.scrollDebounce) clearTimeout(window.scrollDebounce);
  window.scrollDebounce = setTimeout(setAppHeight, 100);
});

// Немедленно запускаем
setAppHeight();

export default setAppHeight; 