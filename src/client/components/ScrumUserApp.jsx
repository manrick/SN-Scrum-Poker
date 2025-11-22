import React, { useState, useEffect, useMemo } from 'react';
import { ScrumPokerService } from '../services/ScrumPokerService.js';
import SessionJoiner from './SessionJoiner.jsx';
import VotingInterface from './VotingInterface.jsx';
import './ScrumUserApp.css';

export default function ScrumUserApp() {
  const service = useMemo(() => new ScrumPokerService(), []);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionState, setSessionState] = useState('waiting');
  const [currentStory, setCurrentStory] = useState(null);
  const [votingStartTime, setVotingStartTime] = useState(null);
  const [votingDuration, setVotingDuration] = useState(10);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Poll for session status updates
  useEffect(() => {
    if (!currentSession) return;

    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await service.getSessionStatus(currentSession.id);
        
        if (statusResult.error) {
          setError(statusResult.error);
          return;
        }

        setSessionState(statusResult.state);
        setVotingDuration(statusResult.voting_duration);
        
        if (statusResult.current_story && statusResult.story_details) {
          const newStory = {
            id: statusResult.current_story,
            ...statusResult.story_details
          };
          
          // Reset vote status if it's a new story
          if (!currentStory || currentStory.id !== newStory.id) {
            setHasVoted(false);
          }
          
          setCurrentStory(newStory);
        } else {
          setCurrentStory(null);
          setHasVoted(false);
        }

        if (statusResult.voting_started_at) {
          setVotingStartTime(new Date(statusResult.voting_started_at));
        } else {
          setVotingStartTime(null);
        }

        // If votes are revealed, get them
        if (statusResult.state === 'revealing') {
          const votesResult = await service.revealVotes(currentSession.id);
          if (votesResult.success) {
            setVotes(votesResult.votes);
          }
        } else {
          setVotes([]);
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [service, currentSession, currentStory]);

  const handleSessionJoined = (session) => {
    setCurrentSession(session);
    setError('');
    setHasVoted(false);
  };

  const handleVoteSubmitted = () => {
    setHasVoted(true);
  };

  const handleLeaveSession = () => {
    setCurrentSession(null);
    setSessionState('waiting');
    setCurrentStory(null);
    setVotingStartTime(null);
    setHasVoted(false);
    setVotes([]);
    setError('');
  };

  return (
    <div className="scrum-user-app">
      <header className="app-header">
        <h1>🃏 Scrum Poker</h1>
        {currentSession && (
          <div className="session-info">
            <span className="session-name">{currentSession.name}</span>
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