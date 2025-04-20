// Текущая версия приложения
export const APP_VERSION = '1.0.1';

// История изменений
export const VERSION_HISTORY = [
  {
    version: '1.0.1',
    date: '18.04.2025',
    changes: [
      'Исправления в системе уведомлений',
      'Добавлена отладочная информация',
      'Улучшена работа с Telegram ботом'
    ]
  },
  {
    version: '1.0.0',
    date: '20.04.2025',
    changes: [
      'Улучшена поддержка Telegram Mini Apps',
      'Исправлена проблема с черным экраном',
      'Исправлены пути к ресурсам для работы в Telegram'
    ]
  }
];

// Функция для получения текущей версии
export const getAppVersion = () => APP_VERSION;

// Функция для получения истории изменений
export const getVersionHistory = () => VERSION_HISTORY; 