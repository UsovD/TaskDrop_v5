import React from 'react';
import { UserInfo } from './UserInfo';

export const AppHeader: React.FC = () => {
  return (
    <div className="app-header">
      <h1 className="m-0 pt-4 px-4">TaskDrop</h1>
      <p className="text-subtitle px-4 mt-1 mb-0">Управляй своими делами</p>
      <UserInfo />
    </div>
  );
}; 