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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
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
      <div className="user-name">{displayName}</div>
      {userData.username && <div className="user-username">@{userData.username}</div>}
      
      {showDebug && debugInfo && (
        <div className="debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
          <div>Telegram ID: {debugInfo.telegramId || 'Нет'}</div>
          <div>User ID: {userData?.id || debugInfo.userId || 'Нет'}</div>
          <div>WebApp: {debugInfo.webAppAvailable ? 'Да' : 'Нет'}</div>
        </div>
      )}
    </div>
  );
}; 