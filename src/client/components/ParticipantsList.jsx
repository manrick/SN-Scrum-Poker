import React from 'react';
import './ParticipantsList.css';

export default function ParticipantsList({ participants = [] }) {
  // Ensure participants is always an array and handle null safety
  const safeParticipants = Array.isArray(participants) ? participants : [];
  
  const getSafeName = (participant) => {
    if (!participant) return 'Unknown';
    return participant.name || participant.display_name || 'Unknown User';
  };

  return (
    <div className="participants-list">
      <h4>👥 Participants ({safeParticipants.length})</h4>
      
      {safeParticipants.length === 0 ? (
        <div className="no-participants">
          No participants yet. Share the session code!
        </div>
      ) : (
        <div className="participants">
          {safeParticipants.map((participant, index) => {
            const safeName = getSafeName(participant);
            const userId = participant?.user_id || participant?.sys_id || index;
            
            return (
              <div key={userId} className="participant-item">
                <div className="participant-avatar">
                  {safeName.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <div className="participant-name">{safeName}</div>
                  <div className="participant-status">
                    <span className="status-dot online"></span>
                    Online
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="share-info">
        <p>Share the session code with your team members so they can join and vote!</p>
      </div>
    </div>
  );
}