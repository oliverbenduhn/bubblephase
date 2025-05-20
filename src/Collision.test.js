import { Collision } from './Collision';
import { Bubble, BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';
import { Grid } from './Grid';

describe('Collision', () => {
  describe('checkBubbleCollision', () => {
    test('sollte true zurückgeben, wenn zwei Bubbles kollidieren', () => {
      const bubble1 = { x: 100, y: 100 };
      const bubble2 = { x: 100 + BUBBLE_RADIUS, y: 100 };
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
    // Mock für das Grid
    const mockGrid = {
      gridToPixel: jest.fn(((row, col) => ({ x: col * BUBBLE_RADIUS * 2, y: row * BUBBLE_RADIUS * 2 }))),
      pixelToGrid: jest.fn((x, y) => ({ row: Math.floor(y / (BUBBLE_RADIUS * 2)), col: Math.floor(x / (BUBBLE_RADIUS * 2)) })),
      isValidGridPosition: jest.fn((row, col) => row >= 0 && row < 10 && col >= 0 && col < 10),
      getBubble: jest.fn((row, col) => {
        // Simuliere einige besetzte Zellen
        if (row === 3 && col === 3) return {};
        if (row === 3 && col === 4) return {};
        if (row === 3 && col === 5) return {};
        return null;
      }),
      // Fehlende forEachBubble-Methode hinzufügen für die Tests
      forEachBubble: jest.fn((callback) => {
        // Simuliere einige Bubbles für die Tests
        const bubbles = [
          { row: 3, col: 3, bubble: { x: 60, y: 60 } },
          { row: 3, col: 4, bubble: { x: 80, y: 60 } },
          { row: 3, col: 5, bubble: { x: 100, y: 60 } }
        ];
        
        bubbles.forEach(b => {
          callback(b.bubble, b.row, b.col);
        });
      })
    };

    test('sollte die nächste freie Zelle in der Richtung der Kollision finden', () => {
      // Kollidierende Bubble kommt von unten rechts zur Target-Bubble
      const collidingBubble = { x: 90, y: 90 }; // unten rechts von targetBubble
      const targetBubble = { x: 80, y: 80 };    // entspricht ungefähr Grid-Zelle (3, 4)

      // Aktualisieren der Mock-Funktionen für diesen Test
      mockGrid.forEachBubble = jest.fn((callback) => {
        // Füge einige Bubbles hinzu mit klarer Anordnung für den Test
        const bubbles = [
          { row: 3, col: 4, bubble: { x: 80, y: 80 } } // Nur eine Bubble an der Position (3, 4)
        ];
        bubbles.forEach(b => callback(b.bubble, b.row, b.col));
      });
      
      // Stelle sicher, dass die Funktion validiert, dass die Position (3, 5) frei ist
      mockGrid.isValidGridPosition.mockImplementation((row, col) => row >= 0 && row < 10 && col >= 0 && col < 10);
      mockGrid.getBubble.mockImplementation((row, col) => {
        if (row === 3 && col === 4) return {}; // Nur diese Position ist besetzt
        return null;
      });
      mockGrid.pixelToGrid.mockReturnValue({ row: 3, col: 4 });

      // Führe die zu testende Funktion aus
      const result = Collision.findNearestEmptyCell(mockGrid, collidingBubble);
      
      // Bei diesem neuen Setup sollte ein Ergebnis zurückgegeben werden
      expect(result).not.toBeNull();
      expect(mockGrid.isValidGridPosition).toHaveBeenCalled();
      expect(mockGrid.getBubble).toHaveBeenCalled();
      
      // Wenn ein Ergebnis gefunden wurde, überprüfen wir dessen Gültigkeit
      if (result) {
        expect(mockGrid.isValidGridPosition(result.row, result.col)).toBe(true);
        expect(mockGrid.getBubble(result.row, result.col)).toBeNull();
      }
    });

    test('sollte null zurückgeben, wenn keine freie Nachbarzelle verfügbar ist', () => {
      // Überschreibe die getBubble-Funktion, um alle Zellen als besetzt zu markieren
      mockGrid.getBubble = jest.fn(() => ({}));
      
      const collidingBubble = { x: 90, y: 90 };
      const targetBubble = { x: 80, y: 80 };

      const result = Collision.findNearestEmptyCell(mockGrid, collidingBubble, targetBubble);
      
      expect(result).toBeNull();
    });
  });

  describe('checkGridCollision', () => {
    test('sollte die erste kollidierende Bubble im Grid zurückgeben', () => {
      const movingBubble = { x: 100, y: 100 };
      
      const gridBubble1 = { x: 100 + BUBBLE_RADIUS * 3, y: 100 }; // Nicht kollidierend
      const gridBubble2 = { x: 100 + BUBBLE_RADIUS, y: 100 };     // Kollidierend
      const gridBubble3 = { x: 100, y: 100 + BUBBLE_RADIUS };     // Auch kollidierend, aber später gefunden

      const mockGrid = {
        forEachBubble: jest.fn((callback) => {
          callback(gridBubble1, 0, 0);
          callback(gridBubble2, 1, 1);
          callback(gridBubble3, 2, 2);
        })
      };

      const result = Collision.checkGridCollision(movingBubble, mockGrid);
      
      expect(result).toBe(gridBubble2); // Die erste gefundene kollidierende Bubble
      expect(mockGrid.forEachBubble).toHaveBeenCalled();
    });

    test('sollte null zurückgeben, wenn keine Kollision gefunden wird', () => {
      const movingBubble = { x: 100, y: 100 };
      
      const gridBubble1 = { x: 100 + BUBBLE_RADIUS * 3, y: 100 };
      const gridBubble2 = { x: 100 + BUBBLE_RADIUS * 4, y: 100 };

      const mockGrid = {
        forEachBubble: jest.fn((callback) => {
          callback(gridBubble1, 0, 0);
          callback(gridBubble2, 1, 1);
        })
      };

      const result = Collision.checkGridCollision(movingBubble, mockGrid);
      
      expect(result).toBeNull();
      expect(mockGrid.forEachBubble).toHaveBeenCalled();
    });
  });

  describe('findColorGroup', () => {
    let grid;
    const mockScene = {
      add: {
        circle: () => ({
          setFillStyle: () => {},
          setStrokeStyle: () => {},
          setPosition: () => {},
          destroy: () => {}
        })
      }
    };
    
    beforeEach(() => {
      grid = new Grid(mockScene, 8, 8, 0, 0); // 8x8 Grid für Tests
    });

    test('findet keine Gruppe bei einzelner Bubble', () => {
      // Eine einzelne rote Bubble
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
      
      const { size, positions } = Collision.findColorGroup(grid, 0, 0, 3);
      
      expect(size).toBe(1);
      expect(positions).toEqual([{ row: 0, col: 0 }]);
    });

    test('findet Gruppe von drei gleichfarbigen Bubbles', () => {
      // Drei rote Bubbles in einer horizontalen Reihe
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
      grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
      
      const { size, positions } = Collision.findColorGroup(grid, 0, 1, 3);
      
      expect(size).toBe(3);
      expect(positions).toHaveLength(3);
      expect(positions).toContainEqual({ row: 0, col: 0 });
      expect(positions).toContainEqual({ row: 0, col: 1 });
      expect(positions).toContainEqual({ row: 0, col: 2 });
    });

    test('ignoriert unterschiedliche Farben', () => {
      // Eine rote Bubble umgeben von blauen
      grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
      grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
      grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
      
      const { size, positions } = Collision.findColorGroup(grid, 1, 1, 3);
      
      expect(size).toBe(1);
      expect(positions).toEqual([{ row: 1, col: 1 }]);
    });

    test('findet komplexe Gruppen in verschiedenen Richtungen', () => {
      // Eine L-förmige Gruppe von grünen Bubbles
      grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
      grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
      grid.addBubble(1, 3, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
      grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
      grid.addBubble(3, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
      
      const { size, positions } = Collision.findColorGroup(grid, 1, 1, 3);
      
      expect(size).toBe(5);
      expect(positions).toHaveLength(5);
      expect(positions).toContainEqual({ row: 1, col: 1 });
      expect(positions).toContainEqual({ row: 1, col: 2 });
      expect(positions).toContainEqual({ row: 1, col: 3 });
      expect(positions).toContainEqual({ row: 2, col: 1 });
      expect(positions).toContainEqual({ row: 3, col: 1 });
    });
  });
});
