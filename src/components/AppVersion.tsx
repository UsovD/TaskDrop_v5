import React, { useState } from 'react';
import { APP_VERSION, VERSION_HISTORY } from '../utils/appVersion';

interface AppVersionProps {
  className?: string;
  showDetails?: boolean;
}

export const AppVersion: React.FC<AppVersionProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Если нужен только номер версии
  if (!showDetails) {
    return (
      <div className={`app-version ${className}`}>
        <span>v{APP_VERSION}</span>
      </div>
    );
  }
  
  // Если нужна детальная информация с возможностью раскрытия
  return (
    <div className={`app-version app-version-detailed ${className}`}>
      <div className="app-version-header" onClick={toggleExpanded}>
        <span>v{APP_VERSION}</span>
        <span className={`app-version-arrow ${expanded ? 'expanded' : ''}`}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      
      {expanded && (
        <div className="app-version-history">
          {VERSION_HISTORY.map((release) => (
            <div key={release.version} className="app-version-release">
              <div className="app-version-release-header">
                <span className="app-version-number">v{release.version}</span>
                <span className="app-version-date">{release.date}</span>
              </div>
              <ul className="app-version-changes">
                {release.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 