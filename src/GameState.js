export default class GameState {
  constructor() {
    this.states = {
      START: 'start',
      PLAYING: 'playing',
      GAME_OVER: 'game_over',
    };
    this.currentState = this.states.START;
  }

  setState(newState) {
    if (Object.values(this.states).includes(newState)) {
      this.currentState = newState;
    } else {
      throw new Error(`Invalid state: ${newState}`);
    }
  }

  getState() {
    return this.currentState;
  }

  checkGameOver(bubbles, fieldHeight) {
    // Input-Validierung
    if (!Array.isArray(bubbles)) {
      console.warn('GameState.checkGameOver: bubbles is not an array, defaulting to empty array');
      bubbles = [];
    }
    
    if (typeof fieldHeight !== 'number' || isNaN(fieldHeight) || fieldHeight <= 0) {
      console.warn(`GameState.checkGameOver: fieldHeight is not a valid positive number (${fieldHeight}), returning false`);
      return false;
    }
    
    // Prüfe, ob eine Bubble den unteren Rand des Spielfelds erreicht hat
    for (const bubble of bubbles) {
      // Zusätzliche Validierung für jede Bubble
      if (bubble && typeof bubble.y === 'number' && typeof bubble.radius === 'number') {
        if (bubble.y + bubble.radius >= fieldHeight) {
          this.setState(this.states.GAME_OVER);
          return true;
        }
      }
    }
    return false;
  }

  restartGame(initializeFieldCallback) {
    this.setState(this.states.START);
    if (typeof initializeFieldCallback === 'function') {
      initializeFieldCallback();
    }
  }
}
