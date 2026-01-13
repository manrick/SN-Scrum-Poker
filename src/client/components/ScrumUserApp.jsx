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
  const [userVoteValue, setUserVoteValue] = useState(''); // Track what the user voted
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
        // Check if current user is scrum master
        //const isScrumMaster = currentSession.isMaster !== false;
        //console.log('ScrumUserApp: Current user is scrum master:', isScrumMaster);
        
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

          console.log('ScrumUserApp: Setting up AMB record watchers...');
          
          // Check if current user is scrum master
          //const isScrumMaster = currentSession.isMaster !== false;
          const isScrumMaster = currentSession.isScrumMaster;
          console.log('ScrumUserApp: Current user is scrum master:', isScrumMaster);


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
              
              // Only process vote updates if current user is scrum master
              if (!isScrumMaster && operation !== "delete") {
                console.log('ScrumUserApp: Ignoring vote update - current user is not scrum master and the operation is not delete');
                return;
              }
              
              console.log('ScrumUserApp: Processing vote update for scrum master');
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
    setSessionState(newState.value ? newState.value : newState);
    
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
        setUserVoteValue('');
      }
      
      setCurrentStory(newStory);
    } else {
      console.log('📊 Clearing current story');
      setCurrentStory(null);
      setHasVoted(false);
      setUserVoteValue('');
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
      //setSessionState(newState);
      setSessionState(newState.value ? newState.value : newState);
      
      // If state changed to a new story, reset voting status
      if (newState.value === 'active' && record.current_story !== currentStory?.id) {
        console.log('🔄 AMB: New story detected, resetting vote status');
        setHasVoted(false);
        setUserVoteValue('');
      }

      // Get votes when they're revealed
      if (newState.value === 'revealing') {

        service.getSessionStatus(currentSession.id)
        .then(statusResult => {
          console.log('📊 Got story details:', statusResult);
          if (statusResult && !statusResult.error && statusResult.votes) {
            setVotes(statusResult.votes);
          } else {
            setVotes([]);
          }
        })
        .catch(error => console.error('Error fetching story details:', error));
      }
    }
    
    if (record.voting_duration) {
      setVotingDuration(parseInt(record.voting_duration.value) || 20); // Default to 20 seconds
    }
    
    if (record.voting_started_at) {
      setVotingStartTime(new Date(record.voting_started_at.value));
    }
    
    // If story changed, need to fetch story details via API once
    if (record.current_story && record.current_story.value !== currentStory?.id) {
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
    setUserVoteValue('');
  };

  const handleVoteSubmitted = (voteValue) => {
    console.log('ScrumUserApp: Vote submitted, setting hasVoted to true with value:', voteValue);
    setHasVoted(true);
    setUserVoteValue(voteValue);
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
    setUserVoteValue('');
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
        <h1><img className="king-card-header" src="x_250424_sn_scrum8.card_king.svg"></img> Scrum Poker (Scrum user view)</h1>
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
            userVoteValue={userVoteValue}
            votes={votes}
            onVoteSubmitted={handleVoteSubmitted}
            setError={setError}
          />
        )}
      </main>
    </div>
  );
}