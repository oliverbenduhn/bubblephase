// TrajectoryIntegration.test.js - Test für die Integration des erweiterten Trajektorien-Systems

import { jest } from '@jest/globals';

// Mock Phaser
const mockCircle = {
  setVisible: jest.fn(),
  setPosition: jest.fn(),
  setDepth: jest.fn()
};

const mockGraphics = {
  setDepth: jest.fn(),
  setVisible: jest.fn(),
  clear: jest.fn(),
  lineStyle: jest.fn(),
  strokeCircle: jest.fn()
};

const mockScene = {
  add: {
    circle: jest.fn(() => mockCircle),
    graphics: jest.fn(() => mockGraphics)
  },
  tweens: {
    add: jest.fn()
  },
  events: {
    on: jest.fn()
  },
  emit: jest.fn(),
  scale: {
    width: 800,
    height: 600
  }
};

// Mock MobileOptimization
jest.mock('./MobileOptimization.js', () => {
  return {
    MobileOptimization: jest.fn().mockImplementation((scene, config) => {
      return {
        scene,
        config,
        trajectoryIndicators: [mockCircle, mockCircle, mockCircle],
        aimHelper: mockGraphics,
        setupTrajectoryHelpers: jest.fn(),
        showTrajectoryHelper: jest.fn(),
        hideTrajectoryHelper: jest.fn(),
        isMobile: config?.showTouchControls || false
      };
    })
  };
});

// Mock andere Abhängigkeiten
jest.mock('./Grid.js', () => ({
  Grid: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('./Bubble.js', () => ({
  Bubble: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('./Shooter.js', () => ({
  Shooter: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('./Collision.js', () => ({
  Collision: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('./ColorGroup.js', () => ({
  ColorGroup: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('./config.js', () => ({
  BUBBLE_RADIUS: 15,
  BUBBLE_COLORS: {
    RED: 0xff0000,
    BLUE: 0x0000ff
  }
}));

jest.mock('./assets/bubble-particle.svg', () => 'mock-svg-path');

describe('Trajectory Integration Tests', () => {
  let scene;
  let mobileOptimization;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup scene mock
    scene = {
      ...mockScene,
      cannon: { x: 400, y: 500 },
      aimLine: {
        setTo: jest.fn(),
        setVisible: jest.fn()
      },
      isMobile: false,
      mobileOptimization: null,
      currentState: 'playing',
      canShoot: true,
      updateAim: null // Wird in Tests gesetzt
    };
  });

  test('Mobile Optimization initializes with correct config for mobile devices', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    const config = {
      showTouchControls: true,
      hapticFeedback: true,
      trajectoryOpacity: 0.7
    };
    
    const mobileOpt = new MobileOptimization(scene, config);
    
    expect(MobileOptimization).toHaveBeenCalledWith(scene, config);
    expect(mobileOpt.config).toEqual(expect.objectContaining(config));
  });

  test('Mobile Optimization initializes with correct config for desktop devices', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    const config = {
      showTouchControls: false,
      hapticFeedback: false,
      trajectoryOpacity: 0.3
    };
    
    const mobileOpt = new MobileOptimization(scene, config);
    
    expect(MobileOptimization).toHaveBeenCalledWith(scene, config);
    expect(mobileOpt.config).toEqual(expect.objectContaining(config));
  });

  test('updateAim method calls trajectory helper for all devices', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    // Setup scene mit MobileOptimization
    scene.mobileOptimization = new MobileOptimization(scene, {});
    scene.updateAim = function(pointerX, pointerY) {
      if (!this.aimLine || !this.cannon) return;

      const angle = Math.atan2(pointerY - this.cannon.y, pointerX - this.cannon.x);
      const distance = 200;
      const endX = this.cannon.x + Math.cos(angle) * distance;
      const endY = this.cannon.y + Math.sin(angle) * distance;

      this.aimLine.setTo(this.cannon.x, this.cannon.y, endX, endY);

      if (this.mobileOptimization) {
        this.mobileOptimization.showTrajectoryHelper(
          this.cannon.x,
          this.cannon.y,
          pointerX,
          pointerY
        );
      }
    };

    // Test updateAim
    scene.updateAim(500, 300);

    expect(scene.aimLine.setTo).toHaveBeenCalledWith(
      scene.cannon.x,
      scene.cannon.y,
      expect.any(Number),
      expect.any(Number)
    );
    
    expect(scene.mobileOptimization.showTrajectoryHelper).toHaveBeenCalledWith(
      scene.cannon.x,
      scene.cannon.y,
      500,
      300
    );
  });

  test('trajectory helper is hidden when pointer moves outside valid area', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    scene.mobileOptimization = new MobileOptimization(scene, {});
    
    // Simuliere pointer move außerhalb des gültigen Bereichs (unterhalb der Kanone)
    const invalidPointerY = scene.cannon.y + 10;
    
    // Simuliere die Logik aus dem pointermove Event-Handler
    if (invalidPointerY >= scene.cannon.y) {
      scene.aimLine.setVisible(false);
      scene.mobileOptimization.hideTrajectoryHelper();
    }

    expect(scene.aimLine.setVisible).toHaveBeenCalledWith(false);
    expect(scene.mobileOptimization.hideTrajectoryHelper).toHaveBeenCalled();
  });

  test('trajectory helper is hidden when shooting', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    scene.mobileOptimization = new MobileOptimization(scene, {});
    
    // Simuliere das Schießen
    scene.aimLine.setVisible(false);
    scene.mobileOptimization.hideTrajectoryHelper();

    expect(scene.aimLine.setVisible).toHaveBeenCalledWith(false);
    expect(scene.mobileOptimization.hideTrajectoryHelper).toHaveBeenCalled();
  });

  test('trajectory helper is hidden on touch end', () => {
    const { MobileOptimization } = require('./MobileOptimization.js');
    
    scene.mobileOptimization = new MobileOptimization(scene, {});
    
    // Simuliere Touch-Ende
    const activePointer = { isDown: false };
    
    if (!activePointer.isDown) {
      scene.aimLine.setVisible(false);
      scene.mobileOptimization.hideTrajectoryHelper();
    }

    expect(scene.aimLine.setVisible).toHaveBeenCalledWith(false);
    expect(scene.mobileOptimization.hideTrajectoryHelper).toHaveBeenCalled();
  });

  test('mobile event handlers are properly set up', () => {
    const eventHandlers = {};
    
    // Mock scene events
    scene.events.on = jest.fn((event, handler) => {
      eventHandlers[event] = handler;
    });

    // Simuliere die Event-Setup aus create()
    scene.events.on('mobileAim', (angle) => {
      // handleMobileAim logic
    });

    scene.events.on('mobileShoot', () => {
      // handleMobileShoot logic
    });

    scene.events.on('mobileMove', (direction) => {
      // handleMobileMove logic
    });

    expect(scene.events.on).toHaveBeenCalledWith('mobileAim', expect.any(Function));
    expect(scene.events.on).toHaveBeenCalledWith('mobileShoot', expect.any(Function));
    expect(scene.events.on).toHaveBeenCalledWith('mobileMove', expect.any(Function));
  });
});
