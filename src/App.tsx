// App.tsx - CLEAN ROUTER VERSION
import React, { useState } from 'react';
import './App.css';
import TokenBoard from './components/TokenBoard/TokenBoard';
import ShapeSorterGame from './games/ShapeSorterGame';
import EmotionMatcherGame from './games/EmotionMatcherGame';
import VisualScheduleBuilder from './components/VisualSchedule/VisualScheduleBuilder';
import SortByCategories from './games/SortByCategories';
import LaunchScreen from './components/LaunchScreen/LaunchScreen';
import ChoiceBoard from './components/ChoiceBoard/ChoiceBoard';
import BehaviorTracker from './components/BehaviorTracker/BehaviorTracker';
import FunTimer from './components/FunTimer/FunTimer';
import Progress from './components/Progress/Progress';
import ClientPicker from './components/ClientPicker/ClientPicker';
import { getClients } from './utils/sessionStore';
import { Client } from './types/session';
import { isSoundEnabled, setSoundEnabled } from './utils/sound';

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [currentView, setCurrentView] = useState<'tokenBoard' | 'shapeGame' | 'emotionGame' | 'scheduleBuilder' | 'sortByCategories' | 'choiceBoard' | 'behaviorTracker' | 'funTimer' | 'progress'>('tokenBoard');
  const [clients, setClients] = useState<Client[]>(() => getClients());
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const activeClient = clients.find(c => c.id === activeClientId) ?? null;

  const refreshClients = () => {
    const latest = getClients();
    setClients(latest);
    if (!latest.some(c => c.id === activeClientId)) setActiveClientId(null);
  };
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  if (!hasLaunched) {
    return <LaunchScreen onLaunch={() => setHasLaunched(true)} />;
  }

  return (
    <div className="app-container" style={styles.container}>
      {/* Global Header - Can stay or customize */}
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 Cognition ABA Tools</h1>
        <p style={styles.subtitle}>Professional digital tools for ABA therapy sessions</p>
        <button
          onClick={() => {
            const next = !soundOn;
            setSoundEnabled(next);
            setSoundOn(next);
          }}
          style={styles.soundToggleButton}
        >
          {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
        <ClientPicker
          clients={clients}
          activeClientId={activeClientId}
          onSelect={setActiveClientId}
          onClientAdded={client => {
            setClients(getClients());
            setActiveClientId(client.id);
          }}
        />
      </div>

      {/* Navigation */}
      <div className="app-nav">
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('tokenBoard')}
          style={{
            backgroundColor: currentView === 'tokenBoard' ? '#4CAF50' : '#6c757d'
          }}
        >
          🏅 Token Board
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('shapeGame')}
          style={{
            backgroundColor: currentView === 'shapeGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎯 Shape Sorter
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('emotionGame')}
          style={{
            backgroundColor: currentView === 'emotionGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎭 Emotion Matcher
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('scheduleBuilder')}
          style={{
            backgroundColor: currentView === 'scheduleBuilder' ? '#4CAF50' : '#6c757d'
          }}
        >
          📅 Schedule Builder
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('sortByCategories')}
          style={{
            backgroundColor: currentView === 'sortByCategories' ? '#4CAF50' : '#6c757d' 
           }}
        >
          🎯 Sort By Categories
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('choiceBoard')}
          style={{
            backgroundColor: currentView === 'choiceBoard' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎯 Choice Board (Demo)
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('behaviorTracker')}
          style={{
            backgroundColor: currentView === 'behaviorTracker' ? '#4CAF50' : '#6c757d'
          }}
        >
          📊 Behavior Data
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('funTimer')}
          style={{
            backgroundColor: currentView === 'funTimer' ? '#4CAF50' : '#6c757d'
          }}
        >
          ⏰ Fun Timer
        </button>
        <button
          className="app-nav-btn"
          onClick={() => setCurrentView('progress')}
          style={{
            backgroundColor: currentView === 'progress' ? '#4CAF50' : '#6c757d'
          }}
        >
          📈 Progress
        </button>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {currentView === 'tokenBoard' && (
          <TokenBoard 
            clientName="REDACTED"
            onAllTokensEarned={() => setCurrentView('choiceBoard')}
            />
          )}
        {currentView === 'shapeGame' && <ShapeSorterGame />}
        {currentView === 'emotionGame' && <EmotionMatcherGame />}
        {currentView === 'scheduleBuilder' && <VisualScheduleBuilder />}
        {currentView === 'sortByCategories' && (
          <SortByCategories clientId={activeClientId} clientCode={activeClient?.code ?? null} />
        )}
        {currentView === 'progress' && (
          <Progress clientId={activeClientId} clientCode={activeClient?.code ?? null} onDataChanged={refreshClients} />
        )}
        {currentView === 'choiceBoard' && <ChoiceBoard />}
        {/* Always mounted, only hidden: behavior data runs all session
            alongside the other tools, so switching views must not wipe it. */}
        <div style={{ display: currentView === 'behaviorTracker' ? 'block' : 'none' }}>
          <BehaviorTracker />
        </div>
        {/* Same reason: a timer has to keep running while the learner uses another tool. */}
        <div style={{ display: currentView === 'funTimer' ? 'block' : 'none' }}>
          <FunTimer />
        </div>
      </div>
    </div>
  );
}

// Minimal styles for App.tsx only
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F0F8FF',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    color: '#2C3E50',
    fontSize: '2.2rem',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#7F8C8D',
    fontSize: '1.1rem',
  },
  soundToggleButton: {
    marginTop: '10px',
    padding: '8px 16px',
    fontSize: '0.95rem',
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    backgroundColor: '#ECF0F1',
    border: '2px solid #BDC3C7',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
};

export default App;