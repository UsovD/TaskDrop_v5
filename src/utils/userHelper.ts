import { isTMA } from '@telegram-apps/sdk-react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  telegram_id?: number;
}

// API URL из переменных окружения или константа
const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';

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
        initData: string;
        ready: () => void;
        MainButton: {
          text: string;
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}

/**
 * Получает данные пользователя из Telegram WebApp
 * @returns Данные пользователя с корректным Telegram ID
 */
export const getUserData = async (): Promise<{ 
  id: number; 
  first_name: string; 
  last_name?: string; 
  username?: string; 
  photo_url?: string;
  telegram_id: number 
}> => {
  try {
    console.group('🔍 Получение данных пользователя');
    console.log('Начало получения данных пользователя из Telegram WebApp');
    
    // Выводим информацию о среде выполнения
    console.log('UserAgent:', navigator.userAgent);
    console.log('WebApp доступен:', Boolean(window.Telegram?.WebApp));
    console.log('InitDataUnsafe доступен:', Boolean(window.Telegram?.WebApp?.initDataUnsafe));
    
    // Проверяем наличие Telegram WebApp
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      console.warn('Telegram WebApp недоступен или данные пользователя отсутствуют');
      
      // Проверяем localStorage
      const savedId = localStorage.getItem('user_telegram_id');
      console.log('Сохраненный ID в localStorage:', savedId);
      
      throw new Error('Telegram WebApp user data not available');
    }
    
    // Получаем данные пользователя из Telegram WebApp
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    console.log('Получены данные пользователя из Telegram:');
    console.log('- id:', user.id);
    console.log('- first_name:', user.first_name);
    console.log('- last_name:', user.last_name);
    console.log('- username:', user.username);
    console.log('- photo_url:', user.photo_url);
    
    // Проверяем наличие ID пользователя
    if (!user.id) {
      console.error('ID пользователя не найден в данных Telegram WebApp');
      throw new Error('User ID is missing from Telegram WebApp data');
    }
    
    // Сохраняем ID в localStorage для возможного восстановления в будущем
    try {
      localStorage.setItem('user_telegram_id', String(user.id));
      localStorage.setItem('user_telegram_data', JSON.stringify(user));
      console.log('Данные пользователя сохранены в localStorage');
    } catch (e) {
      console.warn('Не удалось сохранить данные в localStorage:', e);
    }
    
    // Возвращаем данные пользователя с гарантированным ID
    const userData = {
      id: user.id,                // Используем Telegram ID как основной ID
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      telegram_id: user.id        // Дублируем ID для совместимости
    };
    
    console.log('Итоговый объект данных пользователя:', userData);
    console.groupEnd();
    
    return userData;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error);
    
    // Пытаемся восстановить данные из localStorage
    try {
      const savedId = localStorage.getItem('user_telegram_id');
      if (savedId) {
        const parsedId = parseInt(savedId, 10);
        console.log('Восстановлен ID пользователя из localStorage:', parsedId);
        
        // Проверяем, есть ли полные данные пользователя
        const savedData = localStorage.getItem('user_telegram_data');
        if (savedData) {
          const userData = JSON.parse(savedData);
          console.log('Восстановлены полные данные пользователя из localStorage:', userData);
          
          const restoredUserData = {
            id: parsedId,
            first_name: userData.first_name || 'Пользователь',
            last_name: userData.last_name,
            username: userData.username,
            photo_url: userData.photo_url,
            telegram_id: parsedId
          };
          
          console.log('Восстановленный объект данных пользователя:', restoredUserData);
          console.groupEnd();
          
          return restoredUserData;
        }
        
        // Возвращаем минимальные данные, если нет полных
        const minimalUserData = {
          id: parsedId,
          first_name: 'Пользователь',
          telegram_id: parsedId
        };
        
        console.log('Минимальный восстановленный объект данных пользователя:', minimalUserData);
        console.groupEnd();
        
        return minimalUserData;
      }
    } catch (e) {
      console.error('Ошибка при восстановлении данных из localStorage:', e);
    }
    
    console.groupEnd();
    // Если не удалось восстановить данные, выбрасываем ошибку
    throw new Error('Не удалось получить или восстановить данные пользователя');
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
    photo_url: 'https://i.pravatar.cc/300?u=test_user'
  };
};

/**
 * Возвращает Telegram ID пользователя для отладки
 */
export const getTelegramDebugInfo = (): { 
  telegramId: number | null, 
  webAppAvailable: boolean, 
  userId: number | null,
  rawInitData: any 
} => {
  try {
    const telegramWebApp = window.Telegram?.WebApp;
    const webAppAvailable = Boolean(telegramWebApp);
    const telegramUser = telegramWebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id || null;
    
    // Полные данные для отладки
    const rawInitData = telegramWebApp?.initDataUnsafe || null;
    
    console.log('DEBUG: WebApp доступен:', webAppAvailable);
    console.log('DEBUG: Telegram ID:', telegramId);
    console.log('DEBUG: Полные данные initDataUnsafe:', rawInitData);
    
    // Пытаемся получить текущий userId из localStorage
    let userId = null;
    try {
      // Сначала пробуем получить из нового ключа user_telegram_id
      const savedTelegramId = localStorage.getItem('user_telegram_id');
      if (savedTelegramId) {
        userId = parseInt(savedTelegramId, 10);
        console.log('DEBUG: ID из localStorage:', userId);
      } else {
        // Для обратной совместимости проверяем старый ключ userData
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          userId = parsed?.id || null;
          console.log('DEBUG: ID из userData в localStorage:', userId);
        }
      }
    } catch (e) {
      console.error('Ошибка при чтении userId из localStorage:', e);
    }
    
    return {
      telegramId,
      webAppAvailable,
      userId,
      rawInitData
    };
  } catch (error) {
    console.error('Ошибка получения информации о Telegram ID:', error);
    return {
      telegramId: null,
      webAppAvailable: false,
      userId: null,
      rawInitData: null
    };
  }
};

/**
 * Валидирует initData, полученные от Telegram WebApp
 * @param initData - строка initData от Telegram WebApp
 * @param botToken - токен бота для проверки (должен быть доступен только на сервере)
 * @returns результат проверки и причина ошибки, если есть
 */
export const validateTelegramWebAppData = (initData: string, botToken?: string): { valid: boolean, error?: string } => {
  try {
    console.log('Проверка initData:', initData);
    
    if (!initData) {
      return { valid: false, error: 'initData is empty' };
    }
    
    // Разбираем строку initData в объект
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { valid: false, error: 'No hash in initData' };
    }
    
    // Создаем строку для проверки, сортируя параметры по ключу
    const dataCheckString = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    console.log('Data check string:', dataCheckString);
    
    // Без токена бота не можем проверить подпись, но можем проверить структуру
    if (!botToken) {
      // Проверяем наличие user в данных
      const user = urlParams.get('user');
      if (!user) {
        return { valid: false, error: 'No user data in initData' };
      }
      
      try {
        const userData = JSON.parse(user);
        if (!userData.id) {
          return { valid: false, error: 'No user ID in user data' };
        }
        return { valid: true };
      } catch (e) {
        return { valid: false, error: 'Failed to parse user data' };
      }
    }
    
    // Вычисляем HMAC-SHA-256 хеш с ключом, полученным из SHA-256 хеша токена бота
    const secretKey = CryptoJS.SHA256(botToken);
    const calculatedHash = CryptoJS.HmacSHA256(dataCheckString, secretKey).toString(CryptoJS.enc.Hex);
    
    if (calculatedHash !== hash) {
      console.error('Hash validation failed', { 
        calculated: calculatedHash, 
        received: hash 
      });
      return { valid: false, error: 'HMAC validation failed' };
    }
    
    // Проверяем, что auth_date не старше 24 часов
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 часа в секундах
      
      if (currentTimestamp - authTimestamp > maxAge) {
        return { valid: false, error: 'Auth data is expired' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating Telegram Web App data:', error);
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Отладочная функция для получения и проверки initData
 */
export const debugTelegramInitData = (): { 
  initDataStr: string | null,
  validationResult: { valid: boolean, error?: string } | null,
  parsedData: Record<string, any> | null,
  userDataPresent: boolean,
  webAppAvailable: boolean
} => {
  try {
    const telegramWebApp = window.Telegram?.WebApp;
    const webAppAvailable = Boolean(telegramWebApp);
    
    if (!webAppAvailable) {
      return {
        initDataStr: null,
        validationResult: null,
        parsedData: null,
        userDataPresent: false,
        webAppAvailable: false
      };
    }
    
    const initDataStr = telegramWebApp?.initData || '';
    console.log('DEBUG: initData строка:', initDataStr);
    
    // Проверяем структуру данных
    const validationResult = validateTelegramWebAppData(initDataStr);
    
    // Пытаемся разобрать данные
    let parsedData: Record<string, any> | null = null;
    let userDataPresent = false;
    
    if (initDataStr) {
      try {
        const urlParams = new URLSearchParams(initDataStr);
        
        // Создаем объект из всех параметров для отладки
        parsedData = {};
        for (const [key, value] of urlParams.entries()) {
          if (key === 'user') {
            try {
              const userData = JSON.parse(value);
              parsedData[key] = userData;
              userDataPresent = Boolean(userData?.id);
            } catch (e) {
              parsedData[key] = { error: 'Failed to parse user JSON', value };
            }
          } else {
            parsedData[key] = value;
          }
        }
      } catch (e) {
        console.error('Ошибка при разборе initData:', e);
      }
    }
    
    return {
      initDataStr,
      validationResult,
      parsedData,
      userDataPresent,
      webAppAvailable
    };
  } catch (error) {
    console.error('Ошибка в функции отладки initData:', error);
    return {
      initDataStr: null,
      validationResult: null,
      parsedData: null,
      userDataPresent: false,
      webAppAvailable: false
    };
  }
}; 