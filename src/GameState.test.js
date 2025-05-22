import { BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';
import GameState from './GameState';
import { BootScene } from './PhaserGame';

// Erweitere die echte BootScene für Tests
class TestBootScene extends BootScene {
    constructor() {
        // Leerer Konstruktor für Tests
        this.grid = null;
        this.currentState = 'start';
        this.score = 0;
        this.level = 1;
        this.gameStates = {
            START: 'start',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        };
    }

    create() {
        // Mock-Implementierung für Tests
        this.currentState = this.gameStates.START;
        this.score = 0;
        this.level = 1;
    }

    startGame() {
        // Mock-Implementierung für Tests
        this.currentState = this.gameStates.PLAYING;
        if (this.grid && this.grid.initializeWithBubbles) {
            this.grid.initializeWithBubbles();
        }
    }

    gameOver() {
        // Mock-Implementierung für Tests
        this.currentState = this.gameStates.GAME_OVER;
    }

    calculateScore(bubblesRemoved) {
        // Mock-Implementierung für Tests
        return bubblesRemoved * 10;
    }

    calculateBonusScore(floatingBubbles) {
        // Mock-Implementierung für Tests
        return floatingBubbles.length * 20;
    }

    nextLevel() {
        // Mock-Implementierung für Tests
        this.level += 1;
    }

    saveGame() {
        // Mock-Implementierung für Tests
        return { score: this.score, level: this.level };
    }

    loadGame(savedState) {
        // Mock-Implementierung für Tests
        this.score = savedState.score;
        this.level = savedState.level;
    }
}

// Mock für Phaser.Scene und andere Abhängigkeiten
const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    text: '',
});

const mockScene = {
    add: {
        text: jest.fn(() => createMockText()),
        graphics: jest.fn(() => ({
            fillStyle: jest.fn().mockReturnThis(),
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
            fillRoundedRect: jest.fn().mockReturnThis(),
            clear: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        })),
        circle: jest.fn(() => ({
            setStrokeStyle: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        })),
        line: jest.fn(() => ({
            setOrigin: jest.fn().mockReturnThis(),
            setLineWidth: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setTo: jest.fn(),
            destroy: jest.fn()
        })),
        zone: jest.fn(() => ({
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn(),
            destroy: jest.fn()
        })),
        particles: jest.fn(() => ({
            setDepth: jest.fn()
        }))
    },
    events: {
        on: jest.fn(),
        emit: jest.fn()
    },
    input: {
        on: jest.fn()
    },
    sys: {
        game: {
            config: {
                width: 800,
                height: 600
            },
            events: {
                on: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn()
            },
            isPortrait: false
        }
    },
    tweens: {
        add: jest.fn()
    },
    load: {
        image: jest.fn()
    },
    scene: {
        start: jest.fn()
    }
};

// Mock für localStorage
// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Hilfsfunktion für Mock-Erstellung
const createMockGrid = () => {
    const mockGrid = {
        rows: 12,
        cols: 8,
        xOffset: 20,
        yOffset: 50,
        grid: Array(12).fill(null).map(() => Array(8).fill(null))
    };
    
    // Mock-Methoden mit Jest
    mockGrid.initializeWithBubbles = jest.fn();
    mockGrid.forEachBubble = jest.fn();
    mockGrid.addBubble = jest.fn();
    mockGrid.removeBubble = jest.fn();
    mockGrid.getBubble = jest.fn().mockReturnValue(null);
    mockGrid.removeBubbles = jest.fn();
    mockGrid.isValidGridPosition = jest.fn().mockReturnValue(true);
    mockGrid.getFloatingBubbles = jest.fn().mockReturnValue([]);
    mockGrid.serialize = jest.fn().mockReturnValue({
        grid: [],
        rows: 12,
        cols: 8
    });
    mockGrid.deserialize = jest.fn();
    
    return mockGrid;
};

jest.mock('./Grid');

// Mock für MobileOptimization
jest.mock('./MobileOptimization', () => ({
  MobileOptimization: jest.fn().mockImplementation(() => ({
    adjustUIElements: jest.fn(),
    monitorScreenSize: jest.fn(),
    setupTouchControls: jest.fn(),
    destroy: jest.fn()
  })),
}));

