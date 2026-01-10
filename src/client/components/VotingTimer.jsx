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

  // Update timer independently
  useEffect(() => {
    if (!isActive || !votingStartTime || votingDuration <= 0) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - votingStartTime.getTime()) / 1000);
      const remaining = Math.max(0, votingDuration - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setIsRunning(false);
        if (onTimeExpired) {
          onTimeExpired();
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      setIsRunning(false);
    };
  }, [isActive, votingStartTime, votingDuration, onTimeExpired]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(votingDuration);
  }, [votingDuration]);

  const getProgressPercentage = () => {
    if (votingDuration === 0) return 100;
    return ((votingDuration - timeRemaining) / votingDuration) * 100;
  };

  const isTimeUp = timeRemaining <= 0;

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