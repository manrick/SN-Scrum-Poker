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
  votingDuration, 
  hasVoted, 
  votes,
  onVoteSubmitted, 
  setError 
}) {
  const [selectedVote, setSelectedVote] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(votingDuration);
  const [submittingVote, setSubmittingVote] = useState(false);

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
    if (sessionState !== 'active' || hasVoted || submittingVote) return;

    setSelectedVote(cardValue);
    setSubmittingVote(true);

    try {
      const result = await service.submitVote(session.id, currentStory.id, cardValue);
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

  const renderVotingState = () => (
    <div className="voting-state">
      <div className="story-info">
        <div className="story-header">
          <span className="story-number">{currentStory.number}</span>
          <div className="timer-info">
            <span className="timer-text">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <h3 className="story-title">{currentStory.short_description}</h3>
        {currentStory.description && (
          <p className="story-description">{currentStory.description}</p>
        )}
      </div>

      <div className="timer-bar">
        <div 
          className="timer-progress" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {hasVoted ? (
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

  const renderRevealingState = () => (
    <div className="revealing-state">
      <div className="story-info">
        <span className="story-number">{currentStory.number}</span>
        <h3 className="story-title">{currentStory.short_description}</h3>
      </div>

      <div className="results-header">
        <h4>🎯 Vote Results</h4>
      </div>

      <div className="votes-grid">
        {votes.map((vote, index) => (
          <div key={index} className="vote-result">
            <div className="voter-name">{vote.voter}</div>
            <div className={`result-card ${vote.vote}`}>
              {vote.vote === 'unknown' ? '?' : vote.vote}
            </div>
          </div>
        ))}
      </div>

      <div className="waiting-master">
        <p>Waiting for Scrum Master to finalize story points...</p>
      </div>
    </div>
  );

  return (
    <div className="voting-interface">
      {sessionState === 'waiting' && renderWaitingState()}
      {sessionState === 'active' && currentStory && renderVotingState()}
      {sessionState === 'revealing' && currentStory && renderRevealingState()}
    </div>
  );
}