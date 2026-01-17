import React, { useState, useEffect } from 'react';
import VotingTimer from './VotingTimer.jsx';
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
  votingDuration = 20,
  hasVoted, 
  userVoteValue,
  votes,
  onVoteSubmitted, 
  setError 
}) {
  const [selectedVote, setSelectedVote] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [previousStoryId, setPreviousStoryId] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);

  console.log('VotingInterface render:', { 
    sessionState, 
    storyId: currentStory?.id, 
    hasVoted,
    userVoteValue,
    selectedVote,
    submittingVote,
    previousStoryId,
    votingStartTime,
    votingDuration,
    timeExpired
  });

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

  // Reset timer state when new voting starts
  useEffect(() => {
    if (sessionState === 'active' && votingStartTime) {
      console.log('VotingInterface: Active voting started, resetting timer state');
      setTimeExpired(false);
    }
  }, [sessionState, votingStartTime]);

  // Logic for managing selected vote based on story and voting state
  useEffect(() => {
    const currentStoryId = safeCurrentStory?.id;
    
    // Case 1: New story detected - reset everything
    if (currentStoryId && currentStoryId !== previousStoryId) {
      console.log('VotingInterface: New story detected, resetting vote states');
      console.log('VotingInterface: Previous story ID:', previousStoryId, 'Current story ID:', currentStoryId);
      setSelectedVote('');
      setTimeExpired(false);
      setPreviousStoryId(currentStoryId);
      return;
    }
    
    // Case 2: Session is revealing - preserve user vote display for results
    if (sessionState === 'revealing' && hasVoted && userVoteValue && currentStoryId === previousStoryId) {
      console.log('VotingInterface: Revealing votes - showing user vote:', userVoteValue);
      setSelectedVote(userVoteValue);
      return;
    }
    
    // Case 3: Same story, but user hasn't voted and session is active - don't reset!
    if (sessionState === 'active' && !hasVoted && currentStoryId === previousStoryId) {
      console.log('VotingInterface: Same story, user not voted yet - preserving selected vote');
      return;
    }
    
    // Case 4: User has voted - show their vote
    if (hasVoted && userVoteValue && currentStoryId === previousStoryId) {
      console.log('VotingInterface: User has voted, setting selected vote to:', userVoteValue);
      setSelectedVote(userVoteValue);
      return;
    }
    
    // Case 5: No story or session not active/revealing - clear selection
    if (!currentStoryId || (sessionState !== 'active' && sessionState !== 'revealing')) {
      console.log('VotingInterface: No story or not active/revealing, clearing selected vote');
      setSelectedVote('');
      setPreviousStoryId(currentStoryId);
      return;
    }
    
  }, [sessionState, safeCurrentStory?.id, hasVoted, userVoteValue, previousStoryId]);

  const handleCardClick = async (cardValue) => {
    console.log('VotingInterface: Vote button clicked:', cardValue);
    
    // Check if voting is still allowed
    if (sessionState !== 'active' || hasVoted || submittingVote || !safeCurrentStory || timeExpired) {
      console.log('VotingInterface: Vote rejected - invalid state');
      return;
    }

    setSelectedVote(cardValue);
    setSubmittingVote(true);

    try {
      console.log('VotingInterface: Submitting vote to server');
      const result = await service.submitVote(session.id, safeCurrentStory.id, cardValue);
      
      if (result.success) {
        console.log('VotingInterface: Vote submitted successfully to server');
        onVoteSubmitted(cardValue);
      } else {
        console.log('VotingInterface: Vote submission failed:', result.error);
        setError(result.error || 'Failed to submit vote');
        setSelectedVote('');
      }
    } catch (error) {
      console.log('VotingInterface: Vote submission error:', error);
      setError('Failed to submit vote. Please try again.');
      setSelectedVote('');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleTimeExpired = () => {
    console.log('VotingInterface: Timer expired');
    setTimeExpired(true);
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

    return (
      <div className="voting-state">
        <div className="story-info">
          <div className="story-header">
            <span className="story-number">{safeCurrentStory.number}</span>
            {votingStartTime && (
              <VotingTimer
                votingStartTime={votingStartTime}
                votingDuration={votingDuration}
                onTimeExpired={handleTimeExpired}
              />
            )}
          </div>
          <h3 className="story-title">{safeCurrentStory.short_description}</h3>
          {safeCurrentStory.description && (
            <p className="story-description">{safeCurrentStory.description}</p>
          )}
        </div>

        {timeExpired && !hasVoted ? (
          <div className="time-up-state">
            <div className="time-up-icon">⏰</div>
            <h3>Time's Up!</h3>
            <p>Voting time has expired. Waiting for scrum master to reveal results...</p>
          </div>
        ) : hasVoted ? (
          <div className="voted-state">
            <div className="voted-card">
              <div className={`selected-card ${selectedVote}`}>
                <img className="sn-result-card-selected" src={selectedVote === 'unknown' ? 'x_250424_sn_scrum8.card_unknown.svg' : ('x_250424_sn_scrum8.card_' + selectedVote + ".svg" || 'N/A')}></img>
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
                  disabled={submittingVote || timeExpired}
                >
                  <img className="sn-result-card-selected" src={card.value === 'unknown' ? 'x_250424_sn_scrum8.card_unknown.svg' : ('x_250424_sn_scrum8.card_' + card.value + ".svg" || 'N/A')}></img>
                  
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

        {/*hasVoted && userVoteValue && (
          <div className="user-vote-display">
            <h5>Your Vote:</h5>
            <div className={`user-vote-card ${userVoteValue}`}>
              {userVoteValue === 'unknown' ? '?' : userVoteValue}
            </div>
          </div>
        )*/}

        <div className="votes-grid">
          {votes && votes.length > 0 ? (
            <>
              <h5>All Votes ({votes.length}):</h5>
              {votes.map((vote, index) => (
                <div key={index} className="vote-result">
                  <div className="voter-name">{vote.voter || 'Unknown'}</div>
                  <div className={`result-card ${vote.vote || ''}`}>
                    <img className="sn-result-card" src={vote.vote === 'unknown' ? 'x_250424_sn_scrum8.card_unknown.svg' : ('x_250424_sn_scrum8.card_' + vote.vote + ".svg" || 'N/A')}></img>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="no-votes-message">
              <p>No votes to display</p>
              <small>Note: Vote data may still be loading...</small>
            </div>
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