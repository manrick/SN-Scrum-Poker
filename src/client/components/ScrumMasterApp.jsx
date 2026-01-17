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
  const [ambInitialized, setAmbInitialized] = useState(false);

  const handleSessionCreated = (session) => {
    setCurrentSession(session);
    setError('');
  };

  const handleBackToStart = () => {
    setCurrentSession(null);
    setError('');
  };

  // Initialize AMB and check connection status after page load
  useEffect(() => {
    let mounted = true;
    
    const initializeService = async () => {
      try {
        // Ensure AMB is initialized (this waits for page load)
        await service.ensureAMBInitialization();
        
        if (!mounted) return;
        
        setAmbInitialized(true);
        
        // Check connection status
        const checkConnection = async () => {
          if (!mounted) return;
          
          try {
            const status = await service.getConnectionStatus();
            setConnectionStatus(status.connected ? 'connected' : 'offline');
          } catch (error) {
            console.error('Error checking connection status:', error);
            setConnectionStatus('offline');
          }
        };
        
        // Check immediately
        await checkConnection();
        
        // Only check connection status periodically (not data)
        const statusInterval = setInterval(checkConnection, 5000);
        
        return () => {
          clearInterval(statusInterval);
        };
        
      } catch (error) {
        console.error('Error initializing AMB service:', error);
        if (mounted) {
          setConnectionStatus('error');
          setAmbInitialized(true); // Still allow the app to function
        }
      }
    };

    const cleanup = initializeService();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
      service.disconnect();
    };
  }, [service]);

  const getConnectionIcon = () => {
    if (!ambInitialized) return '⏳';
    
    switch (connectionStatus) {
      case 'connected': return '🔗';
      case 'offline': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getConnectionText = () => {
    if (!ambInitialized) return 'Initializing real-time...';
    
    switch (connectionStatus) {
      case 'connected': return 'Real-time mode active';
      case 'offline': return 'Real-time unavailable';
      case 'error': return 'Real-time error';
      default: return 'Connecting to real-time...';
    }
  };

  return (
    <div className="scrum-master-app">
      <header className="app-header">
        <h1><img className="king-card-header" src="x_250424_sn_scrum8.sn-scrum-poker-cards.png"></img> Scrum Poker (Scrum master view)</h1>
        <p>Manage your story estimation sessions with real-time updates</p>
        <div className={`websocket-status ${ambInitialized ? connectionStatus : 'initializing'}`}>
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
            ambInitialized={ambInitialized}
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