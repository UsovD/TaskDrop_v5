import { isTMA } from '@telegram-apps/sdk-react';

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// Объявляем глобальный тип для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
}

/**
 * Получает данные пользователя из Telegram WebApp
 */
export const getUserData = async (): Promise<UserData> => {
  try {
    // Проверяем, запущено ли приложение в Telegram
    const isTelegram = await isTMA('complete');
    
    if (!isTelegram) {
      // При запуске вне Telegram используем тестовый ID
      console.log('Приложение запущено вне Telegram, используется тестовый user_id');
      return getMockUserData();
    }
    
    // В Telegram Web App пользовательские данные доступны через window.Telegram.WebApp
    const telegramWebApp = window.Telegram?.WebApp;
    
    if (!telegramWebApp || !telegramWebApp.initDataUnsafe || !telegramWebApp.initDataUnsafe.user) {
      console.log('Не удалось получить данные пользователя из Telegram WebApp, используется тестовый user_id');
      return getMockUserData();
    }
    
    const user = telegramWebApp.initDataUnsafe.user;
    
    // Используем реальный Telegram ID пользователя
    console.log(`Получен реальный Telegram ID пользователя: ${user.id}`);
    
    return {
      id: user.id, // Используем реальный ID пользователя
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return getMockUserData();
  }
};

/**
 * Возвращает фиктивные данные пользователя для тестирования
 */
const getMockUserData = (): UserData => {
  // Для тестирования используем отдельный ID, чтобы не смешивать данные с реальными пользователями
  const testUserId = 999999;
  console.log(`Используется тестовый ID: ${testUserId}`);
  
  return {
    id: testUserId,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    photo_url: undefined
  };
}; 