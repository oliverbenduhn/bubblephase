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
}
