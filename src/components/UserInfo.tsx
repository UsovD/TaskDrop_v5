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

export const UserInfo: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchUserData();
  }, []);

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
      <div className="user-name">{displayName}</div>
    </div>
  );
}; 