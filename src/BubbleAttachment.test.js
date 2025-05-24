import { TEST_COLOR_MAP } from './test-utils';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { Collision } from './Collision';
import { BUBBLE_RADIUS, BUBBLE_COLORS } from './config';

// Mock Phaser Scene
class MockScene {
  constructor() {
    this.add = {
      circle: jest.fn(() => ({
        setStrokeStyle: jest.fn(),
        setPosition: jest.fn(),
        destroy: jest.fn()
      }))
    };
    this.physics = {
      add: {
        existing: jest.fn(() => ({
          body: {
            setCircle: jest.fn(),
            setVelocity: jest.fn(),
            updateFromGameObject: jest.fn()
          }
        }))
      }
    };
  }
}

describe('Bubble Attachment Mechanism', () => {
  let mockScene;
  let grid;

  beforeEach(() => {
    mockScene = new MockScene();
    grid = new Grid(mockScene, 8, 10, 50, 50);
    
    // Fülle die erste Reihe mit Bubbles für Tests
    for (let col = 0; col < 5; col++) {
      const gridPos = grid.gridToPixel(0, col);
      const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      grid.addBubble(0, col, bubble);
    }
  });

  test('should find nearest empty cell for bubble above grid', () => {
    // Simuliere eine Bubble, die von unten kommt und in der Nähe der ersten Reihe ist
    const shootingBubble = new Bubble(mockScene, 130, 30, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(nearestCell.row).toBe(1); // Sollte in die zweite Reihe platziert werden
    expect(nearestCell.col).toBeGreaterThanOrEqual(0);
    expect(nearestCell.col).toBeLessThan(10);
  });

  test('should find nearest empty cell for bubble hitting existing bubble', () => {
    // Simuliere eine Bubble, die eine existierende Bubble trifft
    const existingBubblePos = grid.gridToPixel(0, 2);
    const shootingBubble = new Bubble(mockScene, existingBubblePos.x + 10, existingBubblePos.y + 30, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    
    expect(nearestCell).not.toBeNull();
    console.log('Found cell:', nearestCell);
    console.log('Shooting bubble pos:', shootingBubble.x, shootingBubble.y);
    console.log('Grid position would be:', grid.gridToPixel(nearestCell.row, nearestCell.col));
  });

  test('should handle bubble attachment at top boundary', () => {
    // Simuliere eine Bubble, die die obere Grenze erreicht
    const shootingBubble = new Bubble(mockScene, 200, 30, BUBBLE_RADIUS, TEST_COLOR_MAP.YELLOW);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(nearestCell.row).toBe(0); // Sollte in die erste Reihe platziert werden
  });

  test('should position bubble correctly in grid after attachment', () => {
    const shootingBubble = new Bubble(mockScene, 200, 80, BUBBLE_RADIUS, TEST_COLOR_MAP.PURPLE);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    expect(nearestCell).not.toBeNull();
    
    // Teste die Positionierung
    const targetPos = grid.gridToPixel(nearestCell.row, nearestCell.col);
    shootingBubble.setPosition(targetPos.x, targetPos.y);
    
    // Füge zum Grid hinzu
    grid.grid[nearestCell.row][nearestCell.col] = shootingBubble;
    
    // Verifiziere, dass die Bubble im Grid ist
    const bubbleInGrid = grid.getBubble(nearestCell.row, nearestCell.col);
    expect(bubbleInGrid).toBe(shootingBubble);
    expect(bubbleInGrid.x).toBe(targetPos.x);
    expect(bubbleInGrid.y).toBe(targetPos.y);
  });

  test('should handle edge cases with no available positions', () => {
    // Fülle das Grid vollständig
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        if (!grid.getBubble(row, col)) {
          const gridPos = grid.gridToPixel(row, col);
          const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
          grid.addBubble(row, col, bubble);
        }
      }
    }
    
    const shootingBubble = new Bubble(mockScene, 200, 80, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    
    // Wenn das Grid voll ist, sollte keine Position gefunden werden
    expect(nearestCell).toBeNull();
  });
});
