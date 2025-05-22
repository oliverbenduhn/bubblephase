import Phaser from 'phaser';
import { TouchMenu } from './TouchMenu';

// Mocking Phaser
jest.mock('phaser', () => ({
  GameObjects: {
    Graphics: jest.fn().mockImplementation(() => {
      const graphicsMock = {
        fillStyle: jest.fn(() => graphicsMock),
        fillRoundedRect: jest.fn(() => graphicsMock),
        fillRect: jest.fn(() => graphicsMock),
        createGeometryMask: jest.fn(() => ({ type: 'GeometryMask' })),
        destroy: jest.fn()
      };
      return graphicsMock;
    }),
  },
  Math: {
    Angle: {
      Between: jest.fn(() => 0)
    },
    RadToDeg: jest.fn(rad => rad * 57.29578),
    DegToRad: jest.fn(deg => deg * 0.0174533),
    Between: jest.fn(() => 1)
  }
}));

// Hilfs-Factory für interaktive Objekte
const createInteractiveObject = () => {
  const obj = {
    setStrokeStyle: jest.fn().mockReturnThis(),
    setFillStyle: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setMask: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
    width: 100,
    height: 50
  };
  return obj;
};

// Mock für Phaser.Scene
const mockScene = {
  add: {
    container: () => {
      const container = {
        setVisible: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        add: jest.fn(),
        destroy: jest.fn(),
        visible: true
      };
      return container;
    },
    rectangle: () => createInteractiveObject(),
    circle: () => createInteractiveObject(),
    text: () => createInteractiveObject(),
    image: () => createInteractiveObject(),
    graphics: () => {
      const graphicsMock = {
        fillStyle: jest.fn().mockReturnThis(),
        fillRoundedRect: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        createGeometryMask: jest.fn().mockReturnValue({ type: 'GeometryMask' }),
        destroy: jest.fn()
      };
      return graphicsMock;
    },
  },
  width: 800,
  height: 600,
  tweens: {
    add: jest.fn().mockReturnValue({
      play: jest.fn()
    })
  },
  scene: {
    restart: jest.fn()
  },
  scale: {
    width: 800,
    height: 600,
    on: jest.fn((event, callback) => {
      if (event === 'resize') {
        callback();
      }
    })
  }
};

describe('TouchMenu', () => {
  let touchMenu;

  beforeEach(() => {
    touchMenu = new TouchMenu(mockScene);
  });

  test('erstellt TouchMenu mit Standardkonfiguration', () => {
    expect(touchMenu).toBeDefined();
    expect(touchMenu.container).toBeDefined();
    expect(touchMenu.background).toBeDefined();
  });

  test('fügt Buttons hinzu und aktualisiert Menühöhe', () => {
    const callback = jest.fn();
    const button = touchMenu.addButton('Test Button', callback);
    
    expect(touchMenu.buttons.length).toBe(1);
    expect(touchMenu.buttons[0].text).toBeDefined();
    expect(touchMenu.background.height).toBeGreaterThan(0);
  });

  test('öffnet und schließt das Menü', () => {
    touchMenu.open();
    expect(touchMenu.container.setVisible).toHaveBeenCalledWith(true);
    expect(mockScene.tweens.add).toHaveBeenCalled();
    
    touchMenu.close();
    expect(mockScene.tweens.add).toHaveBeenCalled();
  });

  test('unterstützt Swipe-Gesten', () => {
    touchMenu.onDragStart({ x: 100, y: 100 });
    expect(touchMenu.gestures.isDragging).toBe(true);
    
    touchMenu.onDragMove({ x: 100, y: 200 });
    expect(touchMenu.gestures.isDragging).toBe(false);
    
    touchMenu.onDragEnd();
    expect(touchMenu.gestures.isDragging).toBe(false);
  });

  test('erstellt Hauptmenü mit benutzerdefinierten Einträgen', () => {
    const items = [
      { text: 'Option 1', callback: jest.fn() },
      { text: 'Option 2', callback: jest.fn() }
    ];
    
    touchMenu.createMainMenu(items);
    expect(touchMenu.buttons.length).toBe(2);
    expect(touchMenu.container.setPosition).toHaveBeenCalled();
  });

  test('erstellt Pausemenü mit Pausebutton', () => {
    const pauseButton = touchMenu.createPauseMenu();
    expect(pauseButton).toBeDefined();
    expect(pauseButton.setInteractive).toHaveBeenCalled();
  });

  test('passt sich an verschiedene Bildschirmgrößen an', () => {
    // Füge Buttons hinzu, damit es etwas zum Anpassen gibt
    touchMenu.addButton('Button 1', jest.fn());
    touchMenu.addButton('Button 2', jest.fn());
    
    // Erstelle den Pausebutton
    touchMenu.createPauseMenu();
    
    // Teste Resize-Funktion im Portraitmodus
    touchMenu.resize(400, 800);
    expect(touchMenu.config.width).toBe(360); // 400 * 0.9
    
    // Teste Resize-Funktion im Landscape-Modus
    touchMenu.resize(800, 400);
    expect(touchMenu.config.width).toBe(480); // 800 * 0.6
  });

  test('gibt haptisches Feedback wenn verfügbar', () => {
    // Mock navigator.vibrate
    const vibrateMock = jest.fn();
    Object.defineProperty(global.navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true
    });

    const button = touchMenu.addButton('Feedback Test', jest.fn());
    
    // Simuliere Button-Druck
    const pointerdown = button.on.mock.calls.find(call => call[0] === 'pointerdown')[1];
    pointerdown();
    
    expect(vibrateMock).toHaveBeenCalledWith(10);

    // Cleanup
    delete global.navigator.vibrate;
  });

  test('ruft Callback bei Button-Klick auf', () => {
    let callbackCalled = false;
    const callback = () => { callbackCalled = true; };
    const button = touchMenu.addButton('Callback Test', callback);
    
    // Prüfe, ob der Callback korrekt gespeichert wurde
    expect(typeof button.customData.callback).toBe('function');
    
    // Direktes Aufrufen des Callbacks
    button.customData.callback();
    
    expect(callbackCalled).toBe(true);
  });

  test('räumt Ressourcen bei Zerstörung auf', () => {
    touchMenu.destroy();
    expect(touchMenu.container.destroy).toHaveBeenCalled();
  });
});
