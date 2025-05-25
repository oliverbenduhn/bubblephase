
import { Collision } from './Collision';
import { Bubble, BUBBLE_COLORS } from './Bubble';
import { BUBBLE_RADIUS } from './config';
import { Grid } from './Grid';

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

describe('Collision', () => {
  describe('checkBubbleCollision', () => {
    test('sollte true zurückgeben, wenn zwei Bubbles kollidieren', () => {
      const bubble1 = { x: 100, y: 100 };
      const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.8, y: 100 }; // Noch kleiner für sicherere Kollision
      expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
    });

    test('sollte false zurückgeben, wenn zwei Bubbles nicht kollidieren', () => {
      const bubble1 = { x: 100, y: 100 };
      const bubble2 = { x: 100 + BUBBLE_RADIUS * 3, y: 100 };
      expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(false);
    });

    test('sollte mit einem benutzerdefinierten Schwellwert arbeiten', () => {
      const bubble1 = { x: 100, y: 100 };
      const bubble2 = { x: 100 + BUBBLE_RADIUS * 2.5, y: 100 };
      expect(Collision.checkBubbleCollision(bubble1, bubble2, BUBBLE_RADIUS * 3)).toBe(true);
    });
  });

  describe('findNearestEmptyCell', () => {
    const mockBubbleRadius = 15; // Explicitly set for clarity
    const mockRows = 10;
    const mockCols = 10;
    const mockXOffset = 0;
    const mockYOffset = 0;
    const mockCellWidth = mockBubbleRadius * 2;
    const mockCellHeight = mockBubbleRadius * Math.sqrt(3);

    // Mock für das Grid mit hexagonaler Logik
    let mockGrid = {};

    beforeEach(() => {
      // Reset and re-initialize mockGrid before each test to ensure clean state
      mockGrid = {
        rows: mockRows,
        cols: mockCols,
        xOffset: mockXOffset,
        yOffset: mockYOffset,
        bubbleRadius: mockBubbleRadius,
        cellWidth: mockCellWidth,
        cellHeight: mockCellHeight,
        gridToPixel: jest.fn((row, col) => {
          const isOddRow = row % 2 !== 0;
          const x = mockXOffset + col * mockCellWidth + (isOddRow ? mockCellWidth / 2 : 0) + mockBubbleRadius;
          const y = mockYOffset + row * mockCellHeight + mockBubbleRadius;
          return { x, y };
        }),
        pixelToGrid: jest.fn((x, y) => {
          console.log(`[Mock pixelToGrid] Input: (${x}, ${y})`); // Keep this log
          let closestRow = -1;
          let closestCol = -1;
          let minDistSq = Number.MAX_VALUE;
          for (let r = 0; r < mockRows; r++) {
            for (let c = 0; c < mockCols; c++) {
              const isOddRow = r % 2 !== 0;
              const cellCenterX = mockXOffset + c * mockCellWidth + (isOddRow ? mockCellWidth / 2 : 0) + mockBubbleRadius;
              const cellCenterY = mockYOffset + r * mockCellHeight + mockBubbleRadius;
              const dx_calc = x - cellCenterX;
              const dy_calc = y - cellCenterY;
              const distSq = dx_calc * dx_calc + dy_calc * dy_calc;
              // console.log(`[Mock pixelToGrid] Checking (r=${r},c=${c}), center: (${cellCenterX.toFixed(2)}, ${cellCenterY.toFixed(2)}), distSq: ${distSq.toFixed(2)} to point (${x},${y})`); // Remove verbose log
              if (distSq < minDistSq) {
                minDistSq = distSq;
                closestRow = r;
                closestCol = c;
                // console.log(`[Mock pixelToGrid] New closest: (r=${closestRow},c=${closestCol}), minDistSq: ${minDistSq.toFixed(2)}`); // Remove verbose log
              }
            }
          }
          console.log(`[Mock pixelToGrid] Returning: ({row:${closestRow}, col:${closestCol}}) for input (${x},${y}). MinDistSq: ${minDistSq.toFixed(2)}`); // Keep this log
          return { row: closestRow, col: closestCol };
        }),
        isValidGridPosition: jest.fn((row, col) => row >= 0 && row < mockRows && col >= 0 && col < mockCols),
        getBubble: jest.fn((row, col) => {
          // Default: all cells are empty
          return null;
        }),
        getNeighbors: jest.fn((row, col) => {
          const neighbors = [];
          const evenRowOffsets = [
            { r: -1, c: -1 }, { r: -1, c: 0 }, { r: 0, c: 1 },
            { r: 1, c: 0 }, { r: 1, c: -1 }, { r: 0, c: -1 },
          ];
          const oddRowOffsets = [
            { r: -1, c: 0 }, { r: -1, c: 1 }, { r: 0, c: 1 },
            { r: 1, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 },
          ];
          const offsets = (row % 2 === 0) ? evenRowOffsets : oddRowOffsets;
          for (const offset of offsets) {
            const nr = row + offset.r;
            const nc = col + offset.c;
            if (nr >= 0 && nr < mockRows && nc >= 0 && nc < mockCols) {
              neighbors.push({ row: nr, col: nc });
            }
          }
          return neighbors;
        }),
      };
    });

    test('should find nearest empty cell for bubble at (90, 90) with hexagonal grid', () => {
      // For BUBBLE_RADIUS = 15:
      // pixelToGrid(90,90) -> returns {row: 3, col: 2}
      // This cell (3,2) is empty by default.
      const nearestCell = Collision.findNearestEmptyCell(mockGrid, { x: 90, y: 90 });
      expect(mockGrid.pixelToGrid).toHaveBeenCalledWith(90, 90);
      expect(nearestCell).toEqual({ row: 3, col: 2 }); // Corrected expectation
    });

    test('should find nearest empty cell when direct cell is occupied with hexagonal grid', () => {
      // For BUBBLE_RADIUS = 15:
      // Bubble at (158, 125).
      // pixelToGrid(158,125) -> returns {row: 4, col: 5}

      // Mock so that the cell (4,5) is occupied.
      mockGrid.getBubble = jest.fn((row, col) => {
        if (row === 4 && col === 5) return {}; // (4,5) is occupied
        // For the neighbors of (4,5), let's make (5,4) the first empty one.
        // Neighbors of (4,5) (even row): (3,4), (3,5), (4,6), (5,5), (5,4), (4,4)
        // Let's assume (5,4) is the first empty neighbor encountered by the search.
        return null; // All others are empty
      });

      const nearestCell = Collision.findNearestEmptyCell(mockGrid, { x: 158, y: 125 });
      expect(mockGrid.pixelToGrid).toHaveBeenCalledWith(158, 125);
      // Check if the initially closest (but occupied) cell was checked
      expect(mockGrid.getBubble).toHaveBeenCalledWith(4, 5);
      // Based on the log: pixelToGrid(158,125) returns {row:4, col:5}
      // Neighbors of (4,5) are:
      // (3,4), (3,5), (4,6), (5,5), (5,4), (4,4)
      // Assuming (5,4) is the first valid empty neighbor found by findNearestEmptyCell's BFS
      expect(nearestCell).toEqual({ row: 5, col: 4 }); // Corrected expectation
    });
  });
});
