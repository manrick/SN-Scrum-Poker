import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerWebSocketService } from '../services/ScrumPokerWebSocketService.js';
import SessionCreator from './SessionCreator.jsx';
import SessionManagerWebSocket from './SessionManagerWebSocket.jsx';
import './ScrumMasterApp.css';

export default function ScrumMasterAppWebSocket() {
  const service = useMemo(() => new ScrumPokerWebSocketService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [ambInitialized, setAmbInitialized] = useState(false);

  // Initialize AMB and track initialization status
  useEffect(() => {
    let mounted = true;

    const initializeAMB = async () => {
      try {
        console.log('ScrumMasterApp: Initializing AMB...');
        
        // Wait for AMB to be initialized
        await service.ensureAMBInitialization();
        
        if (mounted) {
          setAmbInitialized(true);
          console.log('ScrumMasterApp: AMB initialized successfully');
          
          // Check initial connection status
          const status = service.getConnectionStatusSync();
          setConnectionStatus(status.connected ? 'connected' : 'offline');
        }
      } catch (error) {
        console.error('ScrumMasterApp: Error initializing AMB:', error);
        if (mounted) {
          setConnectionStatus('error');
          setAmbInitialized(false);
        }
      }
    };

    initializeAMB();

    return () => {
      mounted = false;
    };
  }, [service]);

  // Check connection status periodically
  useEffect(() => {
    if (!ambInitialized) return;

    const checkConnection = () => {
      const status = service.getConnectionStatusSync();
      setConnectionStatus(status.connected ? 'connected' : 'offline');
    };
    
    // Check periodically for connection status
    const statusInterval = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(statusInterval);
      service.disconnect();
    };
  }, [service, ambInitialized]);

  const handleSessionCreated = (session) => {
    console.log('ScrumMasterApp: Session created:', session);
    setCurrentSession(session);
    setError('');
  };

  const handleBackToStart = () => {
    setCurrentSession(null);
    setError('');
  };

  const getConnectionIcon = () => {
    if (!ambInitialized) return '⏳';
    
    switch (connectionStatus) {
      case 'connected': return '🔗';
      case 'offline': return '⚠️';
      default: return '⏳';
    }
  };

  const getConnectionText = () => {
    if (!ambInitialized) return 'Initializing real-time...';
    
    switch (connectionStatus) {
      case 'connected': return 'Real-time mode active';
      case 'offline': return 'Real-time unavailable';
      default: return 'Connecting to real-time...';
    }
  };

  return (
    <div className="scrum-master-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker Master</h1>
        <p>Manage your story estimation sessions with real-time updates</p>
        <div className={`websocket-status ${ambInitialized && connectionStatus === 'connected' ? 'connected' : 'initializing'}`}>
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
            ambInitialized={ambInitialized}
          />
        )}
      </main>
    </div>
  );
}