import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerWebSocketService } from '../services/ScrumPokerWebSocketService.js';
import SessionCreator from './SessionCreator.jsx';
import SessionManagerWebSocket from './SessionManagerWebSocket.jsx';
import './ScrumMasterApp.css';

// THIS IS NOW THE WEBSOCKET VERSION - NO POLLING!
export default function ScrumMasterApp() {
  const service = useMemo(() => new ScrumPokerWebSocketService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const handleSessionCreated = (session) => {
    setCurrentSession(session);
    setError('');
  };

  const handleBackToStart = () => {
    setCurrentSession(null);
    setError('');
  };

  // Check connection status - NO DATA POLLING!
  useEffect(() => {
    const checkConnection = () => {
      const status = service.getConnectionStatus();
      setConnectionStatus(status.connected ? 'connected' : 'offline');
    };
    
    // Check immediately
    checkConnection();
    
    // Only check connection status periodically (not data)
    const statusInterval = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(statusInterval);
      service.disconnect();
    };
  }, [service]);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🔗';
      case 'offline': return '⚠️';
      default: return '⏳';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Real-time mode active';
      case 'offline': return 'Real-time unavailable';
      default: return 'Connecting to real-time...';
    }
  };

  return (
    <div className="scrum-master-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker Master (WebSocket)</h1>
        <p>Manage your story estimation sessions with real-time updates</p>
        <div className={`websocket-status ${connectionStatus}`}>
          <span className="status-icon">{getConnectionIcon()}</span>
          <span className="status-text">{getConnectionText()}</span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <main className="app-content">
        {!currentSession ? (
          <SessionCreator 
            service={service}
            onSessionCreated={handleSessionCreated}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        ) : (
          <SessionManagerWebSocket
            service={service}
            session={currentSession}
            onBackToStart={handleBackToStart}
            setError={setError}
          />
        )}
      </main>
    </div>
  );
}