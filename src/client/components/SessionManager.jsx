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
  const [votingDuration, setVotingDuration] = useState(300);
  const [votes, setVotes] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionWatchers, setSessionWatchers] = useState(null);

  const isScrumMaster = session.isMaster !== false;

  // Initialize record watchers with graceful fallback
  useEffect(() => {
    let mounted = true;

    const initializeWatchers = async () => {
      try {
        // Get initial session status ONCE
        const [statusResult, participantsResult] = await Promise.all([
          service.getSessionStatus(session.id),
          service.getParticipants(session.id)
        ]);

        if (!mounted) return;

        // Set initial state from one-time fetch
        if (statusResult && !statusResult.error) {
          updateSessionFromStatus(statusResult);
        }
        if (participantsResult && Array.isArray(participantsResult)) {
          setParticipants(participantsResult);
        }

        // Check AMB connection status
        const status = service.getConnectionStatus();
        console.log('Connection status:', status);

        if (status.connected && status.ambAvailable) {
          // Set up record watchers if AMB is available
          const watchers = service.watchSession(session.id, {
            onSessionUpdate: (sessionRecord, operation) => {
              console.log('WEBSOCKET: Session update received:', sessionRecord, operation);
              if (mounted && sessionRecord) {
                updateSessionFromRecord(sessionRecord);
              }
            },
            
            onParticipantsUpdate: async ({ operation, participant }) => {
              console.log('WEBSOCKET: Participants update received:', operation, participant);
              if (mounted) {
                try {
                  const updatedParticipants = await service.getParticipants(session.id);
                  if (mounted && Array.isArray(updatedParticipants)) {
                    setParticipants(updatedParticipants);
                  }
                } catch (error) {
                  console.error('Error refreshing participants:', error);
                }
              }
            },
            
            onVotesUpdate: async ({ operation, vote }) => {
              console.log('WEBSOCKET: Votes update received:', operation, vote);
              if (mounted) {
                try {
                  const statusResult = await service.getSessionStatus(session.id);
                  if (mounted && statusResult && !statusResult.error) {
                    setVoteCount(statusResult.votes_count || 0);
                    if (statusResult.votes) {
                      setVotes(statusResult.votes);
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing after vote update:', error);
                }
              }
            }
          });

          setSessionWatchers(watchers);
          setConnectionStatus('connected');
          console.log('WEBSOCKET: Record watchers established successfully!');
        } else {
          setConnectionStatus('offline');
          console.warn('WEBSOCKET: AMB not available. Real-time updates disabled.');
          console.log('AMB Client info:', status);
        }

      } catch (error) {
        console.error('Error initializing watchers:', error);
        if (mounted) {
          setConnectionStatus('error');
        }
      }
    };

    initializeWatchers();

    // Cleanup function
    return () => {
      mounted = false;
      if (sessionWatchers) {
        service.unwatchSession(sessionWatchers);
        console.log('WEBSOCKET: Cleaned up session watchers');
      }
    };
  }, [service, session.id]);

  // Helper function to update session state from status API
  const updateSessionFromStatus = (statusResult) => {
    setSessionState(statusResult.state || 'waiting');
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

    if (statusResult.votes) {
      setVotes(statusResult.votes);
    } else if (statusResult.state !== 'revealing') {
      setVotes([]);
    }
  };

  // Helper function to update session state from record watcher
  const updateSessionFromRecord = (sessionRecord) => {
    if (sessionRecord.state) {
      setSessionState(sessionRecord.state);
    }
    if (sessionRecord.voting_duration) {
      setVotingDuration(parseInt(sessionRecord.voting_duration) || 300);
    }
    if (sessionRecord.voting_started_at) {
      setVotingStartTime(new Date(sessionRecord.voting_started_at));
    }
    
    // Story details need to be fetched when record indicates change
    if (sessionRecord.current_story !== currentStory?.id) {
      service.getSessionStatus(session.id)
        .then(statusResult => {
          if (statusResult && !statusResult.error) {
            updateSessionFromStatus(statusResult);
          }
        })
        .catch(error => console.error('Error fetching story details:', error));
    }
  };

  // Manual refresh when real-time is not available
  const handleManualRefresh = async () => {
    if (connectionStatus === 'offline') {
      try {
        const result = await service.refreshSessionData(session.id, {
          onSessionUpdate: (data) => updateSessionFromStatus(data),
          onParticipantsUpdate: ({ participants }) => {
            if (participants) setParticipants(participants);
          }
        });
        
        if (result.success) {
          console.log('Manual refresh successful');
        }
      } catch (error) {
        console.error('Manual refresh failed:', error);
      }
    }
  };

  const handleStorySelected = async (story) => {
    if (!isScrumMaster) {
      setError('Only the scrum master can select stories');
      return;
    }

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

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🔗';
      case 'offline': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Updates';
      case 'offline': return 'Manual Refresh';
      case 'error': return 'Error';
      default: return 'Connecting...';
    }
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
          <div className={`connection-status ${connectionStatus}`}>
            <span className="connection-icon">{getConnectionIcon()}</span>
            <span className="connection-text">{getConnectionText()}</span>
            {connectionStatus === 'offline' && (
              <button 
                className="refresh-button"
                onClick={handleManualRefresh}
                title="Click to refresh session data"
              >
                🔄
              </button>
            )}
          </div>
        </div>
        <button 
          className="back-button"
          onClick={onBackToStart}
        >
          ← New Session
        </button>
      </div>

      {connectionStatus === 'offline' && (
        <div className="connection-notice">
          <p>📡 Real-time updates are not available. Click the refresh button 🔄 to update session data manually.</p>
        </div>
      )}

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
              {connectionStatus === 'offline' && (
                <button 
                  className="refresh-button-inline"
                  onClick={handleManualRefresh}
                >
                  🔄 Check for Updates
                </button>
              )}
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