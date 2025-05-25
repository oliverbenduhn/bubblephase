// filepath: /home/oliverbenduhn/Dokumente/projekte/bubblephase/src/Grid.test.js
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS } from './Bubble';
import { BUBBLE_RADIUS, BUBBLE_COLOR_IDS } from './config';
import { TEST_COLOR_MAP } from './test-utils';

// Mock für die Phaser-Szene
const mockScene = {
  // Mocke Methoden, die von Grid oder Bubble direkt auf der Szene aufgerufen werden könnten
};

// Mock für die Bubble-Klasse
jest.mock('./Bubble', () => ({
  ...jest.requireActual('./Bubble'), // Behalte die echten Konstanten wie BUBBLE_COLORS
  Bubble: jest.fn().mockImplementation((scene, x, y, radius, colorId) => ({
    scene,
    x,
    y,
    radius,
    colorId,
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
      // Test mit explizit bekannten Grid-Koordinaten
      const testRow = 3;
      const testCol = 3;
      
      // Erst Grid zu Pixel umwandeln
      const pixelPos = grid.gridToPixel(testRow, testCol);
      
      // Dann zurück zu Grid umwandeln
      const result = grid.pixelToGrid(pixelPos.x, pixelPos.y);
      expect(result).toBeDefined();
      expect(result.row).toBe(testRow);
      expect(result.col).toBe(testCol);
      
      // Test mit weiteren positiven Koordinaten
      const pixelX = 40; // Noch kleinere, sicher Grid-konforme Werte verwenden
      const pixelY = 40;
      
      const result2 = grid.pixelToGrid(pixelX, pixelY);
      expect(result2).toBeDefined();
      expect(result2.row).toBeGreaterThanOrEqual(0);
      expect(result2.col).toBeGreaterThanOrEqual(0);
      expect(result2.row).toBeLessThan(rows);
      expect(result2.col).toBeLessThan(cols);
      
      const backToPixel = grid.gridToPixel(result2.row, result2.col);
      expect(backToPixel).toBeDefined();
      expect(backToPixel).not.toBeNull();
      expect(backToPixel.x).toBeDefined();
      expect(backToPixel.y).toBeDefined();

      const horizontalTolerance = BUBBLE_RADIUS + 1; // Etwas mehr Toleranz
      const verticalTolerance = BUBBLE_RADIUS * 2;
      expect(Math.abs(backToPixel.x - pixelX)).toBeLessThan(horizontalTolerance);
      expect(Math.abs(backToPixel.y - pixelY)).toBeLessThan(verticalTolerance);
    });
  });

  describe('Bubble Management', () => {
    test('addBubble sollte eine Bubble hinzufügen und ihre Position setzen', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
      const row = 2;
      const col = 3;
      const success = grid.addBubble(row, col, mockBubbleInstance);

      expect(success).toBe(true);
      expect(grid.getBubble(row, col)).toBe(mockBubbleInstance);
      const expectedPixelPos = grid.gridToPixel(row, col);
      expect(mockBubbleInstance.setPosition).toHaveBeenCalledWith(expectedPixelPos.x, expectedPixelPos.y);
    });

    test('addBubble sollte false zurückgeben für ungültige Positionen', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      expect(grid.addBubble(rows, cols, mockBubbleInstance)).toBe(false);
      expect(grid.addBubble(-1, 0, mockBubbleInstance)).toBe(false);
    });

    test('getBubble sollte eine Bubble von einer Position abrufen oder null', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
      grid.addBubble(1, 1, mockBubbleInstance);
      expect(grid.getBubble(1, 1)).toBe(mockBubbleInstance);
      expect(grid.getBubble(0, 0)).toBeNull();
      expect(grid.getBubble(rows, cols)).toBeNull();
    });

    test('removeBubble sollte eine Bubble entfernen und zurückgeben', () => {
      const mockBubbleInstance = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.YELLOW);
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

  describe('Floating Bubbles', () => {
    beforeEach(() => {
      grid = new Grid(mockScene, 5, 5);
    });

    test('findConnectedToTop erkennt Bubbles, die mit der obersten Reihe verbunden sind', () => {
      // Erstelle eine verbundene Kette von Bubbles
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
      
      // Füge eine isolierte Bubble hinzu
      grid.addBubble(3, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));

      const connected = grid.findConnectedToTop();
      
      // Die drei verbundenen Bubbles sollten erkannt werden
      expect(connected.has('0-0')).toBe(true);
      expect(connected.has('1-0')).toBe(true);
      expect(connected.has('2-0')).toBe(true);
      // Die isolierte Bubble sollte nicht als verbunden erkannt werden
      expect(connected.has('3-3')).toBe(false);
    });

    test('removeFloatingBubbles entfernt nicht verbundene Bubbles', () => {
      // Erstelle eine verbundene Kette
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      
      // Erstelle zwei freischwebende Bubbles
      grid.addBubble(3, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(3, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));

      const removedBubbles = grid.removeFloatingBubbles();

      // Überprüfe, ob die richtigen Bubbles entfernt wurden
      expect(removedBubbles).toHaveLength(2);
      expect(removedBubbles).toContainEqual({ row: 3, col: 3 });
      expect(removedBubbles).toContainEqual({ row: 3, col: 4 });

      // Überprüfe, ob die verbundenen Bubbles noch da sind
      expect(grid.getBubble(0, 0)).not.toBeNull();
      expect(grid.getBubble(1, 0)).not.toBeNull();
      // Überprüfe, ob die freischwebenden Bubbles entfernt wurden
      expect(grid.getBubble(3, 3)).toBeNull();
      expect(grid.getBubble(3, 4)).toBeNull();
    });

    test('removeFloatingBubbles behandelt ein leeres Gitter korrekt', () => {
      const removedBubbles = grid.removeFloatingBubbles();
      expect(removedBubbles).toHaveLength(0);
    });

    test('findConnectedToTop erkennt komplexe Verbindungen im Hexagonalgitter', () => {
      // Erstelle eine komplexere verbundene Struktur
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));  // Startpunkt
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE)); // Direkt darunter
      grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN)); // Diagonal
      
      const connected = grid.findConnectedToTop();
      
      expect(connected.has('0-0')).toBe(true);
      expect(connected.has('1-0')).toBe(true);
      expect(connected.has('1-1')).toBe(true);
    });
  });

  describe('Empty Grid Edge Cases', () => {
    test('behandelt leeres Spielfeld korrekt', () => {
      // Verifiziere, dass das Grid leer ist
      let bubbleCount = 0;
      grid.forEachBubble((bubble) => {
        if (bubble) bubbleCount++;
      });
      expect(bubbleCount).toBe(0);
      
      // Teste Operationen auf leerem Grid
      expect(grid.getBubble(0, 0)).toBeNull();
      expect(grid.getBubble(5, 5)).toBeNull();
      
      // isEmpty sollte true zurückgeben
      expect(grid.isEmpty()).toBe(true);
    });
    
    test('countBubbles gibt 0 für leeres Grid zurück', () => {
      expect(grid.countBubbles()).toBe(0);
    });
    
    test('findCellByBubble gibt null für nicht-existierende Bubble zurück', () => {
      const mockBubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
      expect(grid.findCellByBubble(mockBubble)).toBeNull();
    });
    
    test('removeFloatingBubbles gibt leeres Array für leeres Grid zurück', () => {
      const removed = grid.removeFloatingBubbles();
      expect(removed).toHaveLength(0);
    });
    
    test('getAllBubbleObjects gibt leeres Array für leeres Grid zurück', () => {
      const bubbleObjects = grid.getAllBubbleObjects();
      expect(bubbleObjects).toHaveLength(0);
    });
  });
});
