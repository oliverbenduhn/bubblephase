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

  test('sollte die draw-Methode das gameObject erstellen und konfigurieren', () => {
    const bubble = new Bubble(mockScene, 50, 50, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
    bubble.draw();

    expect(mockScene.add.circle).toHaveBeenCalledWith(50, 50, BUBBLE_RADIUS, bubble.color);
    expect(mockScene.physics.add.existing).toHaveBeenCalledWith(bubble.gameObject, false);
    expect(bubble.gameObject.body.setCircle).toHaveBeenCalledWith(BUBBLE_RADIUS);
    expect(bubble.gameObject.setStrokeStyle).toHaveBeenCalled();
    expect(bubble.gameObject.body.setVelocity).toHaveBeenCalledWith(0,0);
  });

  test('sollte die setPosition-Methode die Position der Bubble und des gameObjects aktualisieren', () => {
    const bubble = new Bubble(mockScene, 50, 50, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
    bubble.draw(); // gameObject muss existieren

    const newX = 150;
    const newY = 200;
    bubble.setPosition(newX, newY);

    expect(bubble.x).toBe(newX);
    expect(bubble.y).toBe(newY);
    expect(bubble.gameObject.setPosition).toHaveBeenCalledWith(newX, newY);
    expect(bubble.gameObject.body.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(bubble.gameObject.body.x).toBe(newX - bubble.radius);
    expect(bubble.gameObject.body.y).toBe(newY - bubble.radius);
  });

  test('sollte die destroy-Methode das gameObject zerstören', () => {
    const bubble = new Bubble(mockScene, 50, 50, BUBBLE_RADIUS, TEST_COLOR_MAP.YELLOW);
    bubble.draw(); // gameObject muss existieren

    const mockDestroy = bubble.gameObject.destroy; // Speichere die Mock-Funktion
    bubble.destroy();

    expect(mockDestroy).toHaveBeenCalled();
    expect(bubble.gameObject).toBeNull();
  });
});
