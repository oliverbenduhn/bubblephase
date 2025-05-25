
import { TEST_COLOR_MAP } from './test-utils';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { Collision } from './Collision';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_RADIUS } from './config';

// Mock für Phaser.Scene
const mockScene = {
  add: {
    circle: jest.fn().mockImplementation(() => ({
      setStrokeStyle: jest.fn(),
      setPosition: jest.fn(),
      destroy: jest.fn(),
      body: {
        setCircle: jest.fn(),
        setVelocity: jest.fn(),
        reset: jest.fn(),
        setMaxVelocity: jest.fn().mockReturnThis(),
        setDrag: jest.fn().mockReturnThis(),
        setFrictionX: jest.fn(),
        setFrictionY: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setBounce: jest.fn(),
        setImmovable: jest.fn(),
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

/**
 * Diese Tests decken kritische Szenarien ab, die in der Praxis häufig zu Problemen führen:
 * - Kollisionserkennung bei sehr schnellen Bubbles
 * - Attachment-Probleme an Grid-Grenzen
 * - Fehlerhafte Gruppenerkennung bei komplexen Formen
 * - Performance-Probleme bei großen Operationen
 */
describe('Kritische Spielmechanik-Szenarien', () => {
  let grid;
  let colorGroup;

  beforeEach(() => {
    grid = new Grid(mockScene, 12, 10, 50, 50);
    colorGroup = new ColorGroup(grid);
  });

  describe('Kollisions- und Attachment-Probleme', () => {
    test('sollte mit sehr schnell bewegten Bubbles umgehen können', () => {
      // Simuliere eine Bubble, die sich so schnell bewegt, dass sie Grid-Positionen überspringen könnte
      const fastBubble = { x: 200, y: 50 };
      
      // Mock für sehr schnelle Bewegung - Bubble war vorher bei (50, 50)
      const previousPosition = { x: 50, y: 50 };
      
      // Testen verschiedener Zwischenpositionen entlang der Bewegungsbahn
      const trajectoryPoints = [
        { x: 75, y: 50 },
        { x: 100, y: 50 },
        { x: 125, y: 50 },
        { x: 150, y: 50 },
        { x: 175, y: 50 },
        { x: 200, y: 50 }
      ];
      
      trajectoryPoints.forEach(point => {
        const result = Collision.findNearestEmptyCell(grid, point);
        expect(result).not.toBeNull();
        expect(grid.isValidGridPosition(result.row, result.col)).toBe(true);
      });
    });

    test('sollte Bubbles korrekt an bereits dicht gepackte Bereiche anhängen', () => {
      // Erstelle einen sehr dichten Bereich
      const denseArea = [
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
        { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }
      ];
      
      denseArea.forEach(pos => {
        const gridPos = grid.gridToPixel(pos.row, pos.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      // Versuche eine neue Bubble in diesen Bereich zu platzieren
      const centerPos = grid.gridToPixel(3, 3);
      const newBubble = { x: centerPos.x + 5, y: centerPos.y + 5 };
      
      const result = Collision.findNearestEmptyCell(grid, newBubble);
      expect(result).not.toBeNull();
      expect(grid.getBubble(result.row, result.col)).toBeNull();
      
      // Die gefundene Position sollte an den dichten Bereich angrenzen
      const neighbors = grid.getNeighbors(result.row, result.col);
      const hasOccupiedNeighbor = neighbors.some(neighbor => 
        denseArea.some(pos => pos.row === neighbor.row && pos.col === neighbor.col)
      );
      expect(hasOccupiedNeighbor).toBe(true);
    });

    test('sollte Bubbles korrekt an Grid-Grenzen handhaben', () => {
      // Test linke Grenze
      const leftBoundaryBubble = { x: 10, y: 100 };
      const leftResult = Collision.findNearestEmptyCell(grid, leftBoundaryBubble);
      expect(leftResult).not.toBeNull();
      expect(leftResult.col).toBeGreaterThanOrEqual(0);
      
      // Test rechte Grenze
      const rightBoundaryBubble = { x: 500, y: 100 };
      const rightResult = Collision.findNearestEmptyCell(grid, rightBoundaryBubble);
      expect(rightResult).not.toBeNull();
      expect(rightResult.col).toBeLessThan(grid.cols);
      
      // Test obere Grenze
      const topBoundaryBubble = { x: 100, y: 10 };
      const topResult = Collision.findNearestEmptyCell(grid, topBoundaryBubble);
      expect(topResult).not.toBeNull();
      expect(topResult.row).toBeGreaterThanOrEqual(0);
    });

    test('sollte mit überlappenden Kollisionen umgehen können', () => {
      // Erstelle eine Situation, wo eine Bubble mit mehreren anderen kollidieren könnte
      const overlappingPositions = [
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 4, col: 3 }
      ];
      
      overlappingPositions.forEach(pos => {
        const gridPos = grid.gridToPixel(pos.row, pos.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      // Bubble, die zwischen allen dreien landen könnte
      const ambiguousPos = grid.gridToPixel(3, 3);
      const ambiguousBubble = { 
        x: ambiguousPos.x + BUBBLE_RADIUS * 0.8, 
        y: ambiguousPos.y + BUBBLE_RADIUS * 0.8 
      };
      
      const result = Collision.findNearestEmptyCell(grid, ambiguousBubble);
      expect(result).not.toBeNull();
      expect(grid.getBubble(result.row, result.col)).toBeNull();
    });
  });

  describe('Komplexe Gruppenerkennung-Probleme', () => {
    test('sollte verzweigte Gruppen korrekt erkennen', () => {
      // Erstelle eine komplexe T-förmige Gruppe
      const tShapePositions = [
        // Horizontaler Balken
        { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
        // Vertikaler Balken
        { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 }
      ];
      
      tShapePositions.forEach(pos => {
        const gridPos = grid.gridToPixel(pos.row, pos.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      const connected = colorGroup.findConnectedBubbles(2, 3); // Zentrum des T
      expect(connected).toHaveLength(9);
      
      tShapePositions.forEach(pos => {
        expect(connected).toContainEqual(pos);
      });
    });

    test('sollte spiralförmige Gruppen handhaben', () => {
      // Erstelle eine spiralförmige Gruppe
      const spiralPositions = [
        { row: 3, col: 3 }, // Zentrum
        { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 3, col: 4 }, // Erste Windung
        { row: 4, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 2 }, // Zweite Windung
        { row: 3, col: 2 }, { row: 2, col: 2 }, { row: 1, col: 2 }, // Dritte Windung
        { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 }  // Vierte Windung
      ];
      
      spiralPositions.forEach(pos => {
        const gridPos = grid.gridToPixel(pos.row, pos.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.PURPLE);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      const connected = colorGroup.findConnectedBubbles(3, 3);
      expect(connected).toHaveLength(spiralPositions.length);
    });

    test('sollte mehrfache Kettenreaktionen korrekt handhaben', () => {
      // Erstelle eine Situation mit mehreren aufeinanderfolgenden Kettenreaktionen
      // Ebene 1: Basis-Bubbles (bleiben)
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      
      // Ebene 2: Erste entfernbare Gruppe (Gelb)
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.YELLOW));
      grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.YELLOW));
      grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.YELLOW));
      
      // Ebene 3: Zweite entfernbare Gruppe (Blau, hängt von Gelb ab)
      grid.addBubble(2, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      
      // Ebene 4: Dritte entfernbare Gruppe (Grün, hängt von Blau ab)
      grid.addBubble(3, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
      grid.addBubble(3, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
      grid.addBubble(3, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
      
      // Teste erste Kettenreaktion: Entferne gelbe Gruppe
      const yellowGroup = colorGroup.findConnectedBubbles(1, 0);
      expect(yellowGroup).toHaveLength(3);
      
      yellowGroup.forEach(pos => {
        grid.removeBubble(pos.row, pos.col);
      });
      
      // Prüfe hängende Bubbles nach Entfernung
      const hangingAfterYellow = colorGroup.findHangingBubbles();
      expect(hangingAfterYellow.length).toBeGreaterThanOrEqual(6); // Blau + Grün sollten hängen
      
      // Entferne hängende Bubbles
      hangingAfterYellow.forEach(pos => {
        grid.removeBubble(pos.row, pos.col);
      });
      
      // Nur rote Basis-Bubbles sollten übrig bleiben
      let remainingBubbles = 0;
      grid.forEachBubble(() => remainingBubbles++);
      expect(remainingBubbles).toBe(3);
    });

    test('sollte isolierte Gruppen nach Entfernungen erkennen', () => {
      // Erstelle zwei durch eine Brücke verbundene Bereiche
      // Bereich 1 (links)
      for (let col = 0; col < 3; col++) {
        grid.addBubble(2, col, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
        grid.addBubble(3, col, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      }
      
      // Bereich 2 (rechts)
      for (let col = 5; col < 8; col++) {
        grid.addBubble(2, col, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
        grid.addBubble(3, col, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      }
      
      // Brücke
      grid.addBubble(2, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      
      // Verbindung zum Grid-Top
      grid.addBubble(0, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      grid.addBubble(1, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      
      // Entferne die Brücke
      grid.removeBubble(2, 3);
      grid.removeBubble(2, 4);
      
      // Einer der roten Bereiche sollte jetzt hängen
      const hangingBubbles = colorGroup.findHangingBubbles();
      expect(hangingBubbles.length).toBeGreaterThanOrEqual(6); // Ein kompletter Bereich
    });
  });

  describe('Performance-kritische Szenarien', () => {
    test('sollte große Grid-Operationen in angemessener Zeit abschließen', () => {
      const startTime = Date.now();
      
      // Fülle fast das gesamte Grid
      for (let row = 0; row < grid.rows - 1; row++) {
        for (let col = 0; col < grid.cols; col++) {
          const color = (row + col) % 2 === 0 ? TEST_COLOR_MAP.RED : TEST_COLOR_MAP.BLUE;
          const gridPos = grid.gridToPixel(row, col);
          const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, color);
          grid.addBubble(row, col, bubble);
        }
      }
      
      const fillTime = Date.now();
      expect(fillTime - startTime).toBeLessThan(500); // Grid-Füllung sollte schnell sein (realistischere Zeit)
      
      // Teste Gruppenerkennung auf vollem Grid
      const groupStartTime = Date.now();
      const largeGroup = colorGroup.findConnectedBubbles(0, 0);
      const groupEndTime = Date.now();
      
      expect(groupEndTime - groupStartTime).toBeLessThan(100); // Gruppenerkennung sollte schnell sein
      expect(largeGroup.length).toBeGreaterThan(0);
    });

    test('sollte viele simultane Kollisionsprüfungen handhaben', () => {
      const startTime = Date.now();
      
      // Erstelle viele Bubbles für Kollisionsprüfungen
      const testBubbles = [];
      for (let i = 0; i < 100; i++) {
        testBubbles.push({
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50
        });
      }
      
      // Teste alle gegen alle Kollisionen
      let collisionCount = 0;
      for (let i = 0; i < testBubbles.length; i++) {
        for (let j = i + 1; j < testBubbles.length; j++) {
          if (Collision.checkBubbleCollision(testBubbles[i], testBubbles[j])) {
            collisionCount++;
          }
        }
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200); // 10.000 Kollisionsprüfungen sollten schnell sein (realistischere Zeit)
    });

    test('sollte komplexe Hängende-Bubbles-Berechnungen effizient durchführen', () => {
      // Erstelle eine komplexe Struktur mit vielen potenziell hängenden Elementen
      const complexStructure = [];
      
      // Basis-Verbindung zum Top - nur ein kleiner verbundener Bereich
      grid.addBubble(0, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      grid.addBubble(1, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      
      // Erstelle isolierte Äste die NICHT mit der Top-Reihe verbunden sind
      for (let branch = 0; branch < 3; branch++) {
        const baseCol = branch * 3; // 0, 3, 6 - ausreichend getrennt von Spalte 5
        for (let depth = 3; depth < 8; depth++) { // Starte bei Reihe 3 um Trennung sicherzustellen
          if (grid.isValidGridPosition(depth, baseCol) && grid.isValidGridPosition(depth, baseCol + 1)) {
            grid.addBubble(depth, baseCol, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.CYAN));
            if (depth < 7) { // Nicht alle Positionen füllen um hängende Strukturen zu schaffen
              grid.addBubble(depth, baseCol + 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.CYAN));
            }
            complexStructure.push({ row: depth, col: baseCol });
            if (depth < 7) {
              complexStructure.push({ row: depth, col: baseCol + 1 });
            }
          }
        }
      }
      
      const startTime = Date.now();
      const hangingBubbles = colorGroup.findHangingBubbles();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(200); // Sollte auch bei komplexen Strukturen schnell sein (realistischere Zeit)
      expect(hangingBubbles.length).toBeGreaterThan(0); // Viele Bubbles sollten hängen
    });
  });

  describe('Edge Cases und Grenzfälle', () => {
    test('sollte mit leeren Grid-Bereichen umgehen', () => {
      const emptyGridBubble = { x: 200, y: 200 };
      const result = Collision.findNearestEmptyCell(grid, emptyGridBubble);
      
      expect(result).not.toBeNull();
      expect(grid.isValidGridPosition(result.row, result.col)).toBe(true);
    });

    test('sollte ungültige Grid-Positionen abfangen', () => {
      const invalidPositions = [
        { row: -1, col: 5 },
        { row: 5, col: -1 },
        { row: grid.rows, col: 5 },
        { row: 5, col: grid.cols }
      ];
      
      invalidPositions.forEach(pos => {
        expect(() => {
          colorGroup.findConnectedBubbles(pos.row, pos.col);
        }).not.toThrow();
      });
    });

    test('sollte mit sehr kleinen und sehr großen Bubble-Abständen umgehen', () => {
      const bubble1 = { x: 100, y: 100 };
      
      // Sehr kleiner Abstand
      const veryCloseBubble = { x: 100.001, y: 100.001 };
      expect(() => {
        Collision.checkBubbleCollision(bubble1, veryCloseBubble);
      }).not.toThrow();
      
      // Sehr großer Abstand
      const veryFarBubble = { x: 10000, y: 10000 };
      expect(() => {
        Collision.checkBubbleCollision(bubble1, veryFarBubble);
      }).not.toThrow();
    });

    test('sollte mit null und undefined Werten robust umgehen', () => {
      expect(() => {
        Collision.findNearestEmptyCell(grid, null);
      }).not.toThrow();
      
      expect(() => {
        colorGroup.findConnectedBubbles(null, null);
      }).not.toThrow();
    });
  });
});
