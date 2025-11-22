import React, { useState } from 'react';
import './SessionCreator.css';

export default function SessionCreator({ service, onSessionCreated, loading, setLoading, setError }) {
  const [sessionName, setSessionName] = useState('');

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      console.log('Attempting to create session with name:', sessionName.trim());
      const result = await service.createSession(sessionName.trim());
      console.log('Create session response:', result);
      
      if (result && result.success) {
        onSessionCreated({
          id: result.session_id,
          name: sessionName.trim(),
          code: result.session_code
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

  return (
    <div className="session-creator">
      <div className="creator-card">
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
        
        <div className="debug-section" style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666' }}>
          <p>Debug Info: Using Ajax class 'x_250424_sn_scrum8.ScrumPokerAjax'</p>
        </div>
      </div>
    </div>
  );
}