describe('GameState Management', () => {
    let bootScene;
    let scoreText;
    let levelText;

    beforeEach(() => {
        jest.clearAllMocks();
        bootScene = new BootScene();

        // Setze benötigte Eigenschaften
        bootScene.add = mockScene.add;
        bootScene.events = mockScene.events;
        bootScene.input = mockScene.input;
        bootScene.sys = mockScene.sys;
        bootScene.tweens = mockScene.tweens;
        bootScene.load = mockScene.load;
        bootScene.scene = mockScene.scene;

        // Mock Text-Objekte
        scoreText = createMockText();
        levelText = createMockText();
        bootScene.scoreText = scoreText;
        bootScene.levelText = levelText;

        // Mock Grid
        bootScene.grid = createMockGrid();
        bootScene.grid.initializeWithBubbles = jest.fn(); // Sicherstellen, dass es ein Jest-Mock ist
        bootScene.grid.deserialize = jest.fn(); // Sicherstellen, dass es ein Jest-Mock ist

        // Mock Shooter
        bootScene.shooter = {
            x: 400,
            y: 550,
            moveLeft: jest.fn(),
            moveRight: jest.fn(),
            shoot: jest.fn(),
            setAngle: jest.fn(),
            checkWallCollision: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn()
        };

        bootScene.currentBubble = {
            destroy: jest.fn()
        };
    });

    describe('Spielzustände', () => {
        test('sollte mit START-Zustand initialisieren', () => {
            bootScene.create();
            expect(bootScene.currentState).toBe(bootScene.gameStates.START);
            expect(bootScene.score).toBe(0);
            expect(bootScene.level).toBe(1);
        });

        test('sollte vom START zum PLAYING-Zustand wechseln', () => {
            // bootScene.grid ist bereits ein Mock aus dem globalen beforeEach.
            // initializeWithBubbles ist darauf bereits ein jest.fn().
            bootScene.create();
            bootScene.startGame();
            expect(bootScene.currentState).toBe(bootScene.gameStates.PLAYING);
            expect(bootScene.grid.initializeWithBubbles).toHaveBeenCalled();
        });

        test('sollte beim Game Over korrekt reagieren', () => {
            bootScene.create();
            bootScene.startGame();
            bootScene.gameOver();
            expect(bootScene.currentState).toBe(bootScene.gameStates.GAME_OVER);
            expect(bootScene.scoreText.setText).toHaveBeenCalledWith('Game Over!\nFinal Score: 0');
        });
    });

    describe('Punkteberechnung', () => {
        beforeEach(() => {
        bootScene.create();
        bootScene.grid = createMockGrid();
        bootScene.grid.initializeWithBubbles = jest.fn();
        bootScene.grid.deserialize = jest.fn();
        bootScene.startGame();
        });

        test('sollte Punkte für entfernte Blasen berechnen', () => {
            bootScene.grid.serialize = jest.fn().mockReturnValue({
                grid: [],
                rows: 12,
                cols: 8
            });
            bootScene.addPoints(30); // 10 Punkte pro Blase
            
            expect(bootScene.score).toBe(30);
            expect(bootScene.scoreText.setText).toHaveBeenCalledWith('Score: 30');
        });

        test('sollte Bonus-Punkte für schwebende Blasen vergeben', () => {
            const mockFloatingBubbles = [
                { destroy: jest.fn() },
                { destroy: jest.fn() }
            ];
            bootScene.grid.getFloatingBubbles = jest.fn();
            bootScene.grid.serialize = jest.fn().mockReturnValue({
                grid: [],
                rows: 12,
                cols: 8
            });
            bootScene.grid.getFloatingBubbles.mockReturnValue(mockFloatingBubbles);
            
            bootScene.checkFloatingBubbles();
            
            expect(bootScene.score).toBe(40); // 20 Punkte pro schwebende Blase
            expect(bootScene.scoreText.setText).toHaveBeenCalledWith('Score: 40');
            mockFloatingBubbles.forEach(bubble => {
                expect(bubble.destroy).toHaveBeenCalled();
            });
        });
    });

    describe('Level-Progression', () => {
        beforeEach(() => {
            const grid = createMockGrid();
            bootScene.create();
            bootScene.startGame();
            bootScene.grid = grid;
        });

        test('sollte Level erhöhen wenn alle Blasen entfernt wurden', () => {
            bootScene.level = 1;
            
            // Simuliere ein leeres Spielfeld
            bootScene.grid.forEachBubble = jest.fn((callback) => {
                const emptyGrid = Array(bootScene.grid.rows).fill(null)
                    .map(() => Array(bootScene.grid.cols).fill(null));
                
                emptyGrid.forEach((row, rowIndex) => {
                    row.forEach((bubble, colIndex) => {
                        callback(bubble, rowIndex, colIndex);
                    });
                });
            });
            
            bootScene.grid.initializeWithBubbles = jest.fn();
            bootScene.grid.serialize = jest.fn().mockReturnValue({
                grid: [],
                rows: 12,
                cols: 8
            });
            
            bootScene.checkLevelComplete();
            
            expect(bootScene.level).toBe(2);
            expect(bootScene.levelText.setText).toHaveBeenCalledWith('Level: 2');
            expect(bootScene.grid.initializeWithBubbles).toHaveBeenCalled();
        });
    });

    describe('Speichern und Laden', () => {
        beforeEach(() => {
            localStorage.clear();
            // const grid = createMockGrid(); // Diese Zeile ist nicht mehr nötig, da bootScene.grid im äußeren beforeEach gesetzt wird
            // bootScene.grid = grid; // Diese Zeile ist nicht mehr nötig
            // Stattdessen stellen wir sicher, dass das Grid vom äußeren beforeEach verwendet wird
            // und rufen create und startGame hier auf, falls es für die Tests in diesem Block spezifisch ist.
            // Da der äußere beforeEach bootScene.grid bereits setzt, können wir das hier vereinfachen,
            // oder spezifische Mocks für diesen Block auf bootScene.grid anwenden.
            // Fürs Erste belassen wir es dabei, dass der äußere beforeEach das Grid setzt.
            // Die Aufrufe von create() und startGame() sind hier im beforeEach des describe-Blocks
            // für "Speichern und Laden" spezifisch und sollten beibehalten werden,
            // um den Zustand für diese Tests vorzubereiten.
            bootScene.grid = createMockGrid(); // Sicherstellen, dass für diesen Block ein frisches MockGrid verwendet wird
            bootScene.create();
            bootScene.startGame();
        });

        test('sollte Spielstand speichern', () => {
            bootScene.score = 100;
            bootScene.level = 2;
            bootScene.currentState = bootScene.gameStates.PLAYING;

            const mockSerializedGrid = {
                grid: [
                    [null, null, null, { color: BUBBLE_COLORS.RED }],
                    [{ color: BUBBLE_COLORS.BLUE }, null, null, null]
                ],
                rows: 12,
                cols: 8
            };
            
            // Setze den Mock für serialize
            bootScene.grid.serialize = jest.fn().mockReturnValue(mockSerializedGrid);
            
            bootScene.saveGameState();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'bubbleShooterGameState',
                expect.any(String)
            );
            
            const saved = localStorage.setItem.mock.calls[0][1];
            const parsedState = JSON.parse(saved);
            
            expect(parsedState).toEqual({
                score: 100,
                level: 2,
                currentState: bootScene.gameStates.PLAYING,
                grid: mockSerializedGrid
            });
        });

        test('sollte Spielstand laden', () => {
            const mockState = {
                score: 150,
                level: 3,
                currentState: bootScene.gameStates.PLAYING,
                grid: {
                    grid: [[{ color: 'RED', x: 0, y: 0, row: 0, col: 0 }]],
                    rows: 1,
                    cols: 1
                }
            };

            localStorage.getItem.mockReturnValue(JSON.stringify(mockState));

            bootScene.loadGameState();

            expect(bootScene.score).toBe(150);
            expect(bootScene.level).toBe(3);
            expect(bootScene.currentState).toBe(bootScene.gameStates.PLAYING);
            expect(bootScene.grid.deserialize).toHaveBeenCalledWith(mockState.grid);
            expect(bootScene.scoreText.setText).toHaveBeenCalledWith('Score: 150');
            expect(bootScene.levelText.setText).toHaveBeenCalledWith('Level: 3');
        });
    });

    describe('GameState Klasse', () => {
        let gameState;

        beforeEach(() => {
            gameState = new GameState();
        });

        test('Initialzustand sollte START sein', () => {
            expect(gameState.getState()).toBe(gameState.states.START);
        });

        test('Sollte in den Zustand PLAYING wechseln', () => {
            gameState.setState(gameState.states.PLAYING);
            expect(gameState.getState()).toBe(gameState.states.PLAYING);
        });

        test('Sollte in den Zustand GAME_OVER wechseln', () => {
            gameState.setState(gameState.states.GAME_OVER);
            expect(gameState.getState()).toBe(gameState.states.GAME_OVER);
        });

        test('Sollte Fehler bei ungültigem Zustand werfen', () => {
            expect(() => gameState.setState('invalid_state')).toThrow('Invalid state: invalid_state');
        });
    });
});
