import React, { useState, useEffect } from 'react';
import { getUserData } from '../utils/userHelper';
import '../css/components.css';

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// Отладочный компонент для данных WebApp
const WebAppDebug: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    // Собираем данные для отладки
    const data = {
      telegramAvailable: !!window.Telegram,
      webAppAvailable: !!window.Telegram?.WebApp,
      initData: window.Telegram?.WebApp?.initData || '',
      initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || {},
      urlHash: window.location.hash,
      href: window.location.href
    };
    setDebugData(data);
  }, []);

  if (!isVisible || !debugData) {
    return (
      <button 
        onClick={() => setIsVisible(true)} 
        className="debug-button"
        title="Показать отладочную информацию">
        🛠️
      </button>
    );
  }

  return (
    <div className="webapp-debug">
      <div className="debug-header">
        <h3>🔧 Отладочная информация</h3>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
      <div className="debug-content">
        <p><strong>Telegram доступен:</strong> {debugData.telegramAvailable ? '✅' : '❌'}</p>
        <p><strong>WebApp доступен:</strong> {debugData.webAppAvailable ? '✅' : '❌'}</p>
        
        <h4>URL информация:</h4>
        <pre className="debug-code">{debugData.href}</pre>
        
        <h4>URL hash:</h4>
        <pre className="debug-code">{debugData.urlHash}</pre>
        
        <h4>initData:</h4>
        <pre className="debug-code">{debugData.initData}</pre>
        
        <h4>initDataUnsafe:</h4>
        <pre className="debug-code">{JSON.stringify(debugData.initDataUnsafe, null, 2)}</pre>
      </div>
    </div>
  );
};

export const UserInfo: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0); // счетчик для форсирования обновления

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await getUserData();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Не удалось загрузить данные пользователя');
    } finally {
      setLoading(false);
    }
  };

  // Принудительное обновление данных пользователя
  const handleRefresh = () => {
    // Очищаем localStorage от моковых данных
    try {
      window.localStorage.removeItem('tgWebAppData');
      window.localStorage.removeItem('launchParams');
      console.log('🧹 Кэш очищен');
      
      // Форсируем обновление данных пользователя
      setUpdateCount(prev => prev + 1);
    } catch (e) {
      console.error('Ошибка при очистке кэша:', e);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [updateCount]); // зависимость от счетчика обновлений

  if (loading) {
    return <div className="user-info-skeleton"></div>;
  }

  if (error || !userData) {
    return (
      <div className="user-info user-info-error">
        <div className="user-avatar default-avatar"></div>
        <div className="user-name">Пользователь</div>
        <WebAppDebug />
      </div>
    );
  }

  const displayName = userData.first_name + (userData.last_name ? ` ${userData.last_name}` : '');
  const isTestUser = userData.first_name === 'Тестовый' && userData.last_name === 'Пользователь';

  return (
    <div className="user-info">
      <div className="user-avatar">
        {userData.photo_url ? (
          <img src={userData.photo_url} alt={displayName} />
        ) : (
          <div className="default-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="user-info-container">
        <div className="user-name">{displayName}</div>
        {isTestUser && (
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            title="Очистить кэш и обновить данные"
          >
            🔄
          </button>
        )}
      </div>
      <WebAppDebug />
    </div>
  );
}; 