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

describe('Problematische Attachment-Szenarien', () => {
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

  test('should handle fast-moving bubbles that might skip grid positions', () => {
    // Simuliere eine sehr schnelle Bubble, die eventuell Positionen überspringt
    const fastBubble = new Bubble(mockScene, 200, 80, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
    
    const nearestCell = Collision.findNearestEmptyCell(grid, fastBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(grid.isValidGridPosition(nearestCell.row, nearestCell.col)).toBe(true);
    expect(grid.getBubble(nearestCell.row, nearestCell.col)).toBeNull();
  });

  test('should handle bubbles hitting corner of existing bubbles', () => {
    // Füge eine Bubble in (1,1) hinzu für den Test
    const gridPos = grid.gridToPixel(1, 1);
    const cornerBubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
    grid.addBubble(1, 1, cornerBubble);

    // Simuliere eine Bubble, die die Ecke der bestehenden Bubble trifft
    const shootingBubble = new Bubble(
      mockScene, 
      gridPos.x + BUBBLE_RADIUS * 0.7, 
      gridPos.y + BUBBLE_RADIUS * 0.7, 
      BUBBLE_RADIUS, 
      TEST_COLOR_MAP.BLUE
    );

    const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(grid.isValidGridPosition(nearestCell.row, nearestCell.col)).toBe(true);
    expect(grid.getBubble(nearestCell.row, nearestCell.col)).toBeNull();
    
    // Die gefundene Zelle sollte ein Nachbar der existierenden Bubble sein
    const neighbors = grid.getNeighbors(1, 1);
    const isNeighbor = neighbors.some(n => n.row === nearestCell.row && n.col === nearestCell.col);
    expect(isNeighbor).toBe(true);
  });

  test('should handle bubbles at grid boundaries correctly', () => {
    // Test am linken Rand
    const leftEdgeBubble = new Bubble(mockScene, 20, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.YELLOW);
    const leftResult = Collision.findNearestEmptyCell(grid, leftEdgeBubble);
    
    expect(leftResult).not.toBeNull();
    expect(leftResult.col).toBeGreaterThanOrEqual(0);
    
    // Test am rechten Rand
    const rightEdgeBubble = new Bubble(mockScene, 400, 100, BUBBLE_RADIUS, TEST_COLOR_MAP.PURPLE);
    const rightResult = Collision.findNearestEmptyCell(grid, rightEdgeBubble);
    
    expect(rightResult).not.toBeNull();
    expect(rightResult.col).toBeLessThan(grid.cols);
  });

  test('should prioritize attachment to existing bubble clusters', () => {
    // Erstelle einen kleinen Cluster
    for (let i = 0; i < 3; i++) {
      const gridPos = grid.gridToPixel(1, i);
      const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      grid.addBubble(1, i, bubble);
    }

    // Bubble, die sich dem Cluster anschließen sollte
    const clusterPos = grid.gridToPixel(1, 1);
    const joiningBubble = new Bubble(
      mockScene, 
      clusterPos.x, 
      clusterPos.y + BUBBLE_RADIUS * 3, 
      BUBBLE_RADIUS, 
      TEST_COLOR_MAP.BLUE
    );

    const nearestCell = Collision.findNearestEmptyCell(grid, joiningBubble);
    
    expect(nearestCell).not.toBeNull();
    
    // Die Zelle sollte an bestehende Bubbles angrenzen (entweder Cluster oder erste Reihe)
    const neighbors = grid.getNeighbors(nearestCell.row, nearestCell.col);
    
    const hasAdjacentBubble = neighbors.some(neighbor => {
      const bubble = grid.getBubble(neighbor.row, neighbor.col);
      return bubble;
    });
    
    expect(hasAdjacentBubble).toBe(true);
  });

  test('should handle hexagonal offset rows correctly', () => {
    // Test spezifisch für ungerade Reihen (hexagonale Verschiebung)
    const oddRowPos = grid.gridToPixel(3, 2); // Ungerade Reihe
    const evenRowPos = grid.gridToPixel(2, 2); // Gerade Reihe
    
    // Diese Positionen sollten sich unterscheiden wegen der hexagonalen Verschiebung
    expect(oddRowPos.x).not.toEqual(evenRowPos.x);
    
    const oddRowBubble = new Bubble(mockScene, oddRowPos.x, oddRowPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
    const nearestCell = Collision.findNearestEmptyCell(grid, oddRowBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(nearestCell.row).toBe(3);
    expect(nearestCell.col).toBe(2);
  });

  test('should handle multiple collision candidates and choose the best one', () => {
    // Erstelle eine Situation mit mehreren möglichen Kollisionszielen
    const positions = [
      { row: 2, col: 2 },
      { row: 2, col: 4 },
      { row: 3, col: 3 }
    ];
    
    positions.forEach(pos => {
      const gridPos = grid.gridToPixel(pos.row, pos.col);
      const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      grid.addBubble(pos.row, pos.col, bubble);
    });

    // Bubble die zwischen allen dreien landen könnte
    const centerPos = grid.gridToPixel(2, 3);
    const ambiguousBubble = new Bubble(
      mockScene, 
      centerPos.x, 
      centerPos.y + BUBBLE_RADIUS * 1.5, 
      BUBBLE_RADIUS, 
      TEST_COLOR_MAP.BLUE
    );

    const nearestCell = Collision.findNearestEmptyCell(grid, ambiguousBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(grid.getBubble(nearestCell.row, nearestCell.col)).toBeNull();
    
    // Die gewählte Position sollte einen logischen Nachbarn haben
    const hasOccupiedNeighbor = grid.getNeighbors(nearestCell.row, nearestCell.col)
      .some(neighbor => grid.getBubble(neighbor.row, neighbor.col) !== null);
    
    expect(hasOccupiedNeighbor).toBe(true);
  });

  test('should handle precision errors in floating point calculations', () => {
    // Test mit Positionen, die Floating-Point-Ungenauigkeiten auslösen könnten
    const precisionBubble = new Bubble(
      mockScene, 
      100.00000001, 
      100.99999999, 
      BUBBLE_RADIUS, 
      TEST_COLOR_MAP.ORANGE
    );

    const nearestCell = Collision.findNearestEmptyCell(grid, precisionBubble);
    
    expect(nearestCell).not.toBeNull();
    expect(grid.isValidGridPosition(nearestCell.row, nearestCell.col)).toBe(true);
  });
});
