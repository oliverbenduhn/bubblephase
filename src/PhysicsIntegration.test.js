import { TEST_COLOR_MAP } from './test-utils';
// Neue Test-Datei für fehlende Physik-Integrationstests
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS } from './Bubble';
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_RADIUS } from './config';

describe('Physics Integration Tests', () => {
  let mockScene, grid, shooter, colorGroup;

  beforeEach(() => {
    // Comprehensive Phaser Scene Mock with all necessary APIs
    mockScene = {
      // Mock für scene.add (Game Object Factory)
      add: {
        circle: jest.fn((x, y, radius, fillColor) => {
          const mockCircle = {
            x: x || 0,
            y: y || 0,
            radius: radius || 20,
            fillColor: fillColor || 0xffffff,
            setStrokeStyle: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
            // Physics body simulation
            body: {
              setCircle: jest.fn(),
              setVelocity: jest.fn(),
              updateFromGameObject: jest.fn(),
              setCollideWorldBounds: jest.fn(),
              setBounce: jest.fn(),
              setImmovable: jest.fn(),
              setFrictionX: jest.fn(),
              setFrictionY: jest.fn(),
              setMaxVelocity: jest.fn().mockReturnThis(),
              setDrag: jest.fn().mockReturnThis(),
              enable: true,
              onWorldBounds: false,
              velocity: { x: 0, y: 0 },
              maxVelocity: { x: 600, y: 600 },
              drag: { x: 0.98, y: 0.98 }
            }
          };
          return mockCircle;
        }),
        text: jest.fn((x, y, text, style) => ({
          x: x || 0,
          y: y || 0,
          text: text || '',
          style: style || {},
          setOrigin: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        line: jest.fn((x, y, x1, y1, x2, y2, color, alpha) => ({
          x: x || 0,
          y: y || 0,
          setLineWidth: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setTo: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        graphics: jest.fn(() => ({
          fillStyle: jest.fn().mockReturnThis(),
          fillCircle: jest.fn().mockReturnThis(),
          strokeCircle: jest.fn().mockReturnThis(),
          lineStyle: jest.fn().mockReturnThis(),
          clear: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        rectangle: jest.fn((x, y, width, height, color, alpha) => ({
          x: x || 0,
          y: y || 0,
          width: width || 100,
          height: height || 100,
          setOrigin: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        zone: jest.fn((x, y, width, height) => ({
          x: x || 0,
          y: y || 0,
          width: width || 100,
          height: height || 100,
          setInteractive: jest.fn().mockReturnThis(),
          setSize: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          on: jest.fn(),
          destroy: jest.fn()
        })),
      }, // Ende von add
      // Mock für scene.physics (Physics System) - Korrigierte Position
      physics: {
        add: {
          existing: jest.fn((gameObject) => {
            // Simuliere die Hinzufügung von Physik zu einem GameObject
            if (!gameObject.body) {
              gameObject.body = {
                setCircle: jest.fn().mockReturnThis(),
                setVelocity: jest.fn().mockReturnThis(),
                setMaxVelocity: jest.fn().mockReturnThis(),
                setDrag: jest.fn().mockReturnThis(),
                updateFromGameObject: jest.fn().mockReturnThis(),
                setCollideWorldBounds: jest.fn().mockReturnThis(),
                setBounce: jest.fn().mockReturnThis(),
                setImmovable: jest.fn().mockReturnThis(),
                setFrictionX: jest.fn().mockReturnThis(),
                setFrictionY: jest.fn().mockReturnThis(),
                enable: true,
                onWorldBounds: false,
                velocity: { x: 0, y: 0 },
                maxVelocity: { x: 600, y: 600 },
                drag: { x: 0.98, y: 0.98 }
              };
            }
            return gameObject;
          }),
          overlap: jest.fn((objectA, objectB, callback) => {
            // Mock für Kollisionserkennung zwischen Objekten
            return {
              destroy: jest.fn(),
              active: true
            };
          })
        },
        world: {
          on: jest.fn(),
          off: jest.fn(),
          removeCollider: jest.fn(),
          setBounds: jest.fn(),
          gravity: { x: 0, y: 0 }
        }
      },
      // Mock für scene.sys (Scene Systems)
      sys: {
        game: {
          config: {
            width: 800,
            height: 600
          },
          events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
          }
        },
        events: {
          on: jest.fn(),
          off: jest.fn(),
          emit: jest.fn()
        }
      },
      // Mock für scene.input (Input System)
      input: {
        on: jest.fn(),
        off: jest.fn(),
        once: jest.fn(),
        activePointer: {
          isDown: false,
          x: 0,
          y: 0
        },
        manager: {
          canvas: {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
          }
        }
      },
      // Mock für scene.tweens (Tween System für Animationen)
      tweens: {
        add: jest.fn((config) => {
          // Simuliere sofortige Ausführung der Tween-Callbacks
          if (config.onComplete) {
            setTimeout(config.onComplete, 0);
          }
          return {
            destroy: jest.fn(),
            stop: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn()
          };
        })
      },
      // Mock für scene.scale (Scale Manager)
      scale: {
        width: 800,
        height: 600,
        on: jest.fn(),
        off: jest.fn()
      },
      // Mock für scene.sound (Sound System)
      sound: {
        add: jest.fn(),
        remove: jest.fn(),
        play: jest.fn(),
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn()
      }
    };
  });

  beforeEach(() => {
    grid = new Grid(mockScene, 8, 8);
    shooter = new Shooter(mockScene, 400, 500);
    colorGroup = new ColorGroup(grid);
  });

  describe('Physik-Verhalten von Bubbles', () => {
    test('sollte korrekte Physik-Eigenschaften bei Bubble-Initialisierung setzen', () => {
      const bubble = new Bubble(mockScene, 400, 300, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      
      expect(bubble.gameObject.body.setCircle).toHaveBeenCalledWith(BUBBLE_RADIUS);
      expect(bubble.gameObject.body.setCollideWorldBounds).toHaveBeenCalledWith(true);
      expect(bubble.gameObject.body.setBounce).toHaveBeenCalledWith(1);
      expect(bubble.gameObject.body.setMaxVelocity).toHaveBeenCalled();
      expect(bubble.gameObject.body.setDrag).toHaveBeenCalled();
    });

    test('sollte Geschwindigkeit korrekt aktualisieren bei Schuss', () => {
      const bubble = new Bubble(mockScene, 400, 500, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      const angle = Math.PI / 4; // 45 Grad
      const velocity = 300;

      bubble.shoot(angle, velocity);

      const expectedVx = Math.cos(angle) * velocity;
      const expectedVy = Math.sin(angle) * velocity;

      expect(bubble.gameObject.body.setVelocity).toHaveBeenCalledWith(expectedVx, expectedVy);
    });
  });

  describe('Kollisionserkennung', () => {
    test('sollte Bubble-zu-Bubble Kollisionen korrekt erkennen', () => {
      const bubble1 = new Bubble(mockScene, 100, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      const bubble2 = new Bubble(mockScene, 100 + BUBBLE_RADIUS * 1.9, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
      
      // Bubbles überlappen sich leicht (Abstand < 2 * BUBBLE_RADIUS)
      const collision = Collision.checkBubbleCollision(bubble1, bubble2);
      expect(collision).toBe(true);
    });

    test('sollte keine Kollision erkennen bei ausreichendem Abstand', () => {
      const bubble1 = new Bubble(mockScene, 100, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      const bubble2 = new Bubble(mockScene, 100 + BUBBLE_RADIUS * 3, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
      
      // Bubbles sind weiter auseinander als 2 * BUBBLE_RADIUS
      const collision = Collision.checkBubbleCollision(bubble1, bubble2);
      expect(collision).toBe(false);
    });
  });

  describe('Physik-Integration mit Grid', () => {
    test('sollte Bubble korrekt im Grid platzieren nach Kollision', () => {
      const movingBubble = new Bubble(mockScene, 200, 200, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      const staticBubble = new Bubble(mockScene, 200, 200 - BUBBLE_RADIUS * 2, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
      
      grid.addBubble(0, 4, staticBubble); // Statische Bubble in oberster Reihe
      
      const collisionPos = { x: 200, y: 200 };
      const attachmentPos = Collision.findNearestEmptyCell(grid, collisionPos);
      
      expect(attachmentPos).toBeDefined();
      expect(grid.isValidGridPosition(attachmentPos.row, attachmentPos.col)).toBe(true);
      
      // Prüfe, ob die Position unterhalb der statischen Bubble ist
      expect(attachmentPos.row).toBe(1);
    });

    test('sollte Physik deaktivieren nach Grid-Attachment', () => {
      const bubble = new Bubble(mockScene, 200, 200, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      const row = 1, col = 4;
      
      grid.addBubble(row, col, bubble);
      
      // Nach Attachment sollte die Bubble stationär sein
      expect(bubble.gameObject.body.setImmovable).toHaveBeenCalledWith(true);
      expect(bubble.gameObject.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });
  });
});
