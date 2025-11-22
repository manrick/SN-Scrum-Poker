import React, { useState } from 'react';
import './SessionCreator.css';

export default function SessionCreator({ service, onSessionCreated, loading, setLoading, setError }) {
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [mode, setMode] = useState('create'); // 'create' or 'join'

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to create session with name:', sessionName.trim());
      const result = await service.createSession(sessionName.trim());
      console.log('Create session response:', result);
      
      if (result && result.success) {
        onSessionCreated({
          id: result.session_id,
          name: sessionName.trim(),
          code: result.session_code,
          isMaster: true
        });
      } else {
        const errorMsg = result?.error || 'Failed to create session - no response from server';
        console.error('Session creation failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Exception during session creation:', error);
      setError(`Failed to create session: ${error.message}. Please check the browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to join session with code:', sessionCode.trim());
      const result = await service.joinSession(sessionCode.trim());
      console.log('Join session response:', result);
      
      if (result && result.success) {
        onSessionCreated({
          id: result.session_id,
          name: result.session_name,
          code: sessionCode.trim(),
          isMaster: result.is_scrum_master
        });
      } else {
        const errorMsg = result?.error || 'Failed to join session - no response from server';
        console.error('Session join failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Exception during session join:', error);
      setError(`Failed to join session: ${error.message}. Please check the browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-creator">
      <div className="creator-card">
        <div className="mode-selector">
          <button 
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
            disabled={loading}
          >
            Create New Session
          </button>
          <button 
            className={`mode-button ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
            disabled={loading}
          >
            Join Existing Session
          </button>
        </div>

        {mode === 'create' ? (
          <>
            <h2>Create New Poker Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label htmlFor="sessionName">Session Name</label>
                <input
                  id="sessionName"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name (e.g., Sprint 23 Planning)"
                  disabled={loading}
                  maxLength={100}
                />
              </div>
              
              <button 
                type="submit" 
                className="create-button"
                disabled={loading || !sessionName.trim()}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </form>

            <div className="info-section">
              <h3>How it works:</h3>
              <ol>
                <li>Create a session with a descriptive name</li>
                <li>Share the generated session code with your team</li>
                <li>Select stories to estimate and guide the voting process</li>
                <li>Reveal votes and decide on final story points</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <h2>Join Existing Session</h2>
            <form onSubmit={handleJoinSession}>
              <div className="form-group">
                <label htmlFor="sessionCode">Session Code</label>
                <input
                  id="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character session code (e.g., ABC123)"
                  disabled={loading}
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <button 
                type="submit" 
                className="join-button"
                disabled={loading || !sessionCode.trim()}
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </form>

            <div className="info-section">
              <h3>Join as Scrum Master:</h3>
              <ol>
                <li>Enter the session code shared by your team</li>
                <li>If you created the session, you'll have master privileges</li>
                <li>You can take over session management from another device</li>
                <li>Start voting rounds and manage the estimation process</li>
              </ol>
            </div>
          </>
        )}
        
        <div className="debug-section" style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666' }}>
          <p>Debug Info: Using API endpoint '/api/x_250424_sn_scrum8/scrum_poker'</p>
        </div>
      </div>
    </div>
  );
}