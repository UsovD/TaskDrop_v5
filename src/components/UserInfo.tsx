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

  // Используем имя из RAW данных, если доступно, иначе из userData
  const firstName = rawTelegramData?.first_name || userData.first_name;
  const lastName = rawTelegramData?.last_name || userData.last_name || '';
  const displayName = firstName + (lastName ? ` ${lastName}` : '');
  const username = rawTelegramData?.username || userData.username;
  const photoUrl = rawTelegramData?.photo_url || userData.photo_url;
  const telegramId = rawTelegramData?.id || debugInfo?.telegramId || userData.id;

  // Проверяем, похоже ли это на ошибочные данные
  const isErrorData = username?.startsWith('error_') || 
                      firstName.startsWith('ID:') || 
                      firstName === 'Ошибка';

  return (
    <div className="user-info" onClick={toggleDebug}>
      <div className="user-avatar" style={{ 
        width: '46px', 
        height: '46px', 
        overflow: 'hidden',
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={displayName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="default-avatar" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="user-details" style={{ marginLeft: '10px' }}>
        <div className="user-name" style={{ fontWeight: 'bold', fontSize: '16px' }}>{displayName}</div>
        {username && !isErrorData && 
          <div className="user-username" style={{ fontSize: '14px', color: '#8f8f8f' }}>@{username}</div>
        }
        {telegramId && <div style={{ fontSize: '12px', opacity: 0.6 }}>ID: {telegramId}</div>}
      </div>
      
      {/* Отладочная информация с улучшенным стилем */}
      {(showDebug || isErrorData) && debugInfo && (
        <div className="debug-info" style={{ 
          fontSize: '12px', 
          color: '#ccc', 
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          position: 'absolute',
          zIndex: 10,
          top: '100%',
          left: 0,
          right: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '8px' }}>Отладочная информация:</div>
          <div>Telegram ID: {debugInfo.telegramId || 'Нет'}</div>
          <div>User ID: {userData?.id || debugInfo.userId || 'Нет'}</div>
          <div>WebApp: {debugInfo.webAppAvailable ? 'Да' : 'Нет'}</div>
          
          {/* Показываем сырые данные из Telegram, если они доступны */}
          {rawTelegramData && (
            <div style={{ marginTop: '8px', padding: '8px', borderTop: '1px dashed #666' }}>
              <div style={{ color: '#2196F3', fontWeight: 'bold', marginBottom: '4px' }}>Raw Telegram Data:</div>
              <div>Name: {rawTelegramData.first_name} {rawTelegramData.last_name || ''}</div>
              {rawTelegramData.username && <div>Username: @{rawTelegramData.username}</div>}
              <div>ID: {rawTelegramData.id || 'Нет'}</div>
            </div>
          )}
          
          {/* Показываем расширенные данные из initDataUnsafe */}
          {debugInfo.rawInitData && (
            <div style={{ marginTop: '8px', padding: '8px', borderTop: '1px dashed #666' }}>
              <div style={{ color: '#FF9800', fontWeight: 'bold', marginBottom: '4px' }}>InitData Info:</div>
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
                  border: '1px solid #888',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginTop: '4px',
                  cursor: 'pointer'
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