import { isTMA } from '@telegram-apps/sdk-react';
import axios from 'axios';

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
 * Получает данные пользователя из Telegram WebApp и синхронизирует с базой данных
 */
export const getUserData = async (): Promise<UserData> => {
  try {
    // Добавляем отладочную информацию для проверки текущего окружения
    console.log('Проверка Telegram объекта:', Boolean(window.Telegram));
    console.log('Проверка WebApp объекта:', Boolean(window.Telegram?.WebApp));
    
    // Проверяем, запущено ли приложение в Telegram
    const isTelegram = await isTMA('complete');
    console.log('isTMA результат:', isTelegram);
    
    // Получаем данные из Telegram WebApp
    const telegramWebApp = window.Telegram?.WebApp;
    
    if (telegramWebApp && telegramWebApp.initDataUnsafe && telegramWebApp.initDataUnsafe.user) {
      const telegramUser = telegramWebApp.initDataUnsafe.user;
      console.log('Получены данные пользователя из Telegram:', telegramUser);
      
      try {
        // Проверяем, существует ли пользователь в базе данных
        const response = await axios.get(`${API_BASE_URL}/users/telegram/${telegramUser.id}`);
        
        // Если пользователь найден, возвращаем его данные
        if (response.status === 200 && !response.data.error) {
          console.log('Пользователь найден в базе:', response.data);
          return response.data;
        }
      } catch (error) {
        console.log('Пользователь не найден в базе, создаем нового');
        
        try {
          // Создаем нового пользователя
          const userData = {
            telegram_id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            photo_url: telegramUser.photo_url
          };
          
          const createResponse = await axios.post(`${API_BASE_URL}/users`, userData);
          
          if (createResponse.status === 200 || createResponse.status === 201) {
            console.log('Создан новый пользователь:', createResponse.data);
            return createResponse.data;
          }
        } catch (createError) {
          console.error('Ошибка при создании пользователя:', createError);
        }
      }
      
      // Если не удалось синхронизировать с базой, возвращаем локальные данные
      return {
        id: telegramUser.id, // Используем telegram_id как id
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        telegram_id: telegramUser.id
      };
    }
    
    // Если не в Telegram или нет данных пользователя, возвращаем данные Denis Usov
    console.log('Используем данные Denis Usov');
    
    try {
      // Пытаемся получить пользователя по имени из базы
      const defaultUserResponse = await axios.get(`${API_BASE_URL}/users`);
      
      if (defaultUserResponse.status === 200 && defaultUserResponse.data.length > 0) {
        // Ищем пользователя Denis Usov
        const denisUser = defaultUserResponse.data.find(
          (user: any) => user.first_name === 'Denis' && user.last_name === 'Usov'
        );
        
        if (denisUser) {
          console.log('Найден пользователь Denis Usov:', denisUser);
          return denisUser;
        }
      }
    } catch (error) {
      console.error('Ошибка при получении пользователя из базы:', error);
    }
    
    // Если не удалось получить пользователя из базы, возвращаем локальные данные
    return {
      id: 1,
      first_name: 'Denis',
      last_name: 'Usov',
      username: 'denisusov',
      photo_url: 'https://i.pravatar.cc/300?u=denisusov'
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    
    // В случае ошибки возвращаем данные по умолчанию
    return {
      id: 1,
      first_name: 'Denis',
      last_name: 'Usov',
      username: 'denisusov',
      photo_url: 'https://i.pravatar.cc/300?u=denisusov'
    };
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
export const getTelegramDebugInfo = (): { telegramId: number | null, webAppAvailable: boolean, userId: number | null } => {
  try {
    const telegramWebApp = window.Telegram?.WebApp;
    const webAppAvailable = Boolean(telegramWebApp);
    const telegramUser = telegramWebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id || null;
    
    // Пытаемся получить текущий userId из localStorage
    let userId = null;
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        userId = parsed?.id || null;
      }
    } catch (e) {
      console.error('Ошибка при чтении userId из localStorage:', e);
    }
    
    return {
      telegramId,
      webAppAvailable,
      userId
    };
  } catch (error) {
    console.error('Ошибка получения информации о Telegram ID:', error);
    return {
      telegramId: null,
      webAppAvailable: false,
      userId: null
    };
  }
}; 