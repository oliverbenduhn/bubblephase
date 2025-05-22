import GameState from './GameState';

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('initialer Zustand ist START', () => {
    expect(gameState.getState()).toBe(gameState.states.START);
  });

  test('setState ändert den Zustand korrekt', () => {
    gameState.setState(gameState.states.PLAYING);
    expect(gameState.getState()).toBe(gameState.states.PLAYING);
  });

  test('setState wirft Fehler bei ungültigem Zustand', () => {
    expect(() => gameState.setState('invalid')).toThrow('Invalid state: invalid');
  });

  test('checkGameOver setzt Zustand auf GAME_OVER, wenn Bubble unteren Rand erreicht', () => {
    const bubbles = [
      { y: 100, radius: 10 },
      { y: 190, radius: 15 }, // Diese Bubble erreicht den unteren Rand bei fieldHeight 200
    ];
    const fieldHeight = 200;
    const result = gameState.checkGameOver(bubbles, fieldHeight);
    expect(result).toBe(true);
    expect(gameState.getState()).toBe(gameState.states.GAME_OVER);
  });

  test('checkGameOver gibt false zurück, wenn keine Bubble unteren Rand erreicht', () => {
    const bubbles = [
      { y: 50, radius: 10 },
      { y: 100, radius: 15 },
    ];
    const fieldHeight = 200;
    const result = gameState.checkGameOver(bubbles, fieldHeight);
    expect(result).toBe(false);
    expect(gameState.getState()).not.toBe(gameState.states.GAME_OVER);
  });

  test('restartGame setzt Zustand auf START und ruft Callback auf', () => {
    gameState.setState(gameState.states.GAME_OVER);
    const mockCallback = jest.fn();
    gameState.restartGame(mockCallback);
    expect(gameState.getState()).toBe(gameState.states.START);
    expect(mockCallback).toHaveBeenCalled();
  });

  test('restartGame ohne Callback funktioniert auch', () => {
    gameState.setState(gameState.states.GAME_OVER);
    expect(() => gameState.restartGame()).not.toThrow();
    expect(gameState.getState()).toBe(gameState.states.START);
  });
});