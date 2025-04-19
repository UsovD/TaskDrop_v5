import React, { useState, useEffect } from 'react';
import { getUserData, getTelegramDebugInfo } from '../utils/userHelper';
import '../css/components.css';

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const UserInfo: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ReturnType<typeof getTelegramDebugInfo> | null>(null);
  const [rawTelegramData, setRawTelegramData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Сохраняем сырые данные Telegram для отладки
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          setRawTelegramData(window.Telegram.WebApp.initDataUnsafe.user);
          console.log('Raw Telegram User Data:', window.Telegram.WebApp.initDataUnsafe.user);
        } else {
          console.warn('Raw Telegram User Data not available');
        }
        
        const data = await getUserData();
        setUserData(data);
        setError(null);
        setDebugInfo(getTelegramDebugInfo());
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Не удалось загрузить данные пользователя');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  if (loading) {
    return <div className="user-info-skeleton"></div>;
  }

  if (error || !userData) {
    return (
      <div className="user-info user-info-error">
        <div className="user-avatar default-avatar"></div>
        <div className="user-name">Пользователь</div>
      </div>
    );
  }

  const displayName = userData.first_name + (userData.last_name ? ` ${userData.last_name}` : '');

  // Проверяем, похоже ли это на ошибочные данные
  const isErrorData = userData.username?.startsWith('error_') || 
                      userData.first_name.startsWith('ID:') || 
                      userData.first_name === 'Ошибка';

  return (
    <div className="user-info" onClick={toggleDebug}>
      <div className="user-avatar">
        {userData.photo_url ? (
          <img src={userData.photo_url} alt={displayName} />
        ) : (
          <div className="default-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Показываем имя пользователя в зависимости от состояния */}
      <div className="user-details">
        <div className="user-name">{displayName}</div>
        {userData.username && !isErrorData && 
          <div className="user-username">@{userData.username}</div>
        }
      </div>
      
      {/* Всегда показываем отладочную информацию если есть несоответствие данных */}
      {(showDebug || isErrorData) && debugInfo && (
        <div className="debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '4px' }}>Отладочная информация:</div>
          <div>Telegram ID: {debugInfo.telegramId || 'Нет'}</div>
          <div>User ID: {userData?.id || debugInfo.userId || 'Нет'}</div>
          <div>WebApp: {debugInfo.webAppAvailable ? 'Да' : 'Нет'}</div>
          
          {/* Показываем сырые данные из Telegram, если они доступны */}
          {rawTelegramData && (
            <div style={{ marginTop: '4px', padding: '4px', borderTop: '1px dashed #444' }}>
              <div style={{ color: '#2196F3', fontWeight: 'bold', marginBottom: '2px' }}>Raw Telegram Data:</div>
              <div>Name: {rawTelegramData.first_name} {rawTelegramData.last_name || ''}</div>
              {rawTelegramData.username && <div>Username: @{rawTelegramData.username}</div>}
              <div>ID: {rawTelegramData.id || 'Нет'}</div>
            </div>
          )}
          
          {/* Показываем расширенные данные из initDataUnsafe */}
          {debugInfo.rawInitData && (
            <div style={{ marginTop: '4px', padding: '4px', borderTop: '1px dashed #444' }}>
              <div style={{ color: '#FF9800', fontWeight: 'bold', marginBottom: '2px' }}>InitData Info:</div>
              <div>Chat Type: {debugInfo.rawInitData.chat_type || 'Нет'}</div>
              <div>Start Param: {debugInfo.rawInitData.start_param || 'Нет'}</div>
              <div>Auth Date: {debugInfo.rawInitData.auth_date || 'Нет'}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Full InitData:', debugInfo.rawInitData);
                  alert('Полные данные записаны в консоль');
                }}
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#fff',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  marginTop: '2px'
                }}
              >
                Подробнее в консоли
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 