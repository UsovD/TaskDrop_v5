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
          
          // Проверяем, соответствует ли ID в базе Telegram ID
          // Если нет, обновляем для правильной синхронизации
          if (response.data.id !== telegramUser.id) {
            console.log('ID в базе не соответствует Telegram ID, синхронизируем...');
            try {
              const updateResponse = await axios.put(`${API_BASE_URL}/users/${response.data.id}`, {
                id: telegramUser.id,
                telegram_id: telegramUser.id
              });
              if (updateResponse.status === 200) {
                console.log('ID пользователя синхронизирован:', updateResponse.data);
                
                // Сохраняем ID в localStorage для будущих сессий
                try {
                  localStorage.setItem('user_telegram_id', String(telegramUser.id));
                } catch (e) {
                  console.warn('Не удалось сохранить ID в localStorage:', e);
                }
                
                return updateResponse.data;
              }
            } catch (updateError) {
              console.error('Ошибка при синхронизации ID:', updateError);
            }
          }
          
          // Сохраняем ID в localStorage для будущих сессий
          try {
            localStorage.setItem('user_telegram_id', String(telegramUser.id));
          } catch (e) {
            console.warn('Не удалось сохранить ID в localStorage:', e);
          }
          
          return response.data;
        }
      } catch (error) {
        console.log('Пользователь не найден в базе, создаем нового');
        
        try {
          // Создаем нового пользователя с ID = Telegram ID
          const userData = {
            id: telegramUser.id,
            telegram_id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            photo_url: telegramUser.photo_url
          };
          
          const createResponse = await axios.post(`${API_BASE_URL}/users`, userData);
          
          if (createResponse.status === 200 || createResponse.status === 201) {
            console.log('Создан новый пользователь:', createResponse.data);
            
            // Сохраняем ID в localStorage для будущих сессий
            try {
              localStorage.setItem('user_telegram_id', String(telegramUser.id));
            } catch (e) {
              console.warn('Не удалось сохранить ID в localStorage:', e);
            }
            
            return createResponse.data;
          }
        } catch (createError) {
          console.error('Ошибка при создании пользователя:', createError);
        }
      }
      
      // Если не удалось синхронизировать с базой, возвращаем локальные данные
      // Сохраняем ID в localStorage для будущих сессий
      try {
        localStorage.setItem('user_telegram_id', String(telegramUser.id));
      } catch (e) {
        console.warn('Не удалось сохранить ID в localStorage:', e);
      }
      
      return {
        id: telegramUser.id, // Используем telegram_id как id
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        telegram_id: telegramUser.id
      };
    }
    
    // Если не в Telegram или нет данных пользователя, пытаемся получить ID из других источников
    console.log('Не удалось получить данные пользователя из Telegram, ищем альтернативные источники');
    
    // Пытаемся получить ID из localStorage
    let savedTelegramId = null;
    try {
      const savedId = localStorage.getItem('user_telegram_id');
      if (savedId) {
        savedTelegramId = parseInt(savedId, 10);
        console.log('Получен ID из localStorage:', savedTelegramId);
      }
    } catch (e) {
      console.warn('Не удалось получить ID из localStorage:', e);
    }
    
    // Если есть сохраненный ID, пытаемся получить пользователя по нему
    if (savedTelegramId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/telegram/${savedTelegramId}`);
        if (response.status === 200 && !response.data.error) {
          console.log('Пользователь найден в базе по сохраненному ID:', response.data);
          return response.data;
        }
      } catch (e) {
        console.warn('Не удалось получить пользователя по сохраненному ID:', e);
      }
    }
    
    // Если всё еще нет данных пользователя, создаем временного пользователя
    console.error('Невозможно определить пользователя. Создаем временный профиль.');
    
    // Генерируем случайный ID для избежания конфликтов
    const temporaryId = Math.floor(Math.random() * 1000000) + 1000; 
    
    return {
      id: temporaryId,
      first_name: 'Гость',
      last_name: '',
      username: 'guest_user',
      photo_url: 'https://i.pravatar.cc/300?u=guest',
      telegram_id: temporaryId
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    
    // Пытаемся получить ID из localStorage как последнее средство
    let savedTelegramId = null;
    try {
      const savedId = localStorage.getItem('user_telegram_id');
      if (savedId) {
        savedTelegramId = parseInt(savedId, 10);
        console.log('Получен ID из localStorage в режиме ошибки:', savedTelegramId);
        
        return {
          id: savedTelegramId,
          first_name: 'Пользователь',
          last_name: '',
          username: 'recovered_user',
          photo_url: 'https://i.pravatar.cc/300?u=recovered',
          telegram_id: savedTelegramId
        };
      }
    } catch (e) {
      console.warn('Не удалось получить ID из localStorage в режиме ошибки:', e);
    }
    
    // Если всё остальное не сработало, используем случайный ID
    const emergencyId = Math.floor(Math.random() * 1000000) + 2000;
    
    // В случае критической ошибки возвращаем данные по умолчанию со случайным ID
    return {
      id: emergencyId,
      first_name: 'Аварийный',
      last_name: 'Режим',
      username: 'emergency_user',
      photo_url: 'https://i.pravatar.cc/300?u=emergency',
      telegram_id: emergencyId
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