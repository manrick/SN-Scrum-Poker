import React, { useState, useEffect } from 'react';
import './VotingManager.css';

const FIBONACCI_VALUES = ['1', '2', '3', '5', '8', '13', '20', 'unknown'];

export default function VotingManager({ 
  story, 
  sessionState, 
  votingStartTime, 
  votingDuration, 
  voteCount, 
  participantCount, 
  votes, 
  onRevealVotes, 
  onFinalizePoints 
}) {
  const [timeRemaining, setTimeRemaining] = useState(votingDuration);
  const [selectedFinalPoints, setSelectedFinalPoints] = useState('');

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

  const getProgressPercentage = () => {
    if (votingDuration === 0) return 100;
    return ((votingDuration - timeRemaining) / votingDuration) * 100;
  };

  const getVoteDistribution = () => {
    const distribution = {};
    votes.forEach(vote => {
      distribution[vote.vote] = (distribution[vote.vote] || 0) + 1;
    });
    return distribution;
  };

  const getMostCommonVote = () => {
    const distribution = getVoteDistribution();
    return Object.keys(distribution).reduce((a, b) => 
      distribution[a] > distribution[b] ? a : b, '');
  };

  const handleFinalize = () => {
    if (selectedFinalPoints) {
      onFinalizePoints(selectedFinalPoints);
    }
  };

  return (
    <div className="voting-manager">
      <div className="story-display">
        <h3>Current Story</h3>
        <div className="story-info">
          <div className="story-number">{story.number}</div>
          <div className="story-description">
            <h4>{story.short_description}</h4>
            {story.description && (
              <p className="story-details">{story.description}</p>
            )}
          </div>
        </div>
      </div>

      {sessionState === 'active' && (
        <div className="voting-active">
          <div className="voting-header">
            <h4>🗳️ Voting in Progress</h4>
            <div className="vote-stats">
              {voteCount} of {participantCount} voted
            </div>
          </div>

          <div className="timer-container">
            <div className="timer-display">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="timer-bar">
              <div 
                className="timer-progress" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          <div className="voting-controls">
            <button 
              className="reveal-button"
              onClick={onRevealVotes}
              disabled={voteCount === 0}
            >
              Reveal Votes ({voteCount})
            </button>
          </div>
        </div>
      )}

      {sessionState === 'revealing' && votes.length > 0 && (
        <div className="votes-revealed">
          <h4>🎯 Vote Results</h4>
          
          <div className="votes-grid">
            {votes.map((vote, index) => (
              <div key={index} className="vote-card">
                <div className="voter-name">{vote.voter}</div>
                <div className={`vote-value ${vote.vote}`}>
                  {vote.vote === 'unknown' ? '?' : vote.vote}
                </div>
              </div>
            ))}
          </div>

          <div className="vote-summary">
            <h5>Vote Distribution:</h5>
            <div className="distribution">
              {Object.entries(getVoteDistribution()).map(([value, count]) => (
                <span key={value} className="distribution-item">
                  {value === 'unknown' ? '?' : value}: {count}
                </span>
              ))}
            </div>
            <div className="suggested-value">
              Most common: <strong>{getMostCommonVote() === 'unknown' ? '?' : getMostCommonVote()}</strong>
            </div>
          </div>

          <div className="finalize-section">
            <h5>Finalize Story Points:</h5>
            <div className="points-selector">
              {FIBONACCI_VALUES.map(value => (
                <button
                  key={value}
                  className={`point-option ${selectedFinalPoints === value ? 'selected' : ''}`}
                  onClick={() => setSelectedFinalPoints(value)}
                >
                  {value === 'unknown' ? '?' : value}
                </button>
              ))}
            </div>
            <button 
              className="finalize-button"
              onClick={handleFinalize}
              disabled={!selectedFinalPoints}
            >
              Set Story Points
            </button>
          </div>
        </div>
      )}
    </div>
  );
}