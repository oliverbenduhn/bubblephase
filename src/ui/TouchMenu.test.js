import Phaser from 'phaser';
import { TouchMenu } from '../TouchMenu';

// Mocking Phaser
jest.mock('phaser', () => {
  const phaserMock = {
    GameObjects: {
      Graphics: jest.fn().mockImplementation(() => {
        const graphicsMock = {
          fillStyle: jest.fn().mockReturnThis(),
          fillRoundedRect: jest.fn().mockReturnThis(),
          fillRect: jest.fn().mockReturnThis(),
          createGeometryMask: jest.fn().mockReturnValue({ type: 'GeometryMask' }),
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
  };
  return phaserMock;
});

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
    setText: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn().mockImplementation((event, callback) => {
      // Simuliere Event-Aufruf für Testzwecke
      if (event === 'pointerdown' || event === 'pointerup') {
        callback();
      }
      return obj;
    }),
    x: 0,
    y: 0,
    width: 100,
    height: 50
  };
  return obj;
};

// Mock für Phaser.Scene
const mockScene = {
  width: 800,
  height: 600,
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
    rectangle: jest.fn(() => createInteractiveObject()),
    circle: jest.fn(() => createInteractiveObject()),
    text: jest.fn(() => createInteractiveObject()),
    image: jest.fn(() => createInteractiveObject()),
    graphics: jest.fn(() => {
      const graphicsMock = {
        fillStyle: jest.fn().mockReturnThis(),
        fillRoundedRect: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        createGeometryMask: jest.fn().mockReturnValue({ type: 'GeometryMask' }),
        destroy: jest.fn()
      };
      return graphicsMock;
    }),
    zone: jest.fn(() => createInteractiveObject())
  },
  tweens: {
    add: jest.fn().mockImplementation(({ onComplete }) => {
      // Simuliere die Fertigstellung der Animation
      if (onComplete) {
        setTimeout(onComplete, 0);
      }
      return { play: jest.fn() };
    })
  },
  scene: {
    restart: jest.fn()
  },
  scale: {
    width: 800,
    height: 600,
    on: jest.fn()
  },
  input: {
    keyboard: {
      on: jest.fn()
    }
  },
  sound: {
    mute: false
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
    expect(touchMenu.buttons[0].rectangle).toBeDefined();
    expect(touchMenu.background.height).toBeGreaterThan(0);
  });

  test('öffnet und schließt das Menü', () => {
    touchMenu.open();
    expect(touchMenu.container.setVisible).toHaveBeenCalledWith(true);
    expect(mockScene.tweens.add).toHaveBeenCalled();
    
    touchMenu.close();
    expect(mockScene.tweens.add).toHaveBeenCalled();
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

  test('ruft Callback bei Button-Klick auf', () => {
    const callback = jest.fn();
    const button = touchMenu.addButton('Callback Test', callback);
    
    // Simuliere Button-Loslassen
    const pointerup = button.on.mock.calls.find(call => call[0] === 'pointerup')[1];
    pointerup();
  });

  test('räumt Ressourcen bei Zerstörung auf', () => {
    touchMenu.destroy();
    expect(touchMenu.container.destroy).toHaveBeenCalled();
  });
});
