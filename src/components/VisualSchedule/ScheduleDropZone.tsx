// src/components/VisualSchedule/ScheduleDropZone.tsx
import React from 'react';
import './styles.css';

interface ScheduleItem {
  id: string;
  title: string;
  type: 'activity' | 'reward' | 'break';
  icon?: string;
}

interface ScheduleDropZoneProps {
  schedule: ScheduleItem[];
  onRemoveItem: (id: string) => void;
  mode: 'first-then' | 'multi-step';
}

const ScheduleDropZone: React.FC<ScheduleDropZoneProps> = ({ 
  schedule, 
  onRemoveItem, 
  mode 
}) => {
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  try {
    const activity = JSON.parse(data);
    console.log('📦 Drag detected (future feature):', activity.title);  // ← ADD THIS LINE
    // We'll handle adding in parent component later
  } catch (error) {
    console.error('Error parsing dropped data:', error);
  }
};

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="schedule-dropzone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h3>
        {mode === 'first-then' ? 'First-Then Schedule' : 'Multi-Step Schedule'}
      </h3>
      
      {schedule.length === 0 ? (
        <div className="empty-schedule">
          <p>📭 No activities scheduled</p>
          <p>Drag activities from the library or click to add them</p>
        </div>
      ) : (
        <div className="schedule-list">
          {schedule.map((item, index) => (
            <div key={item.id} className={`schedule-card ${item.type}`}>
              <div className="card-number">{index + 1}</div>
              <div className="card-icon">{item.icon}</div>
              <div className="card-content">
                <div className="card-title">{item.title}</div>
                <div className="card-type">
                  {item.type === 'activity' && 'Work Activity'}
                  {item.type === 'reward' && 'Reward'}
                  {item.type === 'break' && 'Break'}
                </div>
              </div>
              <button 
                className="card-remove"
                onClick={() => onRemoveItem(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      {mode === 'first-then' && schedule.length >= 2 && (
        <div className="schedule-complete">
          <p>✅ Schedule Complete!</p>
          <p><strong>First:</strong> {schedule[0]?.title} → <strong>Then:</strong> {schedule[1]?.title}</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleDropZone;