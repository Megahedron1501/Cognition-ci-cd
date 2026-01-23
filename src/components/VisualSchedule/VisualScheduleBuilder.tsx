// src/components/VisualSchedule/VisualScheduleBuilder.tsx
import React, { useState } from 'react';
import './styles.css';
import ActivityLibrary from './ActivityLibrary';
import ScheduleDropZone from './ScheduleDropZone';

interface ScheduleItem {
  id: string;
  title: string;
  type: 'activity' | 'reward' | 'break';
  duration?: number; // minutes
  icon?: string;
}

const VisualScheduleBuilder: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [mode, setMode] = useState<'first-then' | 'multi-step'>('first-then');

  // Sample activities (will move to ActivityLibrary later)
  const defaultActivities: ScheduleItem[] = [
    { id: '1', title: 'Token Board', type: 'activity', icon: '🏅' },
    { id: '2', title: 'Shape Game', type: 'activity', icon: '🎯' },
    { id: '3', title: 'Emotion Game', type: 'activity', icon: '🎭' },
    { id: '4', title: 'Table Work', type: 'activity', icon: '📚' },
    { id: '5', title: 'iPad Time', type: 'reward', icon: '📱' },
    { id: '6', title: 'Puzzle', type: 'reward', icon: '🧩' },
    { id: '7', title: 'Sensory Bin', type: 'reward', icon: '🌈' },
    { id: '8', title: 'Break', type: 'break', icon: '☕' },
  ];

  const handleAddToSchedule = (item: ScheduleItem) => {
    if (mode === 'first-then' && schedule.length >= 2) {
      alert('First-Then only supports 2 items! Switch to multi-step mode.');
      return;
    }
    setSchedule([...schedule, { ...item, id: Date.now().toString() }]);
  };

  const handleRemoveFromSchedule = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const handleClearSchedule = () => {
    setSchedule([]);
  };

  return (
    <div className="visual-schedule">
      <header className="schedule-header">
        <h2>📅 Visual Schedule Builder</h2>
        <div className="mode-toggle">
          <button 
            className={mode === 'first-then' ? 'active' : ''}
            onClick={() => setMode('first-then')}
          >
            First-Then (2-step)
          </button>
          <button 
            className={mode === 'multi-step' ? 'active' : ''}
            onClick={() => setMode('multi-step')}
          >
            Multi-Step
          </button>
        </div>
      </header>

      <div className="schedule-container">
        {/* Left: Activity Library */}
        <div className="activity-library">
          <ActivityLibrary 
            activities={defaultActivities}
            onAddToSchedule={handleAddToSchedule}
          />
        </div>

        {/* Right: Schedule Area */}
        <div className="schedule-area">
          <ScheduleDropZone
            schedule={schedule}
            onRemoveItem={handleRemoveFromSchedule}
            mode={mode}
          />
          
          <div className="schedule-controls">
            <button onClick={handleClearSchedule} className="clear-btn">
              🗑️ Clear Schedule
            </button>
            <button onClick={() => alert('Coming soon!')} className="save-btn">
              💾 Save Template
            </button>
            <button onClick={() => alert('Starting schedule...')} className="start-btn">
              ▶️ Start Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualScheduleBuilder;