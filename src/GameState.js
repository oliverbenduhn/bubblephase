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
    // Prüfe, ob eine Bubble den unteren Rand des Spielfelds erreicht hat
    for (const bubble of bubbles) {
      if (bubble.y + bubble.radius >= fieldHeight) {
        this.setState(this.states.GAME_OVER);
        return true;
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
