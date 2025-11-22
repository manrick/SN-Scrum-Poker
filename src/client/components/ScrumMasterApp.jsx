import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerService } from '../services/ScrumPokerService.js';
import SessionCreator from './SessionCreator.jsx';
import SessionManager from './SessionManager.jsx';
import './ScrumMasterApp.css';

export default function ScrumMasterApp() {
  const service = useMemo(() => new ScrumPokerService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSessionCreated = (session) => {
    setCurrentSession(session);
    setError('');
  };

  const handleBackToStart = () => {
    setCurrentSession(null);
    setError('');
  };

  return (
    <div className="scrum-master-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker Master</h1>
        <p>Manage your story estimation sessions</p>
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
          <SessionManager
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