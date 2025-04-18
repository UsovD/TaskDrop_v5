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
        initData?: string;
      };
    };
  }
}

/**
 * Получает данные пользователя из Telegram WebApp
 */
export const getUserData = async (): Promise<UserData> => {
  try {
    console.log('🔍 Начинаем получение данных пользователя');
    
    // Проверяем наличие хэша в URL (данные от бота)
    const urlHash = window.location.hash;
    console.log('🔗 URL hash:', urlHash);
    
    if (urlHash.includes('tgWebAppData')) {
      console.log('🔍 Найден tgWebAppData в URL hash, пытаемся извлечь');
      
      // Извлекаем параметры из URL hash
      const hashParams = new URLSearchParams(urlHash.substring(1));
      const tgWebAppData = hashParams.get('tgWebAppData');
      
      if (tgWebAppData) {
        console.log('🔍 Извлечен tgWebAppData:', tgWebAppData);
        
        try {
          const dataParams = new URLSearchParams(tgWebAppData);
          const userJson = dataParams.get('user');
          
          if (userJson) {
            console.log('🔍 Найден параметр user в tgWebAppData:', userJson);
            const user = JSON.parse(userJson);
            
            console.log('✅ Получены данные пользователя из URL hash:', user);
            
            return {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              photo_url: user.photo_url
            };
          } else {
            console.log('❌ Параметр user не найден в tgWebAppData');
          }
        } catch (err) {
          console.error('❌ Ошибка при парсинге tgWebAppData из URL:', err);
        }
      }
    }
    
    // Проверяем, запущено ли приложение в Telegram
    console.log('📱 Проверяем запуск в среде Telegram...');
    const isTelegram = await isTMA('complete');
    console.log(`📱 Результат проверки isTMA: ${isTelegram}`);
    
    if (!isTelegram) {
      // При запуске вне Telegram используем тестовый ID
      console.log('❌ Приложение запущено вне Telegram, используется тестовый user_id');
      return getMockUserData();
    }
    
    // В Telegram Web App пользовательские данные доступны через window.Telegram.WebApp
    const telegramWebApp = window.Telegram?.WebApp;
    console.log('📋 Проверяем наличие объекта WebApp:', !!telegramWebApp);
    
    if (telegramWebApp) {
      console.log('📋 Проверяем наличие initDataUnsafe:', !!telegramWebApp.initDataUnsafe);
      console.log('📋 Проверяем наличие initData:', !!telegramWebApp.initData);
      
      if (telegramWebApp.initDataUnsafe && telegramWebApp.initDataUnsafe.user) {
        const user = telegramWebApp.initDataUnsafe.user;
        console.log(`✅ Получен реальный Telegram ID пользователя: ${user.id}`);
        console.log(`✅ Имя пользователя: ${user.first_name} ${user.last_name || ''}`);
        
        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url
        };
      }
      
      // Проверяем наличие initData и пытаемся распарсить
      if (telegramWebApp.initData) {
        console.log('🔄 Пытаемся распарсить данные из initData:', telegramWebApp.initData);
        try {
          const searchParams = new URLSearchParams(telegramWebApp.initData);
          const userParam = searchParams.get('user');
          
          if (userParam) {
            console.log('🔍 Найден параметр user в initData:', userParam);
            const user = JSON.parse(userParam);
            console.log(`✅ Получен пользователь из initData: ${user.id}`);
            console.log(`✅ Имя пользователя: ${user.first_name} ${user.last_name || ''}`);
            
            return {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              photo_url: user.photo_url
            };
          }
          console.log('❌ Не удалось получить параметр user из initData');
          
          // Выводим все доступные параметры
          console.log('🔍 Доступные параметры в initData:');
          for (const [key, value] of searchParams.entries()) {
            console.log(`   - ${key}: ${value}`);
          }
        } catch (err) {
          console.error('❌ Ошибка при парсинге initData:', err);
        }
      }
    }
    
    console.log('❌ Не удалось получить данные пользователя из Telegram WebApp, используется тестовый user_id');
    return getMockUserData();
  } catch (error) {
    console.error('❌ Ошибка при получении данных пользователя:', error);
    return getMockUserData();
  }
};

/**
 * Возвращает фиктивные данные пользователя для тестирования
 */
const getMockUserData = (): UserData => {
  // Для тестирования используем отдельный ID, чтобы не смешивать данные с реальными пользователями
  const testUserId = 999999;
  console.log(`⚠️ Используется тестовый ID: ${testUserId}`);
  
  return {
    id: testUserId,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    photo_url: undefined
  };
}; 