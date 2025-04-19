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
      
      // Сохраняем ID напрямую - важно делать это в начале для аварийного восстановления
      try {
        localStorage.setItem('user_telegram_id', String(telegramUser.id));
        localStorage.setItem('user_telegram_data', JSON.stringify(telegramUser));
      } catch (e) {
        console.warn('Не удалось сохранить данные пользователя в localStorage:', e);
      }
      
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
                return updateResponse.data;
              }
            } catch (updateError) {
              console.error('Ошибка при синхронизации ID:', updateError);
              // При ошибке используем данные напрямую из Telegram
              console.log('Используем данные пользователя напрямую из Telegram WebApp');
              return {
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
                photo_url: telegramUser.photo_url,
                telegram_id: telegramUser.id
              };
            }
          }
          
          return response.data;
        }
      } catch (error) {
        console.log('Пользователь не найден в базе или ошибка API, используем данные из Telegram напрямую');
        
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
            return createResponse.data;
          }
        } catch (createError) {
          console.error('Ошибка при создании пользователя:', createError);
          // При ошибке создания пользователя в базе всё равно используем данные из Telegram
          console.log('Используем данные пользователя напрямую из Telegram WebApp');
          return {
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            photo_url: telegramUser.photo_url,
            telegram_id: telegramUser.id
          };
        }
      }
      
      // Если не удалось синхронизировать с базой, возвращаем локальные данные из Telegram
      console.log('Используем данные пользователя напрямую из Telegram WebApp');
      return {
        id: telegramUser.id, 
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        telegram_id: telegramUser.id
      };
    }
    
    // Если не в Telegram или нет данных пользователя, пытаемся получить ID из других источников
    console.log('Не удалось получить данные пользователя из Telegram, ищем альтернативные источники');
    
    // Пытаемся получить полные данные из localStorage
    let cachedTelegramData = null;
    try {
      const cachedData = localStorage.getItem('user_telegram_data');
      if (cachedData) {
        cachedTelegramData = JSON.parse(cachedData);
        console.log('Получены полные данные пользователя из localStorage:', cachedTelegramData);
        
        if (cachedTelegramData && cachedTelegramData.id) {
          // Используем кэшированные данные как резервный вариант
          console.log('Используем кэшированные данные пользователя из localStorage');
          
          // Дополнительно попытаемся обновить данные из API
          try {
            const response = await axios.get(`${API_BASE_URL}/users/telegram/${cachedTelegramData.id}`);
            if (response.status === 200 && !response.data.error) {
              console.log('Пользователь с кэшированным ID найден в базе:', response.data);
              return response.data;
            }
          } catch (e) {
            console.warn('Не удалось получить пользователя по кэшированному ID из API:', e);
          }
          
          // Если API недоступен, используем кэшированные данные
          return {
            id: cachedTelegramData.id,
            first_name: cachedTelegramData.first_name,
            last_name: cachedTelegramData.last_name,
            username: cachedTelegramData.username,
            photo_url: cachedTelegramData.photo_url,
            telegram_id: cachedTelegramData.id
          };
        }
      }
    } catch (e) {
      console.warn('Не удалось получить данные из localStorage:', e);
    }
    
    // Пытаемся получить ID из localStorage как запасной вариант
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
    
    // Пытаемся получить полные данные из localStorage как последнее средство
    try {
      const cachedData = localStorage.getItem('user_telegram_data');
      if (cachedData) {
        const telegramData = JSON.parse(cachedData);
        console.log('В режиме ошибки получены данные пользователя из localStorage:', telegramData);
        
        if (telegramData && telegramData.id) {
          // Используем кэшированные данные в режиме ошибки
          console.log('Используем кэшированные данные пользователя из localStorage в режиме ошибки');
          
          return {
            id: telegramData.id,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url,
            telegram_id: telegramData.id
          };
        }
      }
    } catch (cacheError) {
      console.error('Ошибка при получении кэшированных данных:', cacheError);
    }
    
    // Пытаемся получить ID из localStorage как последнее средство
    let savedTelegramId = null;
    try {
      const savedId = localStorage.getItem('user_telegram_id');
      if (savedId) {
        savedTelegramId = parseInt(savedId, 10);
        console.log('Получен ID из localStorage в режиме ошибки:', savedTelegramId);
        
        // Если есть сохраненный ID, пытаемся получить данные пользователя из API
        try {
          const response = await axios.get(`${API_BASE_URL}/users/telegram/${savedTelegramId}`);
          if (response.status === 200 && !response.data.error) {
            console.log('Пользователь найден в базе по сохраненному ID в режиме ошибки:', response.data);
            return response.data;
          }
        } catch (apiError) {
          console.warn('Не удалось получить данные из API по сохраненному ID:', apiError);
        }
        
        // Если не удалось получить данные из API, создаем временного пользователя
        // с сохраненным ID и номером ошибки для отслеживания
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        return {
          id: savedTelegramId,
          first_name: 'ID: ' + savedTelegramId,
          last_name: '',
          username: 'error_' + timestamp,
          photo_url: 'https://i.pravatar.cc/300?u=' + timestamp,
          telegram_id: savedTelegramId
        };
      }
    } catch (e) {
      console.warn('Не удалось получить ID из localStorage в режиме ошибки:', e);
    }
    
    // Если всё остальное не сработало, используем случайный ID
    const emergencyId = Math.floor(Math.random() * 1000000) + 2000;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    
    // В случае критической ошибки возвращаем данные с временной меткой для отслеживания
    return {
      id: emergencyId,
      first_name: 'Ошибка',
      last_name: timestamp,
      username: 'error_' + timestamp,
      photo_url: 'https://i.pravatar.cc/300?u=error_' + timestamp,
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