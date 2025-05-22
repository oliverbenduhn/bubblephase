// filepath: /home/oliverbenduhn/Dokumente/projekte/bubblephase/src/MobileOptimization.test.js
import Phaser from 'phaser';
import { MobileOptimization } from './MobileOptimization';

// Mocking the entire Phaser library
jest.mock('phaser', () => ({
  GameObjects: {
    Graphics: jest.fn().mockImplementation(() => {
      const graphicsMock = {
        arc: jest.fn(() => graphicsMock),
        lineStyle: jest.fn(() => graphicsMock),
        beginPath: jest.fn(() => graphicsMock),
        strokePath: jest.fn(() => graphicsMock),
        setFillStyle: jest.fn(() => graphicsMock),
        fillCircle: jest.fn(() => graphicsMock),
        strokeCircle: jest.fn(() => graphicsMock),
      };
      return graphicsMock;
    }),
  },
  Scale: {
    on: jest.fn((event, callback) => callback()),
  },
  Math: {
    Angle: {
      Between: jest.fn(() => 0)
    }
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
    destroy: jest.fn(),
    on: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    x: 0,
    y: 0
  };
  return obj;
};

// Mock für Phaser.Scene
const mockScene = {
  add: {
    circle: () => createInteractiveObject(),
    graphics: () => {
      let graphicsMock = {};
      graphicsMock = {
        lineStyle: jest.fn().mockReturnValue(graphicsMock),
        beginPath: jest.fn().mockReturnValue(graphicsMock),
        moveTo: jest.fn().mockReturnValue(graphicsMock),
        lineTo: jest.fn().mockReturnValue(graphicsMock),
        arc: jest.fn().mockReturnValue(graphicsMock),
        strokePath: jest.fn().mockReturnValue(graphicsMock),
        destroy: jest.fn()
      };
      return graphicsMock;
    },
    rectangle: () => {
      const rect = createInteractiveObject();
      rect.setOrigin = () => rect;
      rect.setPosition = () => rect;
      return rect;
    }
  },
  width: 800,
  height: 600,
  tweens: {
    add: jest.fn().mockReturnValue({
      play: jest.fn()
    })
  },
  emit: jest.fn(),
  scale: {
    width: 800,
    height: 600,
    on: jest.fn((event, callback) => {
      if (event === 'resize') {
        callback();
      }
    })
  },
  children: {
    list: [
      { isButton: true, width: 100, setScale: jest.fn(), setPosition: jest.fn() },
      { isButton: false }
    ]
  }
};

describe('MobileOptimization', () => {
  let mobileOpt;

  beforeEach(() => {
    mobileOpt = new MobileOptimization(mockScene);
  });

  test('erkennt mobile Geräte korrekt', () => {
    global.window = Object.create(window);
    global.window.ontouchstart = () => {};
    
    const mobileOptWithTouch = new MobileOptimization(mockScene);
    expect(mobileOptWithTouch.isMobile).toBe(true);
  });

  test('erstellt Touch-Steuerelemente für mobile Geräte', () => {
    expect(mobileOpt.touchControls).toBeDefined();
    expect(mobileOpt.touchControls.left).toBeDefined();
    expect(mobileOpt.touchControls.right).toBeDefined();
    expect(mobileOpt.touchControls.shoot).toBeDefined();
  });

  test('emittiert Events bei Touch-Interaktionen', () => {
    mobileOpt.handleMove('left');
    expect(mockScene.emit).toHaveBeenCalledWith('mobileMove', 'left');

    mobileOpt.handleMove('right');
    expect(mockScene.emit).toHaveBeenCalledWith('mobileMove', 'right');

    mobileOpt.handleShoot();
    expect(mockScene.emit).toHaveBeenCalledWith('mobileShoot');
  });

  test('respektiert Mindestgröße für Touch-Buttons', () => {
    const customMinSize = 60;
    const mobileOptCustom = new MobileOptimization(mockScene, {
      minButtonSize: customMinSize
    });
    expect(mobileOptCustom.config.minButtonSize).toBe(customMinSize);
  });

  test('kann Touch-Steuerelemente ein- und ausblenden', () => {
    mobileOpt.toggleTouchControls(false);
    mobileOpt.toggleTouchControls(true);
    // Kein Fehler sollte auftreten
    expect(true).toBe(true);
  });

  test('bietet haptisches Feedback wenn verfügbar', () => {
    // Mock navigator.vibrate
    const vibrateMock = jest.fn();
    Object.defineProperty(global.navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true
    });

    mobileOpt.provideFeedback();
    expect(vibrateMock).toHaveBeenCalledWith(10);

    // Cleanup
    delete global.navigator.vibrate;
  });

  test('passt Steuerelemente bei Größenänderung an', () => {
    const newWidth = 1024;
    const newHeight = 768;
    mobileOpt.resize(newWidth, newHeight);
    // Keine Fehler sollten auftreten
    expect(true).toBe(true);
  });

  test('räumt Ressourcen bei Zerstörung auf', () => {
    mobileOpt.destroy();
    // Überprüfe, ob keine Fehler auftreten
    expect(true).toBe(true);
  });

  test('berechnet Buttongrößen korrekt', () => {
    // Test für minimale Größe
    mockScene.width = 200;
    mockScene.height = 300;
    let size = mobileOpt.calculateButtonSize();
    expect(size).toBe(44); // Sollte Mindestgröße sein

    // Test für mittlere Größe
    mockScene.width = 800;
    mockScene.height = 600;
    size = mobileOpt.calculateButtonSize();
    expect(size).toBeGreaterThan(44);
    expect(size).toBeLessThan(88);

    // Test für maximale Größe
    mockScene.width = 2000;
    mockScene.height = 1500;
    size = mobileOpt.calculateButtonSize();
    expect(size).toBe(88);
  });

  test('berücksichtigt Safe Area Insets', () => {
    const safeAreaConfig = {
      safeAreaInsets: {
        top: 20,
        right: 10,
        bottom: 30,
        left: 10
      }
    };
    
    const mobileOptWithSafeArea = new MobileOptimization(mockScene, safeAreaConfig);
    
    const overlay = createInteractiveObject();
    mobileOptWithSafeArea.touchOverlay = overlay;
    
    mobileOptWithSafeArea.resize(800, 600);
    
    expect(overlay.setPosition).toHaveBeenCalledWith(10, 20);
    expect(overlay.setSize).toHaveBeenCalledWith(780, 440); // 800-20, (600-50)*0.8
  });

  test('bietet verbessertes visuelles Feedback', () => {
    const button = mobileOpt.createTouchButton('left', 100, 100);
    
    // Simuliere Hover
    mobileOpt.handleButtonOver(button);
    expect(button.setStrokeStyle).toHaveBeenCalled();
    expect(button.setFillStyle).toHaveBeenCalled();
    
    // Simuliere Klick
    mobileOpt.handleButtonDown(button);
    expect(button.setStrokeStyle).toHaveBeenCalled();
    expect(button.setFillStyle).toHaveBeenCalled();
  });

  test('should adjust UI elements based on screen size', () => {
    mobileOpt.adjustUIElements();

    const button = mockScene.children.list[0];
    expect(button.setScale).toHaveBeenCalled();
    expect(button.setPosition).toHaveBeenCalled();
  });

  test('should monitor screen size changes', () => {
    mobileOpt.monitorScreenSize();
    expect(mockScene.scale.on).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
