import { Bubble, BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';

// Mock für die Phaser-Szene, da wir keine echte Szene im Test benötigen
const mockScene = {
  add: {
    circle: jest.fn().mockImplementation(() => ({ // Geändert zu mockImplementation
      setStrokeStyle: jest.fn(),
      destroy: jest.fn(),
      setPosition: jest.fn(),
      body: {
        setCircle: jest.fn(),
        setVelocity: jest.fn(),
        reset: jest.fn(),
        setMaxVelocity: jest.fn().mockReturnThis(),
        setDrag: jest.fn().mockReturnThis(),
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
    const color = BUBBLE_COLORS.BLUE;

    const bubble = new Bubble(mockScene, x, y, radius, color);

    expect(bubble.scene).toBe(mockScene);
    expect(bubble.x).toBe(x);
    expect(bubble.y).toBe(y);
    expect(bubble.radius).toBe(radius);
    expect(bubble.color).toBe(color);
    expect(bubble.gameObject).toBeNull(); // Initial kein Phaser-Grafikobjekt
  });

  test('draw Methode sollte ein Phaser Circle Objekt erstellen und zurückgeben', () => {
    const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED);
    const graphicObject = bubble.draw();

    expect(mockScene.add.circle).toHaveBeenCalledWith(0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED);
    expect(graphicObject).toBeDefined();
    expect(graphicObject.setStrokeStyle).toHaveBeenCalledWith(1, 0x000000, 0.8);
    expect(bubble.gameObject).toBe(graphicObject);
  });

  test('draw Methode sollte ein existierendes gameObject vor dem Neuzeichnen zerstören', () => {
    const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED);
    const firstGraphicObject = bubble.draw(); // Erstes Zeichnen

    // Stelle sicher, dass die destroy-Methode des ersten Objekts aufgerufen wird,
    // wenn draw() erneut aufgerufen wird.
    // Wichtig: mockScene.add.circle muss für den zweiten Aufruf zurückgesetzt oder neu gemockt werden,
    // wenn man sicherstellen will, dass es tatsächlich ein *neues* Objekt ist.
    // In diesem Fall reicht es zu prüfen, ob destroy auf dem *ersten* Objekt aufgerufen wurde
    // und das bubble.gameObject nun das *zweite* (potenziell neue) Objekt ist.
    // Die Änderung in mockImplementation oben stellt sicher, dass es neue Objekte sind.

    const secondGraphicObject = bubble.draw(); // Zweites Zeichnen

    expect(firstGraphicObject.destroy).toHaveBeenCalled();
    expect(bubble.gameObject).toBe(secondGraphicObject);
    expect(firstGraphicObject).not.toBe(secondGraphicObject); // Sollte jetzt passen
  });


  test('setPosition sollte die x und y Eigenschaften aktualisieren und das gameObject verschieben', () => {
    const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.GREEN);
    bubble.draw(); // gameObject muss existieren

    const newX = 150;
    const newY = 250;
    bubble.setPosition(newX, newY);

    expect(bubble.x).toBe(newX);
    expect(bubble.y).toBe(newY);
    expect(bubble.gameObject.setPosition).toHaveBeenCalledWith(newX, newY);
  });

  test('destroy Methode sollte das gameObject zerstören und auf null setzen', () => {
    const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.YELLOW);
    const graphicObject = bubble.draw();

    bubble.destroy();

    expect(graphicObject.destroy).toHaveBeenCalled();
    expect(bubble.gameObject).toBeNull();
  });
});
