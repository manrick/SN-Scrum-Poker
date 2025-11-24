import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerWebSocketService } from '../services/ScrumPokerWebSocketService.js';
import SessionJoiner from './SessionJoiner.jsx';
import VotingInterface from './VotingInterface.jsx';
import './ScrumUserApp.css';

// THIS IS NOW THE WEBSOCKET VERSION - NO POLLING!
export default function ScrumUserApp() {
  const service = useMemo(() => new ScrumPokerWebSocketService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionState, setSessionState] = useState('waiting');
  const [currentStory, setCurrentStory] = useState(null);
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingDuration, setVotingDuration] = useState(20); // Changed from 300 to 20 seconds
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionWatchers, setSessionWatchers] = useState(null);
  const [ambInitialized, setAmbInitialized] = useState(false);

  // Initialize AMB service after page load
  useEffect(() => {
    let mounted = true;
    
    const initializeService = async () => {
      try {
        // Ensure AMB is initialized (this waits for page load)
        await service.ensureAMBInitialization();
        
        if (!mounted) return;
        
        setAmbInitialized(true);
        
        // Check initial connection status
        const status = await service.getConnectionStatus();
        setConnectionStatus(status.connected ? 'connected' : 'offline');
        
      } catch (error) {
        console.error('Error initializing AMB service:', error);
        if (mounted) {
          setConnectionStatus('error');
          setAmbInitialized(true); // Still allow the app to function
        }
      }
    };

    initializeService();
    
    return () => {
      mounted = false;
      service.disconnect();
    };
  }, [service]);

  // Initialize record watchers when session is joined - NO POLLING!
  useEffect(() => {
    if (!currentSession || !ambInitialized) return;

    let mounted = true;

    const initializeWatchers = async () => {
      try {
        // Get initial session status ONCE
        const statusResult = await service.getSessionStatus(currentSession.id);
        
        if (!mounted) return;

        if (statusResult && !statusResult.error) {
          updateSessionFromStatus(statusResult);
        }

        // Check AMB connection status
        const status = await service.getConnectionStatus();
        setConnectionStatus(status.connected ? 'connected' : 'offline');

        if (status.connected) {
          // Set up record watchers - NO MORE POLLING!
          const watchers = await service.watchSession(currentSession.id, {
            onSessionUpdate: (sessionRecord, operation) => {
              console.log('🎯 User app - Session update:', sessionRecord, operation);
              if (mounted && sessionRecord) {
                updateSessionFromRecord(sessionRecord);
              }
            },
            
            onParticipantsUpdate: ({ operation, participant }) => {
              console.log('👥 User app - Participants update:', operation, participant);
              // Participants changes don't directly affect user interface
            },
            
            onVotesUpdate: async ({ operation, vote }) => {
              console.log('🗳️ User app - Votes update:', operation, vote);
              if (mounted) {
                // Refresh session status only when vote changes occur
                try {
                  const statusResult = await service.getSessionStatus(currentSession.id);
                  if (mounted && statusResult && !statusResult.error) {
                    updateSessionFromStatus(statusResult);
                  }
                } catch (error) {
                  console.error('Error refreshing after vote update:', error);
                }
              }
            }
          });

          setSessionWatchers(watchers);
          setConnectionStatus('connected');
          console.log('✅ User app - Record watchers established, NO MORE POLLING!');
        } else {
          setConnectionStatus('offline');
          console.warn('⚠️ User app - AMB not available, real-time updates disabled');
        }

      } catch (error) {
        console.error('❌ User app - Error initializing watchers:', error);
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
        console.log('User app - Cleaned up session watchers');
      }
    };
  }, [service, currentSession, ambInitialized]);

  // Helper function to update session state from status API
  const updateSessionFromStatus = (statusResult) => {
    console.log('📊 User app - Updating from status API:', statusResult);
    
    const newState = statusResult.state || 'waiting';
    console.log('📊 Setting session state to:', newState);
    setSessionState(newState);
    setVotingDuration(statusResult.voting_duration || 20); // Default to 20 seconds
    
    if (statusResult.current_story && statusResult.story_details) {
      const newStory = {
        id: statusResult.current_story,
        ...statusResult.story_details
      };
      
      console.log('📊 Setting current story to:', newStory);
      
      // Reset vote status if it's a new story
      if (!currentStory || currentStory.id !== newStory.id) {
        setHasVoted(false);
      }
      
      setCurrentStory(newStory);
    } else {
      console.log('📊 Clearing current story');
      setCurrentStory(null);
      setHasVoted(false);
    }

    if (statusResult.voting_started_at && newState === 'active') {
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
    console.log('🔄 User app - Updating from AMB record:', sessionRecord);
    
    // Extract the actual record data from AMB format
    const record = sessionRecord.record || sessionRecord;
    console.log('🔄 Extracted record:', record);
    
    if (record.state) {
      const newState = record.state;
      console.log('🔄 AMB: Setting session state to:', newState);
      setSessionState(newState);
      
      // If state changed to a new story, reset voting status
      if (newState === 'active' && record.current_story !== currentStory?.id) {
        console.log('🔄 AMB: New story detected, resetting vote status');
        setHasVoted(false);
      }
    }
    
    if (record.voting_duration) {
      setVotingDuration(parseInt(record.voting_duration) || 20); // Default to 20 seconds
    }
    
    if (record.voting_started_at) {
      setVotingStartTime(new Date(record.voting_started_at));
    }
    
    // If story changed, need to fetch story details via API once
    if (record.current_story && record.current_story !== currentStory?.id) {
      console.log('🔄 AMB: Story changed, fetching details for:', record.current_story);
      service.getSessionStatus(currentSession.id)
        .then(statusResult => {
          console.log('📊 Got story details:', statusResult);
          if (statusResult && !statusResult.error) {
            updateSessionFromStatus(statusResult);
          }
        })
        .catch(error => console.error('Error fetching story details:', error));
    }
  };

  const handleSessionJoined = (session) => {
    console.log('✅ User joined session:', session);
    setCurrentSession(session);
    setError('');
    setHasVoted(false);
  };

  const handleVoteSubmitted = () => {
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
    <div className="scrum-user-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker (WebSocket)</h1>
        {currentSession && (
          <div className="session-info">
            <span className="session-name">{currentSession.name}</span>
            <div className={`connection-status ${ambInitialized ? connectionStatus : 'initializing'}`}>
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