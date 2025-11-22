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
  const [votingDuration, setVotingDuration] = useState(10);
  const [votes, setVotes] = useState([]);
  const [voteCount, setVoteCount] = useState(0);

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
        setVotingDuration(statusResult.voting_duration);
        
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

        if (participantsResult.participants) {
          setParticipants(participantsResult.participants);
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [service, session.id, setError]);

  const handleStorySelected = async (story) => {
    try {
      const result = await service.startVoting(session.id, story.sys_id);
      if (result.success) {
        setVotes([]);
        setVoteCount(0);
        // Status will be updated by polling
      } else {
        setError(result.error || 'Failed to start voting');
      }
    } catch (error) {
      setError('Failed to start voting. Please try again.');
    }
  };

  const handleRevealVotes = async () => {
    try {
      const result = await service.revealVotes(session.id);
      if (result.success) {
        setVotes(result.votes);
      } else {
        setError(result.error || 'Failed to reveal votes');
      }
    } catch (error) {
      setError('Failed to reveal votes. Please try again.');
    }
  };

  const handleFinalizePoints = async (points) => {
    try {
      const result = await service.finalizeStoryPoints(session.id, points);
      if (result.success) {
        setCurrentStory(null);
        setVotes([]);
        setVoteCount(0);
        setVotingStartTime(null);
      } else {
        setError(result.error || 'Failed to finalize story points');
      }
    } catch (error) {
      setError('Failed to finalize story points. Please try again.');
    }
  };

  return (
    <div className="session-manager">
      <div className="session-header">
        <div className="session-info">
          <h2>{session.name}</h2>
          <div className="session-code">
            Code: <span className="code-highlight">{session.code}</span>
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
          {sessionState === 'waiting' && (
            <StorySelector 
              service={service}
              onStorySelected={handleStorySelected}
            />
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