import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerWebSocketService } from '../services/ScrumPokerWebSocketService.js';
import SessionJoiner from './SessionJoiner.jsx';
import VotingInterface from './VotingInterface.jsx';
import './ScrumUserApp.css';

export default function ScrumUserAppWebSocket() {
  const service = useMemo(() => new ScrumPokerWebSocketService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionState, setSessionState] = useState('waiting');
  const [currentStory, setCurrentStory] = useState(null);
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingDuration, setVotingDuration] = useState(300);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionWatchers, setSessionWatchers] = useState(null);
  const [ambInitialized, setAmbInitialized] = useState(false);

  console.log('ScrumUserAppWebSocket render:', {
    currentSession: currentSession ? currentSession.id : 'none',
    sessionState,
    ambInitialized,
    currentStory: currentStory ? currentStory.number : 'none',
    hasVoted
  });

  // Initialize AMB and track initialization status
  useEffect(() => {
    let mounted = true;

    const initializeAMB = async () => {
      try {
        console.log('ScrumUserApp: Initializing AMB...');
        
        // Wait for AMB to be initialized
        await service.ensureAMBInitialization();
        
        if (mounted) {
          setAmbInitialized(true);
          console.log('ScrumUserApp: AMB initialized successfully');
          
          // Check initial connection status
          const status = service.getConnectionStatusSync();
          setConnectionStatus(status.connected ? 'connected' : 'offline');
          console.log('ScrumUserApp: Initial connection status:', status);
        }
      } catch (error) {
        console.error('ScrumUserApp: Error initializing AMB:', error);
        if (mounted) {
          setConnectionStatus('error');
          setAmbInitialized(false);
        }
      }
    };

    initializeAMB();

    return () => {
      mounted = false;
    };
  }, [service]);

  // Initialize record watchers when session is joined and AMB is ready
  useEffect(() => {
    if (!currentSession || !ambInitialized) {
      console.log('ScrumUserApp: Not ready for watchers:', {
        currentSession: !!currentSession,
        ambInitialized
      });
      return;
    }

    let mounted = true;

    const initializeWatchers = async () => {
      try {
        console.log('ScrumUserApp: Setting up session watchers for session:', currentSession.id);
        
        // Get initial session status
        const statusResult = await service.getSessionStatus(currentSession.id);
        console.log('ScrumUserApp: Initial session status:', statusResult);
        
        if (!mounted) return;

        if (statusResult && !statusResult.error) {
          updateSessionFromStatus(statusResult);
        }

        // Check AMB connection status
        const status = service.getConnectionStatusSync();
        setConnectionStatus(status.connected ? 'connected' : 'offline');
        console.log('ScrumUserApp: Connection status when setting up watchers:', status);

        if (status.connected) {
          console.log('ScrumUserApp: Setting up AMB record watchers...');
          
          // Set up record watchers
          const watchers = await service.watchSession(currentSession.id, {
            onSessionUpdate: (sessionRecord, operation) => {
              console.log('ScrumUserApp: Session update received:', sessionRecord, operation);
              if (mounted && sessionRecord) {
                updateSessionFromRecord(sessionRecord);
              }
            },
            
            onParticipantsUpdate: ({ operation, participant }) => {
              console.log('ScrumUserApp: Participants update received:', operation, participant);
              // Participants changes don't directly affect user interface for scrum users
            },
            
            onVotesUpdate: async ({ operation, vote }) => {
              console.log('ScrumUserApp: Votes update received:', operation, vote);
              if (mounted) {
                // If someone votes, we might want to refresh session status for vote count
                try {
                  const statusResult = await service.getSessionStatus(currentSession.id);
                  if (mounted && statusResult && !statusResult.error) {
                    updateSessionFromStatus(statusResult);
                  }
                } catch (error) {
                  console.error('ScrumUserApp: Error refreshing after vote update:', error);
                }
              }
            }
          });

          setSessionWatchers(watchers);
          setConnectionStatus('connected');
          console.log('ScrumUserApp: Record watchers established');
        } else {
          setConnectionStatus('offline');
          console.warn('ScrumUserApp: AMB not available, real-time updates disabled');
        }

      } catch (error) {
        console.error('ScrumUserApp: Error initializing watchers:', error);
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
        console.log('ScrumUserApp: Cleaned up session watchers');
      }
    };
  }, [service, currentSession, ambInitialized]);

  // Fallback: Periodic refresh of session status when connected
  useEffect(() => {
    if (!currentSession || !ambInitialized || connectionStatus !== 'connected') return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('ScrumUserApp: Periodic session status refresh...');
        const statusResult = await service.getSessionStatus(currentSession.id);
        console.log('ScrumUserApp: Periodic status result:', statusResult);
        if (statusResult && !statusResult.error) {
          updateSessionFromStatus(statusResult);
        }
      } catch (error) {
        console.error('ScrumUserApp: Error in periodic status refresh:', error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [service, currentSession, ambInitialized, connectionStatus]);

  // Cleanup service on unmount
  useEffect(() => {
    return () => {
      service.disconnect();
    };
  }, [service]);

  // Helper function to update session state from status API
  const updateSessionFromStatus = (statusResult) => {
    console.log('ScrumUserApp: Updating session from status:', statusResult);
    const newState = statusResult.state || 'waiting';
    console.log('ScrumUserApp: Setting session state to:', newState, typeof newState);
    setSessionState(newState);
    setVotingDuration(statusResult.voting_duration || 300);
    
    if (statusResult.current_story && statusResult.story_details) {
      const newStory = {
        id: statusResult.current_story,
        ...statusResult.story_details
      };
      console.log('ScrumUserApp: Setting current story:', newStory);
      
      // Reset vote status if it's a new story
      if (!currentStory || currentStory.id !== newStory.id) {
        console.log('ScrumUserApp: New story, resetting vote status');
        setHasVoted(false);
      }
      
      setCurrentStory(newStory);
    } else {
      console.log('ScrumUserApp: Clearing current story');
      setCurrentStory(null);
      setHasVoted(false);
    }

    if (statusResult.voting_started_at && newState === 'active') {
      console.log('ScrumUserApp: Setting voting start time:', statusResult.voting_started_at);
      setVotingStartTime(new Date(statusResult.voting_started_at));
    } else {
      setVotingStartTime(null);
    }

    // Get votes when they're revealed
    if (newState === 'revealing' && statusResult.votes) {
      setVotes(statusResult.votes);
    } else {
      setVotes([]);
    }
  };

  // Helper function to update session state from record watcher
  const updateSessionFromRecord = (sessionRecord) => {
    console.log('ScrumUserApp: Updating session from record:', sessionRecord);
    
    // Extract the actual record from the AMB response
    const record = sessionRecord.record || sessionRecord;
    console.log('ScrumUserApp: Extracted record:', record);
    
    if (record.state) {
      // FIXED: Use the user's working solution for state extraction
      const newState = record.state;
      const stateValue = newState.value ? newState.value : newState;
      console.log('ScrumUserApp: AMB state change to:', stateValue);
      setSessionState(stateValue);
      
      // If state changed to a new story, reset voting status
      if (stateValue === 'active' && record.current_story !== currentStory?.id) {
        console.log('ScrumUserApp: New active story, resetting vote status');
        setHasVoted(false);
      }
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
    
    // If story changed, need to fetch story details via API
    const recordStoryId = record.current_story?.value || record.current_story;
    if (recordStoryId !== currentStory?.id) {
      console.log('ScrumUserApp: Story changed in record, fetching details...');
      service.getSessionStatus(currentSession.id)
        .then(statusResult => {
          if (statusResult && !statusResult.error) {
            updateSessionFromStatus(statusResult);
          }
        })
        .catch(error => console.error('ScrumUserApp: Error fetching story details:', error));
    }
  };

  const handleSessionJoined = (session) => {
    console.log('ScrumUserApp: Session joined:', session);
    setCurrentSession(session);
    setError('');
    setHasVoted(false);
  };

  const handleVoteSubmitted = () => {
    console.log('ScrumUserApp: Vote submitted, setting hasVoted to true');
    setHasVoted(true);
  };

  const handleLeaveSession = () => {
    // Cleanup watchers before leaving
    if (sessionWatchers) {
      service.unwatchSession(sessionWatchers);
      setSessionWatchers(null);
    }
    
    setCurrentSession(null);
    setSessionState('waiting');
    setCurrentStory(null);
    setVotingStartTime(null);
    setHasVoted(false);
    setVotes([]);
    setError('');
    setConnectionStatus('connecting');
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
      case 'connected': return 'Live';
      case 'offline': return 'Offline';
      case 'error': return 'Error';
      default: return 'Connecting...';
    }
  };

  return (
    <div className="scrum-user-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker</h1>
        {currentSession && (
          <div className="session-info">
            <span className="session-name">{currentSession.name}</span>
            <div className={`connection-status ${connectionStatus}`}>
              <span className="connection-icon">{getConnectionIcon()}</span>
              <span className="connection-text">{getConnectionText()}</span>
            </div>
            <button 
              className="leave-button"
              onClick={handleLeaveSession}
            >
              Leave Session
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <main className="app-content">
        {!currentSession ? (
          <SessionJoiner 
            service={service}
            onSessionJoined={handleSessionJoined}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        ) : (
          <VotingInterface
            service={service}
            session={currentSession}
            sessionState={sessionState}
            currentStory={currentStory}
            votingStartTime={votingStartTime}
            votingDuration={votingDuration}
            hasVoted={hasVoted}
            votes={votes}
            onVoteSubmitted={handleVoteSubmitted}
            setError={setError}
          />
        )}
      </main>
    </div>
  );
}