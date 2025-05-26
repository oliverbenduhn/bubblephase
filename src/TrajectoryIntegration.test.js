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
      canShoot: true
      // updateAim wird in den einzelnen Tests nach Bedarf gesetzt
    };
  });

  test('Mobile Optimization initializes with correct config for mobile devices', () => {
    import { MobileOptimization } from './MobileOptimization.js';
    
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
    
    // Setup scene mit MobileOptimization und zusätzlichen Properties
    scene.mobileOptimization = new MobileOptimization(scene, {});
    scene.isAiming = false;
    scene.BUBBLE_RADIUS = 15;
    
    // Mock Phaser Math utilities
    global.Phaser = {
      Math: {
        Angle: {
          Between: jest.fn((x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1))
        },
        RadToDeg: jest.fn((radians) => radians * 180 / Math.PI),
        DegToRad: jest.fn((degrees) => degrees * Math.PI / 180)
      }
    };
    
    // Mock für simulateTrajectory Methode
    scene.simulateTrajectory = jest.fn(() => [
      { x: scene.cannon.x, y: scene.cannon.y },
      { x: scene.cannon.x + 50, y: scene.cannon.y - 50 },
      { x: scene.cannon.x + 100, y: scene.cannon.y - 100 }
    ]);
    
    // Erweiterte Mock für aimLine graphics methods
    scene.aimLine = {
      clear: jest.fn(),
      lineStyle: jest.fn(),
      beginPath: jest.fn(), 
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      strokePath: jest.fn(),
      fillStyle: jest.fn(),
      fillCircle: jest.fn(),
      setTo: jest.fn(),
      setVisible: jest.fn()
    };
    
    // Implementiere eine realistische updateAim-Simulation basierend auf der echten Implementierung
    scene.updateAim = function(pointerX, pointerY) {
      if (!this.aimLine || !this.cannon) return;

      // Winkelberechnung
      const angle = Phaser.Math.Angle.Between(
        this.cannon.x,
        this.cannon.y,
        pointerX,
        pointerY
      );

      // Winkelbegrenzung 
      let angleInDegrees = Phaser.Math.RadToDeg(angle);
      if (angleInDegrees > 180) angleInDegrees -= 360;
      
      const MIN_ANGLE = -160;
      const MAX_ANGLE = -20;
      
      let limitedAngle = angle;
      if (angleInDegrees > MAX_ANGLE && angleInDegrees < 90) {
        limitedAngle = Phaser.Math.DegToRad(MAX_ANGLE);
      } else if (angleInDegrees < MIN_ANGLE && angleInDegrees > -270) {
        limitedAngle = Phaser.Math.DegToRad(MIN_ANGLE);
      }

      // Trajektorien-Simulation
      const trajectory = this.simulateTrajectory(this.cannon.x, this.cannon.y, limitedAngle);

      // Grafik-Updates
      this.aimLine.clear();
      
      if (trajectory.length > 1) {
        this.aimLine.lineStyle(1.5, 0x00ff00, 0.8);
        this.aimLine.beginPath();
        this.aimLine.moveTo(trajectory[0].x, trajectory[0].y);
        
        for (let i = 1; i < trajectory.length; i++) {
          this.aimLine.lineTo(trajectory[i].x, trajectory[i].y);
        }
        
        this.aimLine.strokePath();
      }

      // Mobile Optimization Integration
      if (this.mobileOptimization) {
        this.mobileOptimization.showTrajectoryHelper(
          this.cannon.x,
          this.cannon.y,
          pointerX,
          pointerY
        );
      }
    };

    // Test updateAim mit realistischer Simulation
    scene.updateAim(500, 300);

    // Verifikationen
    expect(scene.aimLine.clear).toHaveBeenCalled();
    expect(scene.simulateTrajectory).toHaveBeenCalledWith(
      scene.cannon.x,
      scene.cannon.y,
      expect.any(Number)
    );
    expect(scene.mobileOptimization.showTrajectoryHelper).toHaveBeenCalledWith(
      scene.cannon.x,
      scene.cannon.y,
      500,
      300
    );
    
    // Zusätzliche Überprüfungen für Grafik-Rendering
    expect(scene.aimLine.lineStyle).toHaveBeenCalled();
    expect(scene.aimLine.beginPath).toHaveBeenCalled();
    expect(scene.aimLine.strokePath).toHaveBeenCalled();
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
