// App.tsx - CLEAN ROUTER VERSION
import React, { useState } from 'react';
import './App.css';
import TokenBoard from './components/TokenBoard/TokenBoard';
import ShapeSorterGame from './games/ShapeSorterGame';
import EmotionMatcherGame from './games/EmotionMatcherGame';
import VisualScheduleBuilder from './components/VisualSchedule/VisualScheduleBuilder';
import SortByCategories from './games/SortByCategories';
import LaunchScreen from './components/LaunchScreen/LaunchScreen';

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [currentView, setCurrentView] = useState<'tokenBoard' | 'shapeGame' | 'emotionGame' | 'scheduleBuilder' | 'sortByCategories'>('tokenBoard');

  if (!hasLaunched) {
    return <LaunchScreen onLaunch={() => setHasLaunched(true)} />;
  }

  return (
    <div style={styles.container}>
      {/* Global Header - Can stay or customize */}
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 Cognition ABA Tools</h1>
        <p style={styles.subtitle}>Professional digital tools for ABA therapy sessions</p>
      </div>

      {/* Navigation */}
      <div style={styles.navigation}>
        <button 
          onClick={() => setCurrentView('tokenBoard')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'tokenBoard' ? '#4CAF50' : '#6c757d'
          }}
        >
          🏅 Token Board
        </button>
        <button 
          onClick={() => setCurrentView('shapeGame')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'shapeGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎯 Shape Sorter
        </button>
        <button 
          onClick={() => setCurrentView('emotionGame')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'emotionGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎭 Emotion Matcher
        </button>
        <button 
          onClick={() => setCurrentView('scheduleBuilder')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'scheduleBuilder' ? '#4CAF50' : '#6c757d'
          }}
        >
          📅 Schedule Builder
        </button>
        <button
          onClick={() => setCurrentView('sortByCategories')}
          style = {{
            ...styles.navButton,
            backgroundColor: currentView === 'sortByCategories' ? '#4CAF50' : '#6c757d' 
           }}
        >
          🎯 Sort By Categories
        </button>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {currentView === 'tokenBoard' && <TokenBoard clientName="Joshua" />}
        {currentView === 'shapeGame' && <ShapeSorterGame />}
        {currentView === 'emotionGame' && <EmotionMatcherGame />}
        {currentView === 'scheduleBuilder' && <VisualScheduleBuilder />}
        {currentView === 'sortByCategories' && <SortByCategories />}
      </div>
    </div>
  );
}

// Minimal styles for App.tsx only
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F0F8FF',
    padding: '20px',
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
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  navButton: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '160px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
};

export default App;