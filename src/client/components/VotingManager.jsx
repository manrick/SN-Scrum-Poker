import React, { useState, useEffect } from 'react';
import './VotingManager.css';

const FIBONACCI_VALUES = ['1', '2', '3', '5', '8', '13', '20', 'unknown'];

export default function VotingManager({ 
  story, 
  sessionState, 
  votingStartTime, 
  votingDuration = 20,
  voteCount, 
  participantCount, 
  votes, 
  onRevealVotes, 
  onFinalizePoints,
  onSelectDifferentStory,
  onRestartVoting,
  isScrumMaster = true
}) {
  const [timeRemaining, setTimeRemaining] = useState(votingDuration);
  const [selectedFinalPoints, setSelectedFinalPoints] = useState('');

  console.log('VotingManager render:', {
    sessionState,
    votingStartTime: votingStartTime ? votingStartTime.toString() : 'null',
    votingDuration,
    timeRemaining
  });

  // FIXED: Better timer initialization and management
  useEffect(() => {
    if (sessionState === 'active' && votingStartTime) {
      console.log('VotingManager: Starting timer with:', {
        votingStartTime: votingStartTime.toString(),
        votingDuration
      });

      // Calculate initial time remaining
      const now = Date.now();
      const elapsed = Math.floor((now - votingStartTime.getTime()) / 1000);
      const initial = Math.max(0, votingDuration - elapsed);
      
      console.log('VotingManager: Initial timer calculation:', {
        now: new Date(now).toString(),
        elapsed,
        initial
      });

      setTimeRemaining(initial);

      const interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - votingStartTime.getTime()) / 1000);
        const remaining = Math.max(0, votingDuration - currentElapsed);
        
        console.log('VotingManager: Timer tick:', {
          currentElapsed,
          remaining,
          votingDuration
        });
        
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          console.log('VotingManager: Timer expired');
          clearInterval(interval);
        }
      }, 1000); // Update every second

      return () => {
        console.log('VotingManager: Cleaning up timer interval');
        clearInterval(interval);
      };
    } else {
      // Reset timer when not in active state
      console.log('VotingManager: Resetting timer to duration:', votingDuration);
      setTimeRemaining(votingDuration);
    }
  }, [sessionState, votingStartTime, votingDuration]);

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
  const storyNumber = getSafeValue(story?.number) || 'N/A';
  const storyShortDescription = getSafeValue(story?.short_description) || 'No description';
  const storyDescription = getSafeValue(story?.description);

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

  const isVotingTimeExpired = timeRemaining <= 0 && sessionState === 'active';
  const hasNoVotes = voteCount === 0;

  if (!story) {
    return (
      <div className="voting-manager">
        <div className="error-message">
          <p>No story selected. Please select a story to begin voting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-manager">
      <div className="story-display">
        <div className="story-info">
          <div className="story-number">{storyNumber}</div>
          <div className="story-description">
            <h4>{storyShortDescription}</h4>
            {storyDescription && (
              <p className="story-details">{storyDescription}</p>
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
            <div className={`timer-display ${isVotingTimeExpired ? 'expired' : ''}`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="timer-bar">
              <div 
                className={`timer-progress ${isVotingTimeExpired ? 'expired' : ''}`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {isVotingTimeExpired && hasNoVotes ? (
            // Timer expired with no votes - show recovery options
            <div className="voting-expired">
              <div className="expired-message">
                <h4>⏰ Time's Up!</h4>
                <p>No votes were submitted. What would you like to do?</p>
              </div>
              {isScrumMaster && (
                <div className="recovery-options">
                  <button 
                    className="restart-voting-button"
                    onClick={onRestartVoting}
                  >
                    🔄 Restart Voting ({votingDuration}s)
                  </button>
                  <button 
                    className="select-different-story-button"
                    onClick={onSelectDifferentStory}
                  >
                    ← Select Different Story
                  </button>
                </div>
              )}
            </div>
          ) : isScrumMaster ? (
            <div className="voting-controls">
              <button 
                className="reveal-button"
                onClick={onRevealVotes}
                disabled={voteCount === 0}
              >
                {isVotingTimeExpired ? 'Reveal Votes (Time Expired)' : `Reveal Votes (${voteCount})`}
              </button>
              {voteCount > 0 && (
                <button 
                  className="restart-voting-button secondary"
                  onClick={onRestartVoting}
                >
                  🔄 Restart Voting
                </button>
              )}
            </div>
          ) : (
            <div className="participant-message">
              <p>
                {isVotingTimeExpired 
                  ? 'Voting time has expired. Waiting for scrum master...'
                  : 'Submit your estimate on the participant interface. Waiting for scrum master to reveal votes.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {sessionState === 'revealing' && (
        <div className="votes-revealed">
          <h4>🎯 Vote Results</h4>
          
          {votes.length > 0 ? (
            <>
              <div className="votes-grid">
                {votes.map((vote, index) => (
                  <div key={index} className="vote-card">
                    <div className="voter-name">{vote.voter || 'Unknown'}</div>
                    <div className={`vote-value ${vote.vote}`}>
                    <img className="sn-result-card" src={vote.vote === 'unknown' ? 'x_250424_sn_scrum8.card_unknown.svg' : ('x_250424_sn_scrum8.card_' + vote.vote + ".svg" || 'N/A')}></img>
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

              {isScrumMaster ? (
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
                  <div className="finalize-actions">
                    <button 
                      className="finalize-button"
                      onClick={handleFinalize}
                      disabled={!selectedFinalPoints}
                    >
                      Set Story Points
                    </button>
                    <button 
                      className="restart-voting-button secondary"
                      onClick={onRestartVoting}
                    >
                      🔄 Vote Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="participant-message">
                  <p>Waiting for scrum master to finalize the story points.</p>
                </div>
              )}
            </>
          ) : (
            // No votes case in revealing state
            <div className="no-votes-revealed">
              <div className="no-votes-message">
                <h4>📭 No Votes Submitted</h4>
                <p>No team members submitted votes for this story.</p>
              </div>
              {isScrumMaster && (
                <div className="no-votes-options">
                  <button 
                    className="restart-voting-button"
                    onClick={onRestartVoting}
                  >
                    🔄 Start New Voting Round
                  </button>
                  <button 
                    className="select-different-story-button"
                    onClick={onSelectDifferentStory}
                  >
                    ← Select Different Story
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}