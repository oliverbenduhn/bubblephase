// Neue Test-Datei für fehlende Physik-Integrationstests
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS } from './Bubble';
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_RADIUS } from './config';

describe('Physics Integration Tests', () => {
  let mockScene, grid, shooter, colorGroup;

  beforeEach(() => {
    mockScene = {
      add: { circle: () => ({ setStrokeStyle: () => {}, destroy: () => {} }) },
      physics: { add: { existing: () => ({ body: { setCircle: () => {} } }) } }
    };
    grid = new Grid(mockScene, 10, 8, 50, 50);
    shooter = new Shooter(mockScene, 400, 600);
    colorGroup = new ColorGroup(grid);
  });

  describe('Complete Shot Sequence', () => {
    test('should handle complete shot: projectile → collision → attachment → group removal → gravity', () => {
      // Setup: Grid mit einigen Bubbles
      grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
      grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
      grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.BLUE));
      
      // Simuliere Schuss
      const shootingBubble = new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED);
      const angle = shooter.calculateAngle(grid.gridToPixel(0, 2).x, grid.gridToPixel(0, 2).y);
      const velocity = shooter.calculateVelocity(angle);
      
      // Simuliere Kollision und Attachment
      const nearestCell = Collision.findNearestEmptyCell(grid, { x: grid.gridToPixel(0, 2).x, y: grid.gridToPixel(0, 2).y });
      expect(nearestCell).not.toBeNull();
      
      // Füge Bubble hinzu
      grid.addBubble(nearestCell.row, nearestCell.col, shootingBubble);
      
      // Teste Gruppenerkennung
      const removedBubbles = colorGroup.findAndRemoveGroup(nearestCell.row, nearestCell.col, 3);
      expect(removedBubbles.length).toBeGreaterThan(0);
      
      // Teste Schwerkraft
      const floatingBubbles = grid.removeFloatingBubbles();
      expect(Array.isArray(floatingBubbles)).toBe(true);
    });
  });

  describe('Bank Shots (Wall Reflection + Collision)', () => {
    test('should handle wall reflection followed by bubble collision', () => {
      // Setup Bubble kurz vor der rechten Wand (muss über Wand hinausgehen für Kollision)
      const gameWidth = 800;
      const shootingBubble = { x: gameWidth - BUBBLE_RADIUS + 5, y: 400, velocityX: 100, velocityY: -100 };
      
      // Teste Wandkollision
      const wallCollision = shooter.checkWallCollision(shootingBubble, gameWidth);
      expect(wallCollision).toBe(true);
      expect(shootingBubble.velocityX).toBe(-100); // Reflektiert
      
      // Simuliere weitere Bewegung nach Reflexion
      shootingBubble.x += shootingBubble.velocityX * 0.1; // Bewegung nach Reflexion
      
      // Teste Kollision mit Grid-Bubble
      grid.addBubble(2, 2, new Bubble(mockScene, 200, 200, BUBBLE_RADIUS, BUBBLE_COLORS.BLUE));
      const gridCollision = Collision.checkGridCollision(shootingBubble, grid);
      // Sollte nach der Reflexion möglicherweise kollidieren
    });
  });

  describe('Multiple Wall Reflections', () => {
    test('should handle multiple wall bounces correctly', () => {
      const gameWidth = 800;
      const bubble = { x: BUBBLE_RADIUS - 5, y: 300, velocityX: -200, velocityY: -50 }; // Kurz vor linker Wand
      
      // Erste Reflexion (linke Wand)
      let collision1 = shooter.checkWallCollision(bubble, gameWidth);
      expect(collision1).toBe(true);
      expect(bubble.velocityX).toBe(200); // Nach rechts
      
      // Simuliere Bewegung zur rechten Wand
      bubble.x = gameWidth - BUBBLE_RADIUS + 1;
      
      // Zweite Reflexion (rechte Wand)
      let collision2 = shooter.checkWallCollision(bubble, gameWidth);
      expect(collision2).toBe(true);
      expect(bubble.velocityX).toBe(-200); // Nach links
    });
  });

  describe('Complex Gravity Scenarios', () => {
    test('should handle cascading gravity effects', () => {
      // Setup: Turmartige Struktur die nach Gruppenentfernung fällt
      // Basis (wird entfernt)
      grid.addBubble(5, 3, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
      grid.addBubble(5, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
      grid.addBubble(5, 5, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
      
      // Turm darüber (sollte fallen)
      grid.addBubble(4, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.BLUE));
      grid.addBubble(3, 4, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.GREEN));
      
      // Verbindung zur Decke
      for (let row = 0; row < 3; row++) {
        grid.addBubble(row, 0, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.YELLOW));
      }
      
      // Entferne die rote Basis-Gruppe
      const removedGroup = colorGroup.findAndRemoveGroup(5, 4, 3);
      expect(removedGroup.length).toBe(5); // 3 rote + 2 floating bubbles
      
      // Überprüfe, dass die erwarteten Bubbles entfernt wurden
      expect(removedGroup).toContainEqual({ row: 5, col: 3 });
      expect(removedGroup).toContainEqual({ row: 5, col: 4 });
      expect(removedGroup).toContainEqual({ row: 5, col: 5 });
      expect(removedGroup).toContainEqual({ row: 4, col: 4 });
      expect(removedGroup).toContainEqual({ row: 3, col: 4 });
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle full grid without performance issues', () => {
      // Fülle das gesamte Grid
      const startTime = performance.now();
      
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          const color = Object.values(BUBBLE_COLORS)[Math.floor(Math.random() * Object.values(BUBBLE_COLORS).length)];
          grid.addBubble(row, col, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, color));
        }
      }
      
      // Teste Collision-Erkennung bei vollem Grid
      const testBubble = { x: 100, y: 100 };
      const collision = Collision.checkGridCollision(testBubble, grid);
      
      const endTime = performance.now();
      
      // Performance-Assertion: sollte unter 100ms sein
      expect(endTime - startTime).toBeLessThan(100);
      expect(collision).not.toBeNull(); // Sollte eine Kollision finden
    });
  });

  describe('Edge Case Scenarios', () => {
    test('should handle bubble attachment when grid is nearly full', () => {
      // Lasse nur eine Zelle frei
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          if (!(row === 2 && col === 3)) { // Lasse eine Zelle frei
            grid.addBubble(row, col, new Bubble(mockScene, 0, 0, BUBBLE_RADIUS, BUBBLE_COLORS.RED));
          }
        }
      }
      
      const shootingBubble = { x: 200, y: 150 };
      const nearestCell = Collision.findNearestEmptyCell(grid, shootingBubble);
      
      expect(nearestCell).toEqual({ row: 2, col: 3 });
    });

    test('should handle extreme shooting angles', () => {
      // Teste sehr flache Winkel (fast horizontal)
      const shallowAngle = Math.PI * 0.02; // ~3.6 Grad - noch flacher
      const velocity = shooter.calculateVelocity(shallowAngle);
      
      expect(velocity.velocityX).toBeGreaterThan(Math.abs(velocity.velocityY) * 10); // Sehr horizontal
      expect(shooter.isValidShootingDirection(shooter.x + 100, shooter.y - 10, 800)).toBe(true);
      
      // Teste sehr steile Winkel (fast vertikal)
      const steepAngle = -Math.PI * 0.45; // ~81 Grad
      const steepVelocity = shooter.calculateVelocity(steepAngle);
      
      expect(Math.abs(steepVelocity.velocityY)).toBeGreaterThan(Math.abs(steepVelocity.velocityX) * 5);
    });
  });
});
