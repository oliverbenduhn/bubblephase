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

  // Tests für Input-Validierung in checkGameOver
  describe('checkGameOver Input-Validierung', () => {
    let consoleWarnSpy;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    test('behandelt null/undefined bubbles-Parameter gracefully', () => {
      const fieldHeight = 200;
      
      const resultNull = gameState.checkGameOver(null, fieldHeight);
      expect(resultNull).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('GameState.checkGameOver: bubbles is not an array, defaulting to empty array');
      
      const resultUndefined = gameState.checkGameOver(undefined, fieldHeight);
      expect(resultUndefined).toBe(false);
    });

    test('behandelt nicht-Array bubbles-Parameter gracefully', () => {
      const fieldHeight = 200;
      
      const resultString = gameState.checkGameOver('not-an-array', fieldHeight);
      expect(resultString).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('GameState.checkGameOver: bubbles is not an array, defaulting to empty array');
      
      const resultObject = gameState.checkGameOver({}, fieldHeight);
      expect(resultObject).toBe(false);
    });

    test('behandelt ungültige fieldHeight-Parameter gracefully', () => {
      const bubbles = [{ y: 100, radius: 10 }];
      
      // String fieldHeight
      const resultString = gameState.checkGameOver(bubbles, 'invalid');
      expect(resultString).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('GameState.checkGameOver: fieldHeight is not a valid positive number (invalid), returning false');
      
      // NaN fieldHeight
      const resultNaN = gameState.checkGameOver(bubbles, NaN);
      expect(resultNaN).toBe(false);
      
      // Negative fieldHeight
      const resultNegative = gameState.checkGameOver(bubbles, -100);
      expect(resultNegative).toBe(false);
      
      // Zero fieldHeight
      const resultZero = gameState.checkGameOver(bubbles, 0);
      expect(resultZero).toBe(false);
    });

    test('ignoriert Bubbles mit ungültigen Eigenschaften', () => {
      const bubbles = [
        { y: 100, radius: 10 }, // Gültige Bubble
        { y: 'invalid', radius: 10 }, // Ungültige y-Koordinate
        { y: 150, radius: 'invalid' }, // Ungültiger radius
        { y: 185, radius: 15 }, // Gültige Bubble, die Game Over auslösen würde (185 + 15 = 200)
        null, // Null-Bubble
        undefined, // Undefined-Bubble
        {} // Bubble ohne Eigenschaften
      ];
      const fieldHeight = 200;
      
      const result = gameState.checkGameOver(bubbles, fieldHeight);
      expect(result).toBe(true); // Sollte true sein wegen der letzten gültigen Bubble
      expect(gameState.getState()).toBe(gameState.states.GAME_OVER);
    });

    test('funktioniert normal mit gültigen Eingaben', () => {
      const bubbles = [
        { y: 50, radius: 10 },
        { y: 100, radius: 15 }
      ];
      const fieldHeight = 200;
      
      const result = gameState.checkGameOver(bubbles, fieldHeight);
      expect(result).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});