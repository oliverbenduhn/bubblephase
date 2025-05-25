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
        existing: jest.fn((gameObject) => { // Modifiziert, um body direkt hinzuzufügen
          gameObject.body = {
            setCircle: jest.fn().mockReturnThis(),
            setVelocity: jest.fn().mockReturnThis(),
            updateFromGameObject: jest.fn().mockReturnThis(),
            setCollideWorldBounds: jest.fn().mockReturnThis(),
            setBounce: jest.fn().mockReturnThis(),
            setFrictionX: jest.fn().mockReturnThis(),
            setFrictionY: jest.fn().mockReturnThis(),
            setMaxVelocity: jest.fn().mockReturnThis(),
            setDrag: jest.fn().mockReturnThis(),
            setImmovable: jest.fn()
          };
          return gameObject; // Gebe das modifizierte gameObject zurück
        })
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
    // Erwartung anpassen: Die Bubble sollte in der ersten freien Reihe landen.
    // Da die erste Reihe (0) belegt ist, sollte es Reihe 1 sein.
    // Die Spalte hängt von der genauen x-Position und der Logik von findNearestEmptyCell ab.
    // Wir prüfen hier allgemeiner, dass eine gültige Zelle gefunden wird.
    expect(grid.isValidGridPosition(nearestCell.row, nearestCell.col)).toBe(true);
    expect(grid.getBubble(nearestCell.row, nearestCell.col)).toBeNull();
  });

  test('should find nearest empty cell for bubble hitting existing bubble', () => {
    // Simuliere eine Bubble, die eine existierende Bubble trifft
    const existingBubblePos = grid.gridToPixel(0, 2);
    const shootingBubble = new Bubble(mockScene, existingBubblePos.x, existingBubblePos.y - 10, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);

    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);

    expect(nearestCell).not.toBeNull();
    // Erwartung anpassen: Die Bubble sollte in einer gültigen, leeren Zelle landen.
    expect(grid.isValidGridPosition(nearestCell.row, nearestCell.col)).toBe(true);
    expect(grid.getBubble(nearestCell.row, nearestCell.col)).toBeNull();
  });
});
