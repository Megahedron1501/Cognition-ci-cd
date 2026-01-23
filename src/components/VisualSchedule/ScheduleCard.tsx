// Create src/components/VisualSchedule/ScheduleCard.tsx
import React from 'react';
import './styles.css';

interface ScheduleCardProps {
  title: string;
  type: 'activity' | 'reward' | 'break';
  icon?: string;
  onRemove?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ title, type, icon, onRemove }) => {
  return (
    <div className={`schedule-card ${type}`}>
      {icon && <div className="card-icon">{icon}</div>}
      <div className="card-title">{title}</div>
      {onRemove && (
        <button className="card-remove" onClick={onRemove}>
          ✕
        </button>
      )}
    </div>
  );
};

export default ScheduleCard;