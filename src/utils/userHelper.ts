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
      return getMockUserData();
    }
    
    // В Telegram Web App пользовательские данные доступны через window.Telegram.WebApp
    const telegramWebApp = window.Telegram?.WebApp;
    
    if (!telegramWebApp || !telegramWebApp.initDataUnsafe || !telegramWebApp.initDataUnsafe.user) {
      return getMockUserData();
    }
    
    const user = telegramWebApp.initDataUnsafe.user;
    
    return {
      id: user.id,
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
  return {
    id: 0,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    photo_url: undefined
  };
}; 