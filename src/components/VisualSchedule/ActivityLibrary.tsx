// src/components/VisualSchedule/ActivityLibrary.tsx
import React from 'react';
import './styles.css';

interface ActivityItem {
  id: string;
  title: string;
  type: 'activity' | 'reward' | 'break';
  icon?: string;
}

interface ActivityLibraryProps {
  activities: ActivityItem[];
  onAddToSchedule: (item: ActivityItem) => void;
}

const ActivityLibrary: React.FC<ActivityLibraryProps> = ({ activities, onAddToSchedule }) => {
  return (
    <div className="activity-library">
      <h3>📚 Activity Library</h3>
      <p className="library-subtitle">Drag or click to add to schedule</p>
      
      <div className="library-grid">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`schedule-card ${activity.type}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify(activity));
            }}
            onClick={() => onAddToSchedule(activity)}
          >
            <div className="card-icon">{activity.icon}</div>
            <div className="card-content">
              <div className="card-title">{activity.title}</div>
              <div className="card-type">
                {activity.type === 'activity' && 'Work Activity'}
                {activity.type === 'reward' && 'Reward'}
                {activity.type === 'break' && 'Break'}
              </div>
            </div>
            <div className="card-add">+</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLibrary;