import React, { useState, useEffect } from 'react';
import './VotingTimer.css';

export default function VotingTimer({ 
  votingStartTime, 
  votingDuration, 
  isActive = true,
  onTimeExpired,
  className = ''
}) {
  const [timeRemaining, setTimeRemaining] = useState(votingDuration);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize timer when voting starts
  useEffect(() => {
    console.log('VotingTimer: Props changed', {
      votingStartTime: votingStartTime ? votingStartTime.toString() : 'null',
      votingDuration,
      isActive
    });

    if (!isActive || !votingStartTime || votingDuration <= 0) {
      console.log('VotingTimer: Not starting - conditions not met');
      setIsRunning(false);
      setTimeRemaining(votingDuration);
      return;
    }

    console.log('VotingTimer: Starting countdown');
    setIsRunning(true);
    
    // Set initial time remaining
    const now = Date.now();
    const elapsed = Math.floor((now - votingStartTime.getTime()) / 1000);
    const initial = Math.max(0, votingDuration - elapsed);
    
    console.log('VotingTimer: Initial calculation:', {
      now: new Date(now).toString(),
      startTime: votingStartTime.toString(),
      elapsed,
      votingDuration,
      initial
    });
    
    setTimeRemaining(initial);
    
    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - votingStartTime.getTime()) / 1000);
      const remaining = Math.max(0, votingDuration - currentElapsed);
      
      console.log('VotingTimer: Tick', {
        currentElapsed,
        remaining,
        votingDuration
      });
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        console.log('VotingTimer: Timer expired');
        setIsRunning(false);
        clearInterval(interval);
        if (onTimeExpired) {
          onTimeExpired();
        }
      }
    }, 1000); // Update every second

    return () => {
      console.log('VotingTimer: Cleaning up interval');
      clearInterval(interval);
      setIsRunning(false);
    };
  }, [isActive, votingStartTime, votingDuration, onTimeExpired]);

  // Reset timer when duration changes and no active voting
  useEffect(() => {
    if (!votingStartTime) {
      console.log('VotingTimer: Resetting to duration:', votingDuration);
      setTimeRemaining(votingDuration);
    }
  }, [votingDuration, votingStartTime]);

  const getProgressPercentage = () => {
    if (votingDuration === 0) return 100;
    return ((votingDuration - timeRemaining) / votingDuration) * 100;
  };

  const isTimeUp = timeRemaining <= 0 && isRunning;

  console.log('VotingTimer render:', {
    timeRemaining,
    isRunning,
    isTimeUp,
    votingDuration
  });

  return (
    <div className={`voting-timer ${className} ${isTimeUp ? 'expired' : ''}`}>
      <div className="timer-display">
        <span className={`timer-text ${isTimeUp ? 'time-up' : ''}`}>
          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </span>
      </div>
      <div className="timer-bar">
        <div 
          className={`timer-progress ${isTimeUp ? 'expired' : ''}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
    </div>
  );
}