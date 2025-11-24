import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

const FIBONACCI_CARDS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' },
  { value: '20', label: '20' },
  { value: 'unknown', label: '?' }
];

export default function VotingInterface({ 
  service, 
  session, 
  sessionState, 
  currentStory, 
  votingStartTime, 
  votingDuration = 20, // Default to 20 seconds instead of 300
  hasVoted, 
  votes,
  onVoteSubmitted, 
  setError 
}) {
  const [selectedVote, setSelectedVote] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(votingDuration);
  const [submittingVote, setSubmittingVote] = useState(false);

  // Helper function to safely extract values from story object
  const getSafeValue = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field.display_value !== undefined) {
      return field.display_value;
    }
    if (typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    return field;
  };

  // Safe story property accessors
  const safeCurrentStory = currentStory ? {
    id: getSafeValue(currentStory.sys_id) || getSafeValue(currentStory.id),
    number: getSafeValue(currentStory.number) || 'N/A',
    short_description: getSafeValue(currentStory.short_description) || 'No description',
    description: getSafeValue(currentStory.description)
  } : null;

  // Timer countdown
  useEffect(() => {
    if (sessionState === 'active' && votingStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - votingStartTime.getTime()) / 1000);
        const remaining = Math.max(0, votingDuration - elapsed);
        setTimeRemaining(remaining);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [sessionState, votingStartTime, votingDuration]);

  // Reset selected vote when new story starts
  useEffect(() => {
    if (sessionState === 'active' && !hasVoted) {
      setSelectedVote('');
    }
  }, [sessionState, currentStory, hasVoted]);

  const handleCardClick = async (cardValue) => {
    // Check if voting is still allowed
    const votingTimeUp = timeRemaining <= 0;
    if (sessionState !== 'active' || hasVoted || submittingVote || !safeCurrentStory || votingTimeUp) return;

    setSelectedVote(cardValue);
    setSubmittingVote(true);

    try {
      const result = await service.submitVote(session.id, safeCurrentStory.id, cardValue);
      if (result.success) {
        onVoteSubmitted();
      } else {
        setError(result.error || 'Failed to submit vote');
        setSelectedVote('');
      }
    } catch (error) {
      setError('Failed to submit vote. Please try again.');
      setSelectedVote('');
    } finally {
      setSubmittingVote(false);
    }
  };

  const getProgressPercentage = () => {
    if (votingDuration === 0) return 100;
    return ((votingDuration - timeRemaining) / votingDuration) * 100;
  };

  const renderWaitingState = () => (
    <div className="waiting-state">
      <div className="waiting-icon">⏳</div>
      <h2>Waiting for Scrum Master</h2>
      <p>The Scrum Master will select a story to estimate. Please stand by...</p>
    </div>
  );

  const renderStorySelectedState = () => (
    <div className="story-selected-state">
      <div className="story-selected-icon">📋</div>
      <h2>Story Selected</h2>
      <p>The Scrum Master has selected a story. Voting will begin shortly...</p>
      {safeCurrentStory && (
        <div className="story-preview">
          <div className="story-number">{safeCurrentStory.number}</div>
          <div className="story-title">{safeCurrentStory.short_description}</div>
        </div>
      )}
    </div>
  );

  const renderVotingState = () => {
    if (!safeCurrentStory) {
      return (
        <div className="error-state">
          <p>No story information available. Please contact the scrum master.</p>
        </div>
      );
    }

    const votingTimeUp = timeRemaining <= 0;

    return (
      <div className="voting-state">
        <div className="story-info">
          <div className="story-header">
            <span className="story-number">{safeCurrentStory.number}</span>
            <div className="timer-info">
              <span className={`timer-text ${votingTimeUp ? 'time-up' : ''}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <h3 className="story-title">{safeCurrentStory.short_description}</h3>
          {safeCurrentStory.description && (
            <p className="story-description">{safeCurrentStory.description}</p>
          )}
        </div>

        <div className="timer-bar">
          <div 
            className={`timer-progress ${votingTimeUp ? 'expired' : ''}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {votingTimeUp && !hasVoted ? (
          <div className="time-up-state">
            <div className="time-up-icon">⏰</div>
            <h3>Time's Up!</h3>
            <p>Voting time has expired. Waiting for scrum master to reveal results...</p>
          </div>
        ) : hasVoted ? (
          <div className="voted-state">
            <div className="voted-card">
              <div className={`selected-card ${selectedVote}`}>
                {selectedVote === 'unknown' ? '?' : selectedVote}
              </div>
              <p>✅ Vote submitted!</p>
              <span>Waiting for others to vote...</span>
            </div>
          </div>
        ) : (
          <div className="voting-cards">
            <h4>Select your estimate:</h4>
            <div className="cards-grid">
              {FIBONACCI_CARDS.map(card => (
                <button
                  key={card.value}
                  className={`poker-card ${selectedVote === card.value ? 'selected' : ''} ${submittingVote ? 'disabled' : ''}`}
                  onClick={() => handleCardClick(card.value)}
                  disabled={submittingVote}
                >
                  <span className="card-value">{card.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRevealingState = () => {
    if (!safeCurrentStory) {
      return (
        <div className="error-state">
          <p>No story information available for results display.</p>
        </div>
      );
    }

    return (
      <div className="revealing-state">
        <div className="story-info">
          <span className="story-number">{safeCurrentStory.number}</span>
          <h3 className="story-title">{safeCurrentStory.short_description}</h3>
        </div>

        <div className="results-header">
          <h4>🎯 Vote Results</h4>
        </div>

        <div className="votes-grid">
          {votes && votes.length > 0 ? votes.map((vote, index) => (
            <div key={index} className="vote-result">
              <div className="voter-name">{vote.voter || 'Unknown'}</div>
              <div className={`result-card ${vote.vote || ''}`}>
                {vote.vote === 'unknown' ? '?' : (vote.vote || 'N/A')}
              </div>
            </div>
          )) : (
            <p>No votes to display</p>
          )}
        </div>

        <div className="waiting-master">
          <p>Waiting for Scrum Master to finalize story points...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="voting-interface">
      {sessionState === 'waiting' && renderWaitingState()}
      {sessionState === 'story_selected' && renderStorySelectedState()}
      {sessionState === 'active' && renderVotingState()}
      {sessionState === 'revealing' && renderRevealingState()}
    </div>
  );
}