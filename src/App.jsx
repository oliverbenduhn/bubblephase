import './App.css'
import PhaserGame from './PhaserGame';
import viewportHeightManager from './viewportHeight';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Viewport Height Manager initialisieren
    viewportHeightManager.init();
    
    // Cleanup beim Unmount
    return () => {
      viewportHeightManager.destroy();
    };
  }, []);

  return (
    <div className="game-container">
      <PhaserGame />
    </div>
  )
}

export default App