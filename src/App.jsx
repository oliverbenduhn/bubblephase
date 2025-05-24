import './App.css'
import PhaserGame from './PhaserGame';
import ColorSystemDemo from './ColorSystemDemo';
import { useState } from 'react';

function App() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="game-container">
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <button 
          onClick={() => setShowDemo(!showDemo)}
          style={{
            padding: '8px 16px',
            backgroundColor: showDemo ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showDemo ? 'Show Game' : 'Show Color Demo'}
        </button>
      </div>
      
      {showDemo ? <ColorSystemDemo /> : <PhaserGame />}
    </div>
  )
}

export default App