import { TEST_COLOR_MAP } from './test-utils';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { ColorGroup } from './ColorGroup';
import { Collision } from './Collision';
import { BUBBLE_RADIUS } from './config';

// Mock für GameState (vereinfacht)
class MockGameState {
  constructor() {
    this.bubblesRemaining = 100;
    this.score = 0;
    this.level = 1;
    this.state = 'PLAYING';
  }
  
  decrementBubbles() {
    this.bubblesRemaining--;
  }
  
  addScore(points) {
    this.score += points;
  }
}

// Mock Phaser Scene
const mockScene = {
  add: {
    circle: jest.fn().mockImplementation(() => ({
      setStrokeStyle: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      body: {
        setCircle: jest.fn().mockReturnThis(),
        setVelocity: jest.fn().mockReturnThis(),
        setCollideWorldBounds: jest.fn().mockReturnThis(),
        setBounce: jest.fn().mockReturnThis(),
        setImmovable: jest.fn().mockReturnThis(),
        setFrictionX: jest.fn().mockReturnThis(),
        setFrictionY: jest.fn().mockReturnThis(),
        setMaxVelocity: jest.fn().mockReturnThis(),
        setDrag: jest.fn().mockReturnThis(),
        enable: true,
        onWorldBounds: false
      }
    }))
  },
  physics: {
    add: {
      existing: jest.fn()
    }
  }
};

describe('Integration Tests', () => {
  let grid, colorGroup, gameState;
  
  beforeEach(() => {
    grid = new Grid(mockScene, 8, 8);
    colorGroup = new ColorGroup(grid);
    gameState = new MockGameState();
  });

  test('basic initialization test', () => {
    expect(grid).toBeDefined();
    expect(colorGroup).toBeDefined();
    expect(gameState).toBeDefined();
  });

  describe('Vollständiger Spielablauf', () => {
    test('komplette Bubble-Kette: hinzufügen → Gruppe finden → entfernen', () => {
      // 1. Füge eine zusammenhängende Gruppe von 4 Bubbles hinzu
      const positions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 }
      ];
      
      positions.forEach(pos => {
        const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      // 2. Finde die zusammenhängende Gruppe
      const connectedGroup = colorGroup.findConnectedBubbles(0, 0);
      expect(connectedGroup).toHaveLength(4);
      
      // 3. Entferne die Gruppe (Mindestgröße 3)
      const removedBubbles = colorGroup.findAndRemoveGroup(0, 0, 3);
      expect(removedBubbles).toHaveLength(4);
      
      // 4. Verifiziere, dass alle Bubbles entfernt wurden
      positions.forEach(pos => {
        expect(grid.getBubble(pos.row, pos.col)).toBeNull();
      });
    });
    
    test('Kollisionserkennung → Bubble-Platzierung → Gruppenbildung', () => {
      // Erstelle eine existierende Struktur
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      
      // Simuliere eine neue Bubble, die in der Nähe kollidiert
      const newBubble = new Bubble(mockScene, 60, 40, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE);
      
      // Finde die nächste freie Position
      const nearestCell = Collision.findNearestEmptyCell(grid, newBubble);
      expect(nearestCell).not.toBeNull();
      
      // Platziere die Bubble
      grid.addBubble(nearestCell.row, nearestCell.col, newBubble);
      
      // Prüfe, ob eine größere Gruppe entstanden ist
      const group = colorGroup.findConnectedBubbles(0, 0);
      expect(group.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Spiel-Zustand Integration', () => {
    test('Punkte-System funktioniert mit Gruppenentfernung', () => {
      // Erstelle eine entfernbare Gruppe
      const positions = [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 }
      ];
      
      positions.forEach(pos => {
        const bubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN);
        grid.addBubble(pos.row, pos.col, bubble);
      });
      
      const initialScore = gameState.score;
      
      // Entferne die Gruppe
      const removedBubbles = colorGroup.findAndRemoveGroup(1, 2, 3);
      
      // Simuliere Punktevergabe (100 Punkte pro Bubble)
      const points = removedBubbles.length * 100;
      gameState.addScore(points);
      
      expect(removedBubbles).toHaveLength(5);
      expect(gameState.score).toBe(initialScore + 500);
    });
    
    test('Bubble-Verbrauch wird korrekt getrackt', () => {
      const initialBubbles = gameState.bubblesRemaining;
      
      // Simuliere das Abschießen einer Bubble
      gameState.decrementBubbles();
      
      expect(gameState.bubblesRemaining).toBe(initialBubbles - 1);
    });
  });

  describe('Komplexe Szenarien', () => {
    test('Mehrere Gruppen unterschiedlicher Farben', () => {
      // Rote Gruppe (linke Seite, mit Verbindung zur Decke)
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      
      // Blaue Gruppe (rechte Seite, getrennt, aber auch mit Verbindung zur Decke)
      grid.addBubble(0, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      grid.addBubble(0, 5, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      grid.addBubble(1, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      
      // Teste beide Gruppen separat
      const redGroup = colorGroup.findConnectedBubbles(0, 0);
      const blueGroup = colorGroup.findConnectedBubbles(0, 4);
      
      expect(redGroup).toHaveLength(3);
      expect(blueGroup).toHaveLength(3);
      
      // Entferne nur die rote Gruppe
      const removedRed = colorGroup.findAndRemoveGroup(0, 0, 3);
      expect(removedRed).toHaveLength(3); // Nur die rote Gruppe
      
      // Blaue Gruppe sollte noch existieren
      const remainingBlue = colorGroup.findConnectedBubbles(0, 4);
      expect(remainingBlue).toHaveLength(3);
    });
    
    test('Kettenreaktion: Entfernung einer Gruppe macht andere freischwebend', () => {
      // Struktur: Rote Stützgruppe in oberster Reihe
      grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 3, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      grid.addBubble(0, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.RED));
      
      // Blaue Gruppe darunter (hängt von roter ab)
      grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      grid.addBubble(1, 3, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.BLUE));
      
      // Grüne Gruppe noch weiter unten
      grid.addBubble(2, 2, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN));
      grid.addBubble(2, 3, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN));
      grid.addBubble(2, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, TEST_COLOR_MAP.GREEN));
      
      // Entferne die rote Stützgruppe
      const removedBubbles = colorGroup.findAndRemoveGroup(0, 2, 3);
      
      // Sollte rote Gruppe + alle hängenden Bubbles entfernt haben
      expect(removedBubbles.length).toBeGreaterThanOrEqual(3);
      
      // Prüfe, dass freischwebende Bubbles erkannt wurden
      const floating = colorGroup.findHangingBubbles();
      expect(floating.length).toBe(0); // Alle sollten entfernt worden sein
    });
  });
});
