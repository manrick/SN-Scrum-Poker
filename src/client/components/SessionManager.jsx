import React, { useState, useEffect } from 'react';
import StorySelector from './StorySelector.jsx';
import VotingManager from './VotingManager.jsx';
import ParticipantsList from './ParticipantsList.jsx';
import './SessionManager.css';

export default function SessionManager({ service, session, onBackToStart, setError }) {
  const [sessionState, setSessionState] = useState('waiting');
  const [currentStory, setCurrentStory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingDuration, setVotingDuration] = useState(300); // 5 minutes default
  const [votes, setVotes] = useState([]);
  const [voteCount, setVoteCount] = useState(0);

  // Check if user is scrum master
  const isScrumMaster = session.isMaster !== false; // Default to true for backwards compatibility

  // Poll for session status updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const [statusResult, participantsResult] = await Promise.all([
          service.getSessionStatus(session.id),
          service.getParticipants(session.id)
        ]);

        if (statusResult.error) {
          setError(statusResult.error);
          return;
        }

        setSessionState(statusResult.state);
        setVotingDuration(statusResult.voting_duration || 300);
        
        if (statusResult.current_story && statusResult.story_details) {
          setCurrentStory({
            id: statusResult.current_story,
            ...statusResult.story_details
          });
        } else {
          setCurrentStory(null);
        }

        if (statusResult.voting_started_at) {
          setVotingStartTime(new Date(statusResult.voting_started_at));
        } else {
          setVotingStartTime(null);
        }

        if (statusResult.votes_count !== undefined) {
          setVoteCount(statusResult.votes_count);
        }

        // Get votes from session status if available (when revealing)
        if (statusResult.votes) {
          setVotes(statusResult.votes);
        } else if (statusResult.state !== 'revealing') {
          setVotes([]); // Clear votes when not revealing
        }

        if (participantsResult && Array.isArray(participantsResult)) {
          setParticipants(participantsResult);
        } else {
          console.log('Participants result:', participantsResult);
          setParticipants([]);
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [service, session.id, setError]);

  const handleStorySelected = async (story) => {
    if (!isScrumMaster) {
      setError('Only the scrum master can select stories');
      return;
    }

    // Just set the story, don't start voting yet
    setCurrentStory({
      id: story.sys_id,
      number: story.number,
      short_description: story.short_description,
      description: story.description
    });
    setSessionState('story_selected');
    setVotes([]);
    setVoteCount(0);
  };

  const handleStartVoting = async () => {
    if (!isScrumMaster || !currentStory) {
      setError('Only the scrum master can start voting');
      return;
    }

    try {
      const result = await service.startVoting(session.id, currentStory.id);
      if (result.success) {
        setVotes([]);
        setVoteCount(0);
        setVotingStartTime(new Date());
        setSessionState('active');
      } else {
        setError(result.error || 'Failed to start voting');
      }
    } catch (error) {
      setError('Failed to start voting. Please try again.');
    }
  };

  const handleRevealVotes = async () => {
    if (!isScrumMaster) {
      setError('Only the scrum master can reveal votes');
      return;
    }

    try {
      const result = await service.revealVotes(session.id);
      if (result.success) {
        setVotes(result.votes);
        setSessionState('revealing');
      } else {
        setError(result.error || 'Failed to reveal votes');
      }
    } catch (error) {
      setError('Failed to reveal votes. Please try again.');
    }
  };

  const handleFinalizePoints = async (points) => {
    if (!isScrumMaster) {
      setError('Only the scrum master can finalize story points');
      return;
    }

    try {
      const result = await service.finalizeStoryPoints(session.id, points);
      if (result.success) {
        setCurrentStory(null);
        setVotes([]);
        setVoteCount(0);
        setVotingStartTime(null);
        setSessionState('waiting');
      } else {
        setError(result.error || 'Failed to finalize story points');
      }
    } catch (error) {
      setError('Failed to finalize story points. Please try again.');
    }
  };

  const handleSelectDifferentStory = () => {
    setCurrentStory(null);
    setSessionState('waiting');
    setVotes([]);
    setVoteCount(0);
    setVotingStartTime(null);
  };

  return (
    <div className="session-manager">
      <div className="session-header">
        <div className="session-info">
          <h2>{session.name}</h2>
          <div className="session-code">
            Code: <span className="code-highlight">{session.code}</span>
            {isScrumMaster && <span className="master-badge">Scrum Master</span>}
          </div>
        </div>
        <button 
          className="back-button"
          onClick={onBackToStart}
        >
          ← New Session
        </button>
      </div>

      <div className="session-layout">
        <div className="main-content">
          {!isScrumMaster && (
            <div className="info-banner">
              <p>You've joined as a participant. Only the scrum master can manage the session.</p>
            </div>
          )}

          {sessionState === 'waiting' && isScrumMaster && (
            <StorySelector 
              service={service}
              onStorySelected={handleStorySelected}
            />
          )}

          {sessionState === 'story_selected' && isScrumMaster && currentStory && (
            <div className="story-ready">
              <div className="story-display">
                <h3>Story Selected</h3>
                <div className="story-info">
                  <div className="story-number">{currentStory.number}</div>
                  <div className="story-description">
                    <h4>{currentStory.short_description}</h4>
                    {currentStory.description && (
                      <p className="story-details">{currentStory.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="voting-controls">
                <button 
                  className="start-voting-button"
                  onClick={handleStartVoting}
                >
                  🚀 Start Voting ({votingDuration}s timer)
                </button>
                <button 
                  className="change-story-button"
                  onClick={handleSelectDifferentStory}
                >
                  ← Select Different Story
                </button>
              </div>
            </div>
          )}

          {(sessionState === 'waiting' || sessionState === 'story_selected') && !isScrumMaster && (
            <div className="waiting-message">
              <h3>Waiting for Scrum Master</h3>
              <p>
                {sessionState === 'story_selected' 
                  ? 'The scrum master has selected a story and will start voting soon.' 
                  : 'The scrum master will select a story to estimate.'
                }
              </p>
            </div>
          )}

          {(sessionState === 'active' || sessionState === 'revealing') && currentStory && (
            <VotingManager
              story={currentStory}
              sessionState={sessionState}
              votingStartTime={votingStartTime}
              votingDuration={votingDuration}
              voteCount={voteCount}
              participantCount={participants.length}
              votes={votes}
              onRevealVotes={handleRevealVotes}
              onFinalizePoints={handleFinalizePoints}
              isScrumMaster={isScrumMaster}
            />
          )}
        </div>

        <div className="sidebar">
          <ParticipantsList participants={participants} />
        </div>
      </div>
    </div>
  );
}