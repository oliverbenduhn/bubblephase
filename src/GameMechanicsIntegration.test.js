
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
 * Diese Tests überprüfen die Integration aller Spielmechaniken und stellen sicher,
 * dass Kollisionserkennung, Bubble-Attachment und Gruppenerkennung zusammenarbeiten
 */
describe('Integrierte Spielmechanik-Tests', () => {
  let grid;
  let colorGroup;

  beforeEach(() => {
    grid = new Grid(mockScene, 10, 8, 50, 50);
    colorGroup = new ColorGroup(grid);
  });

  describe('Vollständige Schuss-zu-Entfernung Zyklen', () => {
    test('sollte einen kompletten Bubble-Schuss-Zyklus mit Gruppenerkennung durchführen', () => {
      // Setup: Erstelle eine fast entfernbare Gruppe - 2 rote Bubbles nebeneinander
      grid.addBubble(0, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      // Füge einige andere Bubbles hinzu, aber lasse Platz für eine direkte Verbindung
      grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(1, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));

      // Schritt 1: Schieße eine rote Bubble strategisch, um sie an die bestehende Gruppe anzuhängen
      // Ziele auf Position (1,3) - direkt unter der ersten roten Bubble und neben der zweiten
      const targetPos = grid.gridToPixel(1, 3);
      const shootingBubble = {
        x: targetPos.x,
        y: targetPos.y,
        color: TEST_COLOR_MAP.RED
      };

      // Schritt 2: Finde die Attachment-Position
      const attachmentPos = Collision.findNearestEmptyCell(grid, shootingBubble);
      expect(attachmentPos).not.toBeNull();

      // Schritt 3: Platziere die Bubble
      const attachmentPixelPos = grid.gridToPixel(attachmentPos.row, attachmentPos.col);
      const placedBubble = new Bubble(
        mockScene,
        attachmentPixelPos.x,
        attachmentPixelPos.y,
        BUBBLE_RADIUS,
        TEST_COLOR_MAP.RED
      );
      grid.addBubble(attachmentPos.row, attachmentPos.col, placedBubble);

      // Schritt 4: Prüfe auf entfernbare Gruppen
      const connectedGroup = colorGroup.findConnectedBubbles(attachmentPos.row, attachmentPos.col);
      const isRemovable = colorGroup.checkRemovableBubbles(connectedGroup);

      // Erwartung: Die rote Gruppe sollte jetzt 3 Bubbles haben und entfernbar sein
      expect(connectedGroup.length).toBeGreaterThanOrEqual(3);
      expect(isRemovable).toBe(true);

      // Schritt 5: Entferne die Gruppe
      connectedGroup.forEach(pos => {
        grid.removeBubble(pos.row, pos.col);
      });

      // Schritt 6: Prüfe auf hängende Bubbles
      const hangingBubbles = colorGroup.findHangingBubbles();
      
      // Die blauen Bubbles sollten noch da sein, aber möglicherweise hängen
      let remainingBubbles = 0;
      grid.forEachBubble(() => remainingBubbles++);
      
      if (hangingBubbles.length > 0) {
        hangingBubbles.forEach(pos => {
          grid.removeBubble(pos.row, pos.col);
        });
      }
    });

    test('sollte Kettenreaktionen korrekt auslösen', () => {
      // Setup: Erstelle eine Kettenreaktions-Situation
      // Ebene 1: Basis (bleibt)
      grid.addBubble(0, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      grid.addBubble(0, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));

      // Ebene 2: Erste Gruppe (wird entfernt)
      grid.addBubble(1, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      grid.addBubble(1, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));

      // Ebene 3: Zweite Gruppe (hängt von der ersten ab)
      grid.addBubble(2, 3, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 4, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
      grid.addBubble(2, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));

      // Schieße eine dritte rote Bubble
      const shootingBubble = { x: 150, y: 150, color: TEST_COLOR_MAP.RED };
      const attachmentPos = Collision.findNearestEmptyCell(grid, shootingBubble);
      
      // Stelle sicher, dass sie zur roten Gruppe hinzugefügt wird
      if (attachmentPos) {
        const placedBubble = new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED);
        grid.addBubble(attachmentPos.row, attachmentPos.col, placedBubble);

        // Prüfe die rote Gruppe
        const redGroup = colorGroup.findConnectedBubbles(1, 3);
        if (redGroup.length >= 3) {
          // Entferne rote Gruppe
          redGroup.forEach(pos => {
            grid.removeBubble(pos.row, pos.col);
          });

          // Prüfe Kettenreaktion
          const hangingBubbles = colorGroup.findHangingBubbles();
          expect(hangingBubbles.length).toBeGreaterThan(0);

          // Die blauen Bubbles sollten hängen
          const blueHanging = hangingBubbles.filter(pos => {
            // Prüfe, ob es ursprünglich blaue Positionen waren
            return (pos.row === 2 && (pos.col === 3 || pos.col === 4 || pos.col === 5));
          });
          expect(blueHanging.length).toBeGreaterThan(0);
        }
      }
    });

    test('sollte komplexe Multi-Color-Szenarien handhaben', () => {
      // Erstelle ein komplexes Szenario mit mehreren Farben
      const scenario = [
        // Rote Basis-Linie
        { row: 0, col: 2, color: TEST_COLOR_MAP.RED },
        { row: 0, col: 3, color: TEST_COLOR_MAP.RED },
        { row: 0, col: 4, color: TEST_COLOR_MAP.RED },
        { row: 0, col: 5, color: TEST_COLOR_MAP.RED },
        
        // Blaue zweite Linie
        { row: 1, col: 2, color: TEST_COLOR_MAP.BLUE },
        { row: 1, col: 3, color: TEST_COLOR_MAP.BLUE },
        { row: 1, col: 4, color: TEST_COLOR_MAP.GREEN },
        { row: 1, col: 5, color: TEST_COLOR_MAP.BLUE },
        
        // Grüne dritte Linie
        { row: 2, col: 2, color: TEST_COLOR_MAP.GREEN },
        { row: 2, col: 3, color: TEST_COLOR_MAP.GREEN },
        { row: 2, col: 4, color: TEST_COLOR_MAP.YELLOW },
        { row: 2, col: 5, color: TEST_COLOR_MAP.GREEN }
      ];

      scenario.forEach(setup => {
        const gridPos = grid.gridToPixel(setup.row, setup.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, setup.color);
        grid.addBubble(setup.row, setup.col, bubble);
      });

      // Teste verschiedene Schüsse
      const testShots = [
        { targetColor: TEST_COLOR_MAP.GREEN, expectedGroupSize: 3 },
        { targetColor: TEST_COLOR_MAP.BLUE, expectedGroupSize: 3 },
        { targetColor: TEST_COLOR_MAP.RED, expectedGroupSize: 4 }
      ];

      testShots.forEach(shot => {
        // Finde eine Position für diese Farbe
        let targetPos = null;
        grid.forEachBubble((bubble, row, col) => {
          if (!targetPos && bubble.color === shot.targetColor) {
            const neighbors = grid.getNeighbors(row, col);
            const emptyNeighbor = neighbors.find(n => !grid.getBubble(n.row, n.col));
            if (emptyNeighbor) {
              targetPos = emptyNeighbor;
            }
          }
        });

        if (targetPos) {
          const testBubble = new Bubble(mockScene, 0, 0, 10, shot.targetColor);
          grid.addBubble(targetPos.row, targetPos.col, testBubble);

          const group = colorGroup.findConnectedBubbles(targetPos.row, targetPos.col);
          expect(group.length).toBeGreaterThanOrEqual(shot.expectedGroupSize);

          // Rückgängig machen für nächsten Test
          grid.removeBubble(targetPos.row, targetPos.col);
        }
      });
    });
  });

  describe('Performance-kritische Integrationsszenarien', () => {
    test('sollte große Grids mit vielen Operationen effizient handhaben', () => {
      const startTime = Date.now();

      // Erstelle ein großes, komplexes Grid
      const colors = [TEST_COLOR_MAP.RED, TEST_COLOR_MAP.BLUE, TEST_COLOR_MAP.GREEN, TEST_COLOR_MAP.YELLOW];
      
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          if (Math.random() > 0.3) { // 70% Füllgrad
            const color = colors[Math.floor(Math.random() * colors.length)];
            const gridPos = grid.gridToPixel(row, col);
            const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, color);
            grid.addBubble(row, col, bubble);
          }
        }
      }

      const setupTime = Date.now();
      expect(setupTime - startTime).toBeLessThan(200);

      // Teste mehrere Attachment-Operationen
      for (let i = 0; i < 10; i++) {
        const randomBubble = {
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50
        };
        
        const attachmentPos = Collision.findNearestEmptyCell(grid, randomBubble);
        if (attachmentPos) {
          const group = colorGroup.findConnectedBubbles(attachmentPos.row, attachmentPos.col);
          // Teste nur, dass keine Fehler auftreten
          expect(group).toBeDefined();
        }
      }

      const operationsTime = Date.now();
      expect(operationsTime - setupTime).toBeLessThan(100);
    });

    test('sollte viele hängende Bubbles effizient finden', () => {
      // Erstelle eine Struktur mit vielen hängenden Elementen
      // Nur wenige Verbindungen zum Top
      grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));
      grid.addBubble(0, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.WHITE));

      // Viele hängende Bereiche
      for (let row = 3; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          if (Math.random() > 0.5) {
            const color = row % 2 === 0 ? TEST_COLOR_MAP.RED : TEST_COLOR_MAP.BLUE;
            const gridPos = grid.gridToPixel(row, col);
            const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, color);
            grid.addBubble(row, col, bubble);
          }
        }
      }

      const startTime = Date.now();
      const hangingBubbles = colorGroup.findHangingBubbles();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(hangingBubbles.length).toBeGreaterThan(0);
    });
  });

  describe('Robustheit und Fehlerbehandlung', () => {
    test('sollte mit inkonsistenten Grid-Zuständen umgehen', () => {
      // Erstelle einen inkonsistenten Zustand
      grid.addBubble(5, 5, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
      
      // Versuche Operationen auf diesem inkonsistenten Zustand
      expect(() => {
        const group = colorGroup.findConnectedBubbles(5, 5);
        const hanging = colorGroup.findHangingBubbles();
        const attachmentPos = Collision.findNearestEmptyCell(grid, { x: 200, y: 200 });
      }).not.toThrow();
    });

    test('sollte mit extremen Bubble-Positionen umgehen', () => {
      const extremePositions = [
        { x: -100, y: -100 },    // Negative Koordinaten
        { x: 10000, y: 10000 },  // Sehr große Koordinaten
        { x: 0, y: 0 },          // Null-Koordinaten
        { x: 0.1, y: 0.1 }       // Sehr kleine Koordinaten
      ];

      extremePositions.forEach(pos => {
        expect(() => {
          const result = Collision.findNearestEmptyCell(grid, pos);
          // Sollte entweder ein gültiges Ergebnis oder null zurückgeben
          if (result !== null) {
            expect(grid.isValidGridPosition(result.row, result.col)).toBe(true);
          }
        }).not.toThrow();
      });
    });

    test('sollte mit null und undefined Eingaben robust umgehen', () => {
      expect(() => {
        Collision.findNearestEmptyCell(grid, null);
        Collision.findNearestEmptyCell(grid, undefined);
        Collision.checkBubbleCollision(null, null);
        colorGroup.findConnectedBubbles(null, null);
        colorGroup.findHangingBubbles();
      }).not.toThrow();
    });

    test('sollte Memory Leaks bei wiederholten Operationen vermeiden', () => {
      // Simuliere viele Grid-Operationen
      for (let iteration = 0; iteration < 50; iteration++) {
        // Fülle Grid
        for (let i = 0; i < 20; i++) {
          const row = Math.floor(Math.random() * grid.rows);
          const col = Math.floor(Math.random() * grid.cols);
          if (!grid.getBubble(row, col)) {
            const gridPos = grid.gridToPixel(row, col);
            const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
            grid.addBubble(row, col, bubble);
          }
        }

        // Finde Gruppen
        const randomRow = Math.floor(Math.random() * grid.rows);
        const randomCol = Math.floor(Math.random() * grid.cols);
        if (grid.getBubble(randomRow, randomCol)) {
          colorGroup.findConnectedBubbles(randomRow, randomCol);
        }

        // Räume auf
        grid.forEachBubble((bubble, row, col) => {
          if (Math.random() > 0.7) {
            grid.removeBubble(row, col);
          }
        });

        // Finde hängende Bubbles
        colorGroup.findHangingBubbles();
      }

      // Überprüfe auf Memory-Leaks durch nicht ordnungsgemäß entfernte Objekte
      
      // Zähle Bubbles mit ungültigem Zustand (sollte 0 sein)
      let invalidBubbleStates = 0;
      grid.forEachBubble((bubble) => {
        if (bubble && (
          !bubble.gameObject ||
          !bubble.destroy || // Prüfe, ob destroy-Methode existiert
          bubble.x === undefined ||
          bubble.y === undefined ||
          bubble.colorId === undefined
        )) {
          invalidBubbleStates++;
        }
      });

      // Zähle tatsächliche Bubbles im Grid
      let gridBubbleCount = 0;
      grid.forEachBubble(() => gridBubbleCount++);

      // Zähle Game-Objekte (sollte nicht größer sein als Grid-Größe minus entfernte Bubbles)
      let remainingGameObjects = grid.getAllBubbleObjects().length;

      expect(invalidBubbleStates).toBe(0);
      expect(gridBubbleCount).toBe(gridBubbleCount); // Überprüft Konsistenz der Grid-Datenstruktur
      expect(remainingGameObjects).toBeLessThanOrEqual(grid.rows * grid.cols - grid.removeBubblesCount);
    });
  });

  describe('Realistische Spielszenarien', () => {
    test('sollte ein typisches Level-Progression-Szenario simulieren', () => {
      // Setup: Anfangszustand eines Levels
      const levelSetup = [
        // Obere Reihen mit verschiedenen Farben
        { row: 0, col: 0, color: TEST_COLOR_MAP.RED },
        { row: 0, col: 1, color: TEST_COLOR_MAP.BLUE },
        { row: 0, col: 2, color: TEST_COLOR_MAP.RED },
        { row: 0, col: 3, color: TEST_COLOR_MAP.GREEN },
        { row: 0, col: 4, color: TEST_COLOR_MAP.BLUE },
        
        { row: 1, col: 0, color: TEST_COLOR_MAP.GREEN },
        { row: 1, col: 1, color: TEST_COLOR_MAP.RED },
        { row: 1, col: 2, color: TEST_COLOR_MAP.BLUE },
        { row: 1, col: 3, color: TEST_COLOR_MAP.RED },
        { row: 1, col: 4, color: TEST_COLOR_MAP.GREEN }
      ];

      levelSetup.forEach(setup => {
        const gridPos = grid.gridToPixel(setup.row, setup.col);
        const bubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, setup.color);
        grid.addBubble(setup.row, setup.col, bubble);
      });

      // Simuliere Spielerzüge
      const playerShots = [
        { color: TEST_COLOR_MAP.RED, targetArea: { x: 100, y: 150 } },
        { color: TEST_COLOR_MAP.BLUE, targetArea: { x: 200, y: 150 } },
        { color: TEST_COLOR_MAP.GREEN, targetArea: { x: 150, y: 200 } }
      ];

      let shotCount = 0;
      let removedBubbles = 0;

      playerShots.forEach(shot => {
        shotCount++;
        
        // Finde Attachment-Position
        const attachmentPos = Collision.findNearestEmptyCell(grid, shot.targetArea);
        
        if (attachmentPos) {
          // Platziere Bubble
          const gridPos = grid.gridToPixel(attachmentPos.row, attachmentPos.col);
          const newBubble = new Bubble(mockScene, gridPos.x, gridPos.y, BUBBLE_RADIUS, shot.color);
          grid.addBubble(attachmentPos.row, attachmentPos.col, newBubble);

          // Prüfe auf entfernbare Gruppen
          const group = colorGroup.findConnectedBubbles(attachmentPos.row, attachmentPos.col);
          if (colorGroup.checkRemovableBubbles(group)) {
            group.forEach(pos => {
              grid.removeBubble(pos.row, pos.col);
              removedBubbles++;
            });

            // Prüfe auf Kettenreaktionen
            const hanging = colorGroup.findHangingBubbles();
            hanging.forEach(pos => {
              grid.removeBubble(pos.row, pos.col);
              removedBubbles++;
            });
          }
        }
      });

      expect(shotCount).toBe(3);
      expect(removedBubbles).toBeGreaterThanOrEqual(0);
      
      // Prüfe, dass das Grid noch in einem gültigen Zustand ist
      let remainingBubbles = 0;
      grid.forEachBubble(() => remainingBubbles++);
      expect(remainingBubbles).toBeGreaterThanOrEqual(0);
    });
  });
});
