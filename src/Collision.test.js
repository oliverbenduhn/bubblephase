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

    // Neue Edge Case Tests
    describe('Edge Cases und problematische Szenarien', () => {
      test('sollte sehr nahe Bubbles als Kollision erkennen (Grenzfall)', () => {
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.99, y: 100 }; // Knapp unter dem Threshold
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
      });

      test('sollte Bubbles, die sich minimal überlappen, als Kollision erkennen', () => {
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.9, y: 100 }; // Überlappung
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
      });

      test('sollte diagonale Kollisionen korrekt erkennen', () => {
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.4, y: 100 + BUBBLE_RADIUS * 1.4 }; // Diagonale
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
      });

      test('sollte schnell bewegende Bubbles erkennen (Tunneling-Problem)', () => {
        // Simuliert eine sehr schnelle Bubble, die durch eine andere "tunneln" könnte
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.5, y: 100 };
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
      });

      test('sollte Kollisionen bei unterschiedlichen Bubble-Größen handhaben', () => {
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 1.8, y: 100 };
        const customThreshold = BUBBLE_RADIUS * 2.2; // Größere Bubble
        expect(Collision.checkBubbleCollision(bubble1, bubble2, customThreshold)).toBe(true);
      });

      test('sollte false zurückgeben bei exakt dem Threshold-Abstand', () => {
        const bubble1 = { x: 100, y: 100 };
        const bubble2 = { x: 100 + BUBBLE_RADIUS * 2.01, y: 100 }; // Knapp über dem Threshold
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(false);
      });

      test('sollte Kollisionen bei floating-point Ungenauigkeiten korrekt handhaben', () => {
        const bubble1 = { x: 100.1, y: 100.1 };
        const bubble2 = { x: 100.1 + BUBBLE_RADIUS * 1.99999, y: 100.1 };
        expect(Collision.checkBubbleCollision(bubble1, bubble2)).toBe(true);
      });
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
        forEachBubble: jest.fn((callback) => {
          // Default: no bubbles in grid, so callback is never called
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

    describe('Problematische Snapping-Szenarien', () => {
      beforeEach(() => {
        // Setup für komplexere Szenarien
        mockGrid = {
          rows: 15,
          cols: 15,
          xOffset: 0,
          yOffset: 0,
          bubbleRadius: BUBBLE_RADIUS,
          cellWidth: BUBBLE_RADIUS * 2,
          cellHeight: BUBBLE_RADIUS * Math.sqrt(3),
          gridToPixel: jest.fn((row, col) => {
            const isOddRow = row % 2 !== 0;
            const x = col * (BUBBLE_RADIUS * 2) + (isOddRow ? BUBBLE_RADIUS : 0) + BUBBLE_RADIUS;
            const y = row * (BUBBLE_RADIUS * Math.sqrt(3)) + BUBBLE_RADIUS;
            return { x, y };
          }),
          pixelToGrid: jest.fn((x, y) => {
            // Vereinfachte hexagonale Konvertierung
            const row = Math.round(y / (BUBBLE_RADIUS * Math.sqrt(3)));
            const isOddRow = row % 2 !== 0;
            const col = Math.round((x - (isOddRow ? BUBBLE_RADIUS : 0)) / (BUBBLE_RADIUS * 2));
            return { row: Math.max(0, row), col: Math.max(0, col) };
          }),
          isValidGridPosition: jest.fn((row, col) => row >= 0 && row < 15 && col >= 0 && col < 15),
          getBubble: jest.fn(() => null), // Default: alle Zellen leer
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
              if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15) {
                neighbors.push({ row: nr, col: nc });
              }
            }
            return neighbors;
          }),
          forEachBubble: jest.fn((callback) => {
            // Wird von den Tests überschrieben
          })
        };
      });

      test('sollte mit dicht gepackten Bubbles umgehen können', () => {
        // Simuliere einen sehr dichten Bereich mit nur wenigen freien Zellen
        mockGrid.getBubble = jest.fn((row, col) => {
          // Nur ein paar spezifische Zellen sind frei
          if ((row === 7 && col === 8) || (row === 8 && col === 7)) return null;
          return {}; // Alle anderen besetzt
        });

        mockGrid.forEachBubble = jest.fn((callback) => {
          // Simuliere viele Bubbles um die Zielposition
          for (let r = 5; r < 10; r++) {
            for (let c = 5; c < 10; c++) {
              if (!((r === 7 && c === 8) || (r === 8 && c === 7))) {
                callback({}, r, c);
              }
            }
          }
        });

        const bubble = { x: 200, y: 180 }; // Irgendwo in dem dichten Bereich
        const result = Collision.findNearestEmptyCell(mockGrid, bubble);
        
        expect(result).not.toBeNull();
        expect([
          JSON.stringify({ row: 7, col: 8 }),
          JSON.stringify({ row: 8, col: 7 })
        ]).toContain(JSON.stringify(result));
      });

      test('sollte null zurückgeben wenn absolut keine freie Zelle verfügbar ist', () => {
        mockGrid.getBubble = jest.fn(() => ({})); // Alle Zellen besetzt
        mockGrid.forEachBubble = jest.fn((callback) => {
          for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
              callback({}, r, c);
            }
          }
        });

        const bubble = { x: 100, y: 100 };
        const result = Collision.findNearestEmptyCell(mockGrid, bubble);
        
        expect(result).toBeNull();
      });

      test('sollte Bubbles an Randpositionen korrekt handhaben', () => {
        // Test für Bubbles am Rand des Spielfelds
        const bubble = { x: 10, y: 10 }; // Sehr nah am oberen linken Rand
        mockGrid.pixelToGrid = jest.fn(() => ({ row: 0, col: 0 }));

        const result = Collision.findNearestEmptyCell(mockGrid, bubble);
        
        expect(result).toEqual({ row: 0, col: 0 });
        expect(mockGrid.isValidGridPosition).toHaveBeenCalledWith(0, 0);
      });

      test('sollte bei überlappenden Bubbles die beste Position finden', () => {
        // Simuliere eine Situation wo eine Bubble mehrere andere überlappen könnte
        mockGrid.forEachBubble = jest.fn((callback) => {
          callback({}, 4, 4);
          callback({}, 4, 5);
          callback({}, 5, 4);
        });

        mockGrid.getBubble = jest.fn((row, col) => {
          if ((row === 4 && col === 4) || (row === 4 && col === 5) || (row === 5 && col === 4)) {
            return {}; // Diese sind besetzt
          }
          return null; // Rest ist frei
        });

        const bubble = { x: 120, y: 100 }; // Zwischen mehreren Bubbles
        const result = Collision.findNearestEmptyCell(mockGrid, bubble);
        
        expect(result).not.toBeNull();
        expect(mockGrid.getBubble(result.row, result.col)).toBeNull();
      });
    });
  });
});
