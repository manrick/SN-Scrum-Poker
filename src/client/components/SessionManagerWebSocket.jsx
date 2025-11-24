import React, { useState, useEffect } from 'react';
import StorySelector from './StorySelector.jsx';
import VotingManager from './VotingManager.jsx';
import ParticipantsList from './ParticipantsList.jsx';
import './SessionManager.css';

export default function SessionManagerWebSocket({ service, session, onBackToStart, setError, ambInitialized }) {
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

  // Initialize record watchers - Wait for AMB to be initialized first
  useEffect(() => {
    if (!ambInitialized) {
      console.log('SessionManager: Waiting for AMB initialization...');
      return;
    }

    let mounted = true;

    const initializeWatchers = async () => {
      try {
        console.log('SessionManager: AMB initialized, setting up watchers...');

        // Get initial session status
        const [statusResult, participantsResult] = await Promise.all([
          service.getSessionStatus(session.id),
          service.getParticipants(session.id)
        ]);

        if (!mounted) return;

        // Set initial state
        if (statusResult && !statusResult.error) {
          updateSessionFromStatus(statusResult);
        }
        if (participantsResult && Array.isArray(participantsResult)) {
          setParticipants(participantsResult);
        }

        // Check AMB connection status
        const status = service.getConnectionStatusSync();
        setConnectionStatus(status.connected ? 'connected' : 'offline');

        if (status.connected) {
          // Set up record watchers
          const watchers = await service.watchSession(session.id, {
            onSessionUpdate: (sessionRecord, operation) => {
              console.log('SessionManager: Session update received:', sessionRecord, operation);
              if (mounted && sessionRecord) {
                updateSessionFromRecord(sessionRecord);
              }
            },
            
            onParticipantsUpdate: async ({ operation, participant }) => {
              console.log('SessionManager: Participants update received:', operation, participant);
              if (mounted) {
                // Refresh participants list when changes occur
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
              console.log('SessionManager: Votes update received:', operation, vote);
              if (mounted) {
                // Update vote count and potentially refresh session status
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
          console.log('SessionManager: Record watchers established for session:', session.id);
        } else {
          setConnectionStatus('offline');
          console.warn('SessionManager: AMB not available - real-time updates disabled');
        }

      } catch (error) {
        console.error('SessionManager: Error initializing watchers:', error);
        if (mounted) {
          setConnectionStatus('error');
          setError('Failed to initialize real-time updates');
        }
      }
    };

    initializeWatchers();

    // Cleanup function
    return () => {
      mounted = false;
      if (sessionWatchers) {
        service.unwatchSession(sessionWatchers);
        console.log('SessionManager: Cleaned up session watchers');
      }
    };
  }, [service, session.id, setError, ambInitialized]);

  // Helper function to update session state from status API
  const updateSessionFromStatus = (statusResult) => {
    console.log('SessionManager: Updating from status:', statusResult);
    
    // FIXED: Use the user's working solution for state extraction
    const newState = statusResult.state || 'waiting';
    const stateValue = newState.value ? newState.value : newState;
    setSessionState(stateValue);
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
    } else if (stateValue !== 'revealing') {
      setVotes([]);
    }
  };

  // Helper function to update session state from record watcher
  const updateSessionFromRecord = (sessionRecord) => {
    console.log('SessionManager: Updating from record:', sessionRecord);
    
    // Extract the actual record from the AMB response
    const record = sessionRecord.record || sessionRecord;
    
    if (record.state) {
      // FIXED: Use the user's working solution for state extraction
      const newState = record.state;
      const stateValue = newState.value ? newState.value : newState;
      setSessionState(stateValue);
    }
    if (record.voting_duration) {
      const duration = record.voting_duration.value ? record.voting_duration.value : record.voting_duration;
      setVotingDuration(parseInt(duration) || 300);
    }
    if (record.voting_started_at) {
      const startTime = record.voting_started_at.value ? record.voting_started_at.value : record.voting_started_at;
      if (startTime) {
        setVotingStartTime(new Date(startTime));
      }
    }
    // Note: story details and votes still need to be fetched via API
    // as record watcher only gives us the session record
    if (record.current_story !== currentStory?.id) {
      // Story changed - refresh session status to get story details
      service.getSessionStatus(session.id)
        .then(statusResult => {
          if (statusResult && !statusResult.error) {
            updateSessionFromStatus(statusResult);
          }
        })
        .catch(error => console.error('Error fetching story details:', error));
    }
  };

  // FIXED: Now calls the API to update the database
  const handleStorySelected = async (story) => {
    if (!isScrumMaster) {
      setError('Only the scrum master can select stories');
      return;
    }

    try {
      console.log('SessionManager: Selecting story via API:', story.sys_id);
      
      // Call the new selectStory API to update the database
      const result = await service.selectStory(session.id, story.sys_id);
      
      if (result.success) {
        console.log('SessionManager: Story selected successfully:', result.story);
        
        // Update local state (this will also be updated via AMB watcher)
        setCurrentStory({
          id: story.sys_id,
          number: story.number,
          short_description: story.short_description,
          description: story.description
        });
        setSessionState('story_selected');
        setVotes([]);
        setVoteCount(0);
        
        console.log('SessionManager: Local state updated, AMB should trigger updates for other users');
      } else {
        setError(result.error || 'Failed to select story');
      }
    } catch (error) {
      console.error('SessionManager: Error selecting story:', error);
      setError('Failed to select story. Please try again.');
    }
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

  // NEW: Handle restarting voting (clears votes and starts new timer)
  const handleRestartVoting = async () => {
    if (!isScrumMaster || !currentStory) {
      setError('Only the scrum master can restart voting');
      return;
    }

    try {
      console.log('SessionManager: Restarting voting for story:', currentStory.id);
      
      // Start voting again (this clears existing votes and restarts timer)
      const result = await service.startVoting(session.id, currentStory.id);
      if (result.success) {
        setVotes([]);
        setVoteCount(0);
        setVotingStartTime(new Date());
        setSessionState('active');
        console.log('SessionManager: Voting restarted successfully');
      } else {
        setError(result.error || 'Failed to restart voting');
      }
    } catch (error) {
      console.error('SessionManager: Error restarting voting:', error);
      setError('Failed to restart voting. Please try again.');
    }
  };

  const getConnectionIcon = () => {
    if (!ambInitialized) return '⏳';
    
    switch (connectionStatus) {
      case 'connected': return '🔗';
      case 'offline': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getConnectionText = () => {
    if (!ambInitialized) return 'Initializing...';
    
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'offline': return 'Offline';
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
          <div className={`connection-status ${ambInitialized && connectionStatus === 'connected' ? 'connected' : 'initializing'}`}>
            <span className="connection-icon">{getConnectionIcon()}</span>
            <span className="connection-text">{getConnectionText()}</span>
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
              onSelectDifferentStory={handleSelectDifferentStory}
              onRestartVoting={handleRestartVoting}
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