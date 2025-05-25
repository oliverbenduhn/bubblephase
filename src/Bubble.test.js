import { TEST_COLOR_MAP } from './test-utils';
import { Bubble, BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';

// Mock für die Phaser-Szene, da wir keine echte Szene im Test benötigen
const mockScene = {
  add: {
    circle: jest.fn().mockImplementation(() => ({
      setStrokeStyle: jest.fn(),
      destroy: jest.fn(),
      setPosition: jest.fn(),
      body: {
        setCircle: jest.fn(),
        setVelocity: jest.fn(),
        reset: jest.fn(),
        setMaxVelocity: jest.fn().mockReturnThis(),
        setDrag: jest.fn().mockReturnThis(),
        setFrictionX: jest.fn(),
        setFrictionY: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setBounce: jest.fn(),
        setImmovable: jest.fn(),
        maxVelocity: { x: 600, y: 600 },
        drag: { x: 0.98, y: 0.98 }
      }
    })),
    // Mocke andere Methoden, die von Bubble verwendet werden könnten, falls nötig
  },
  physics: {
    add: {
      existing: jest.fn()
    }
  }
};

describe('Bubble', () => {
  test('sollte korrekt mit den übergebenen Eigenschaften initialisiert werden', () => {
    const x = 50;
    const y = 100;
    const radius = BUBBLE_RADIUS;
    const colorId = TEST_COLOR_MAP.BLUE; // Dies ist jetzt die logische ID

    const bubble = new Bubble(mockScene, x, y, radius, colorId);

    expect(bubble.scene).toBe(mockScene);
    expect(bubble.x).toBe(x);
    expect(bubble.y).toBe(y);
    expect(bubble.radius).toBe(radius);
    expect(bubble.colorId).toBe(colorId);
  });
});
