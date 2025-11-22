import React from 'react';
import './ParticipantsList.css';

export default function ParticipantsList({ participants }) {
  return (
    <div className="participants-list">
      <h4>👥 Participants ({participants.length})</h4>
      
      {participants.length === 0 ? (
        <div className="no-participants">
          No participants yet. Share the session code!
        </div>
      ) : (
        <div className="participants">
          {participants.map((participant, index) => (
            <div key={participant.user_id || index} className="participant-item">
              <div className="participant-avatar">
                {participant.name.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info">
                <div className="participant-name">{participant.name}</div>
                <div className="participant-status">
                  <span className="status-dot online"></span>
                  Online
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="share-info">
        <p>Share the session code with your team members so they can join and vote!</p>
      </div>
    </div>
  );
}