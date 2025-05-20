// filepath: /home/oliverbenduhn/Dokumente/projekte/bubblephase/src/Grid.test.js
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';

// Mock für die Phaser-Szene
const mockScene = {
  // Mocke Methoden, die von Grid oder Bubble direkt auf der Szene aufgerufen werden könnten
};

// Mock für die Bubble-Klasse
jest.mock('./Bubble', () => ({
  ...jest.requireActual('./Bubble'), // Behalte die echten Konstanten wie BUBBLE_COLORS
  Bubble: jest.fn().mockImplementation((scene, x, y, radius, color) => ({
    scene,
    x,
    y,
    radius,
    color,
    gameObject: null,
    draw: jest.fn(),
    setPosition: jest.fn(function(newX, newY) {
      this.x = newX;
      this.y = newY;
    }),
    destroy: jest.fn(),
  })),
}));

describe('Grid', () => {
  let grid;
  const rows = 5;
  const cols = 6;
  const xOffset = 10;
  const yOffset = 20;

  beforeEach(() => {
    Bubble.mockClear();
    grid = new Grid(mockScene, rows, cols, xOffset, yOffset);
  });

  test('sollte korrekt initialisiert werden', () => {
    expect(grid.rows).toBe(rows);
    expect(grid.cols).toBe(cols);
    expect(grid.xOffset).toBe(xOffset);
    expect(grid.yOffset).toBe(yOffset);
    expect(grid.grid.length).toBe(rows);
    grid.grid.forEach(rowArray => {
      expect(rowArray.length).toBe(cols);
      expect(rowArray.every(cell => cell === null)).toBe(true);
    });
  });

  describe('Koordinatenumrechnung', () => {
    test('gridToPixel sollte Gitterkoordinaten korrekt in Pixelkoordinaten umwandeln', () => {
      const xOffset = 20;
      const yOffset = 20;
      const grid = new Grid(mockScene, 10, 10, xOffset, yOffset);

      // Dynamische Erwartungswerte basierend auf den Grid-Eigenschaften
      const expectedX =
        xOffset +
        2 * grid.cellWidth +
        (1 % 2 !== 0 ? grid.cellWidth / 2 : 0) +
        grid.bubbleRadius;
      const expectedY =
        yOffset +
        1 * grid.cellHeight +
        grid.bubbleRadius;

      const result = grid.gridToPixel(1, 2);
      expect(result.x).toBe(expectedX);
      expect(result.y).toBeCloseTo(expectedY, 5);
    });

    test('pixelToGrid sollte Pixelkoordinaten korrekt in Gitterkoordinaten umwandeln', () => {
      const isOddRow = 1 % 2 !== 0;
      const horizontalOffset = isOddRow ? BUBBLE_RADIUS : 0;
      const verticalSpacing = BUBBLE_RADIUS * 1.75;

      const pixelX = xOffset + 2 * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + horizontalOffset + 5;
      const pixelY = yOffset + 1 * verticalSpacing + BUBBLE_RADIUS + 5;

      const result = grid.pixelToGrid(pixelX, pixelY);
      const backToPixel = grid.gridToPixel(result.row, result.col);

      const horizontalTolerance = BUBBLE_RADIUS;
      const verticalTolerance = BUBBLE_RADIUS * 2;
      expect(Math.abs(backToPixel.x - pixelX)).toBeLessThan(horizontalTolerance);
      expect(Math.abs(backToPixel.y - pixelY)).toBeLessThan(verticalTolerance);
    });
  });

  describe('Bubble Management', () => {
    test('addBubble sollte eine Bubble hinzufügen und ihre Position setzen', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.BLUE);
      const row = 2;
      const col = 3;
      const success = grid.addBubble(row, col, mockBubbleInstance);

      expect(success).toBe(true);
      expect(grid.getBubble(row, col)).toBe(mockBubbleInstance);
      const expectedPixelPos = grid.gridToPixel(row, col);
      expect(mockBubbleInstance.setPosition).toHaveBeenCalledWith(expectedPixelPos.x, expectedPixelPos.y);
    });

    test('addBubble sollte false zurückgeben für ungültige Positionen', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED);
      expect(grid.addBubble(rows, cols, mockBubbleInstance)).toBe(false);
      expect(grid.addBubble(-1, 0, mockBubbleInstance)).toBe(false);
    });

    test('getBubble sollte eine Bubble von einer Position abrufen oder null', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.GREEN);
      grid.addBubble(1, 1, mockBubbleInstance);
      expect(grid.getBubble(1, 1)).toBe(mockBubbleInstance);
      expect(grid.getBubble(0, 0)).toBeNull();
      expect(grid.getBubble(rows, cols)).toBeNull();
    });

    test('removeBubble sollte eine Bubble entfernen und zurückgeben', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.YELLOW);
      grid.addBubble(3, 3, mockBubbleInstance);
      const removedBubble = grid.removeBubble(3, 3);

      expect(removedBubble).toBe(mockBubbleInstance);
      expect(grid.getBubble(3, 3)).toBeNull();
    });

    test('removeBubble sollte null zurückgeben, wenn keine Bubble vorhanden oder Position ungültig ist', () => {
      expect(grid.removeBubble(0, 0)).toBeNull();
      expect(grid.removeBubble(rows, cols)).toBeNull();
    });
  });

  test('isValidGridPosition sollte die Gültigkeit von Gitterpositionen prüfen', () => {
    expect(grid.isValidGridPosition(0, 0)).toBe(true);
    expect(grid.isValidGridPosition(rows - 1, cols - 1)).toBe(true);
    expect(grid.isValidGridPosition(-1, 0)).toBe(false);
    expect(grid.isValidGridPosition(0, -1)).toBe(false);
    expect(grid.isValidGridPosition(rows, 0)).toBe(false);
    expect(grid.isValidGridPosition(0, cols)).toBe(false);
  });

  test('initializeWithBubbles sollte das Gitter mit Bubbles füllen', () => {
    const numRowsToFill = 3;
    grid.initializeWithBubbles(numRowsToFill);
    let bubbleCount = 0;

    for (let r = 0; r < numRowsToFill; r++) {
      for (let c = 0; c < cols; c++) {
        if (r % 2 !== 0 && c === cols - 1) continue;
        const bubble = grid.getBubble(r, c);
        expect(bubble).not.toBeNull();
        expect(bubble.scene).toBe(mockScene);
        expect(bubble.radius).toBe(BUBBLE_RADIUS);
        expect(bubble.setPosition).toHaveBeenCalled();
        bubbleCount++;
      }
    }

    expect(Bubble).toHaveBeenCalledTimes(bubbleCount);
  });

  test('forEachBubble sollte die Callback-Funktion für jede Bubble im Gitter ausführen', () => {
    const mockBubble1 = new Bubble(mockScene, 0, 0, 0, 0);
    const mockBubble2 = new Bubble(mockScene, 0, 0, 0, 0);
    grid.addBubble(0, 1, mockBubble1);
    grid.addBubble(2, 3, mockBubble2);

    const callback = jest.fn();
    grid.forEachBubble(callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(mockBubble1, 0, 1);
    expect(callback).toHaveBeenCalledWith(mockBubble2, 2, 3);
  });
});
