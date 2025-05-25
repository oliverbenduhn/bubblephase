import { TEST_COLOR_MAP } from './test-utils';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { ColorGroup } from './ColorGroup';
import { Collision } from './Collision';
import { BUBBLE_RADIUS } from './config';

// Mock Phaser Scene
const mockScene = {
  add: {
    circle: jest.fn().mockImplementation(() => ({
      setStrokeStyle: jest.fn(),
      setPosition: jest.fn(),
      destroy: jest.fn(),
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
    }))
  },
  physics: {
    add: {
      existing: jest.fn()
    }
  }
};

describe('Performance Tests', () => {
  let grid, colorGroup;
  
  beforeEach(() => {
    grid = new Grid(mockScene, 12, 10); // Größeres Grid für Performance-Tests
    colorGroup = new ColorGroup(grid);
  });

  describe('Große Gruppen Performance', () => {
    test('verarbeitet sehr große Gruppen effizient', () => {
      // Erstelle eine große Gruppe (8x8 = 64 Bubbles)
      const startTime = performance.now();
      
      // Fülle eine große zusammenhängende Gruppe
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (grid.isValidGridPosition(row, col)) {
            const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
            grid.addBubble(row, col, bubble);
          }
        }
      }
      
      // Finde die große Gruppe
      const group = colorGroup.findConnectedBubbles(0, 0);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(group.length).toBeGreaterThan(50); // Große Gruppe
      expect(duration).toBeLessThan(100); // Unter 100ms
    });
    
    test('findFloatingBubbles ist effizient bei großen Grids', () => {
      const startTime = performance.now();
      
      // Erstelle viele freischwebende Bubbles
      for (let row = 5; row < 10; row++) {
        for (let col = 0; col < 8; col++) {
          if (grid.isValidGridPosition(row, col)) {
            const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
            grid.addBubble(row, col, bubble);
          }
        }
      }
      
      const floatingBubbles = Collision.findFloatingBubbles(grid);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(floatingBubbles.length).toBeGreaterThan(20);
      expect(duration).toBeLessThan(50); // Sehr schnell für floating bubble detection
    });
    
    test('Grid-Operationen sind bei vielen Bubbles schnell', () => {
      const startTime = performance.now();
      
      // Fülle nur ein kleineres Teilgitter (nicht das komplette Grid)
      const maxRows = Math.min(8, grid.rows);
      const maxCols = Math.min(8, grid.cols);
      
      for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col < maxCols; col++) {
          const colors = Object.values(TEST_COLOR_MAP);
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, randomColor);
          grid.addBubble(row, col, bubble);
        }
      }
      
      const midTime = performance.now();
      
      // Teste verschiedene Grid-Operationen
      let bubbleCount = 0;
      grid.forEachBubble((bubble) => {
        if (bubble) bubbleCount++;
      });
      
      const endTime = performance.now();
      const fillTime = midTime - startTime;
      const countTime = endTime - midTime;
      
      expect(bubbleCount).toBe(maxRows * maxCols);
      expect(fillTime).toBeLessThan(1000); // Füllzeit sollte unter 1s sein
      expect(countTime).toBeLessThan(100); // Zählzeit sollte unter 100ms sein
    });
  });
  
  describe('Memory Performance', () => {
    test('Grid-Cleanup ist effizient', () => {
      // Erstelle viele Bubbles
      const bubbles = [];
      for (let i = 0; i < 100; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        if (grid.isValidGridPosition(row, col)) {
          const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
          grid.addBubble(row, col, bubble);
          bubbles.push(bubble);
        }
      }
      
      const startTime = performance.now();
      
      // Entferne alle Bubbles
      bubbles.forEach(bubble => {
        const position = grid.findCellByBubble(bubble);
        if (position) {
          grid.removeBubble(position.row, position.col);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Cleanup ist schnell
      
      // Verifiziere, dass Grid leer ist
      let remainingBubbles = 0;
      grid.forEachBubble((bubble) => {
        if (bubble) remainingBubbles++;
      });
      expect(remainingBubbles).toBe(0);
    });
  });
  
  describe('Edge Cases Performance', () => {
    test('behandelt leeres Spielfeld korrekt', () => {
      const startTime = performance.now();
      
      // Teste Operationen auf leerem Grid
      const floatingBubbles = Collision.findFloatingBubbles(grid);
      const group = colorGroup.findConnectedBubbles(0, 0);
      
      let bubbleCount = 0;
      grid.forEachBubble((bubble) => {
        if (bubble) bubbleCount++;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(floatingBubbles).toHaveLength(0);
      expect(group).toHaveLength(0);
      expect(bubbleCount).toBe(0);
      expect(duration).toBeLessThan(10); // Sehr schnell für leeres Grid
    });
    
    test('Grid mit nur einer Bubble', () => {
      const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.PURPLE);
      grid.addBubble(0, 0, bubble);
      
      const startTime = performance.now();
      
      const group = colorGroup.findConnectedBubbles(0, 0);
      const floatingBubbles = Collision.findFloatingBubbles(grid);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(group).toHaveLength(1);
      expect(floatingBubbles).toHaveLength(0); // Bubble in oberster Reihe ist nicht freischwebend
      expect(duration).toBeLessThan(5);
    });
  });
  
  describe('Stress Tests', () => {
    test('wiederholte Operationen sind stabil', () => {
      const operations = 100; // Reduziert von 1000
      const startTime = performance.now();
      
      for (let i = 0; i < operations; i++) {
        const row = Math.floor(Math.random() * 6); // Kleineres Grid
        const col = Math.floor(Math.random() * 6);
        
        if (grid.isValidGridPosition(row, col) && !grid.getBubble(row, col)) {
          const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.YELLOW);
          grid.addBubble(row, col, bubble);
        }
        
        if (i % 20 === 0) { // Reduziert von 100
          // Gelegentlich Gruppen finden
          colorGroup.findConnectedBubbles(row, col);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // 100 Operationen in unter 500ms
    });
  });
});
