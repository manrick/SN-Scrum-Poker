import React, { useState } from 'react';
import './SessionJoiner.css';

export default function SessionJoiner({ service, onSessionJoined, loading, setLoading, setError }) {
  const [sessionCode, setSessionCode] = useState('');

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    try {
      const result = await service.joinSession(sessionCode.trim().toUpperCase());
      if (result.success) {
        onSessionJoined({
          id: result.session_id,
          name: result.session_name,
          isScrumMaster: result.is_scrum_master
        });
      } else {
        setError(result.error || 'Failed to join session');
      }
    } catch (error) {
      setError('Failed to join session. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSessionCode = (value) => {
    // Auto-format to uppercase and limit to 6 characters
    return value.toUpperCase().slice(0, 6);
  };

  return (
    <div className="session-joiner">
      <div className="joiner-card">
        <div className="poker-icon"><img className="king-card" src="x_250424_sn_scrum8.card_king.svg"></img></div>
        <h2>Join Poker Session</h2>
        <p>Enter the session code provided by your Scrum Master</p>
        
        <form onSubmit={handleJoinSession}>
          <div className="form-group">
            <label htmlFor="sessionCode">Session Code</label>
            <input
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(formatSessionCode(e.target.value))}
              placeholder="ABC123"
              disabled={loading}
              className="session-code-input"
              maxLength={6}
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

        <div className="help-section">
          <h3>Need the code?</h3>
          <p>Ask your Scrum Master for the 6-character session code. It will look something like <strong>ABC123</strong>.</p>
        </div>
      </div>
    </div>
  );
}