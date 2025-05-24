import { Shooter } from './Shooter';
import { BUBBLE_RADIUS } from './config';
import Phaser from 'phaser';

// Mocke Phaser.Math.Angle.Between, da wir die echte Phaser-Implementierung nicht im Test verwenden können
jest.mock('phaser', () => ({
  Math: {
    Angle: {
      // Einfache Implementierung von Between für Tests
      Between: (x1, y1, x2, y2) => {
        return Math.atan2(y2 - y1, x2 - x1);
      }
    }
  }
}));

describe('Shooter', () => {
  let shooter;
  const testX = 400;
  const testY = 600;
  const gameWidth = 800;

  beforeEach(() => {
    shooter = new Shooter({}, testX, testY); // Mock scene als leeres Objekt
  });

  test('sollte korrekt mit den übergebenen Eigenschaften initialisiert werden', () => {
    expect(shooter.x).toBe(testX);
    expect(shooter.y).toBe(testY);
    expect(shooter.shootAngle).toBe(0);
    expect(shooter.bubbleSpeed).toBe(800);
  });

  test('calculateAngle sollte den korrekten Winkel zwischen Kanone und Zielpunkt berechnen', () => {
    // Nach oben (12 Uhr)
    expect(shooter.calculateAngle(testX, testY - 100)).toBeCloseTo(-Math.PI/2, 5);
    
    // Nach rechts oben (1 Uhr)
    expect(shooter.calculateAngle(testX + 100, testY - 100)).toBeCloseTo(-Math.PI/4, 5);
    
    // Nach links oben (11 Uhr)
    expect(shooter.calculateAngle(testX - 100, testY - 100)).toBeCloseTo(-3*Math.PI/4, 5);
  });

  test('calculateVelocity sollte die korrekten X- und Y-Geschwindigkeiten basierend auf dem Winkel berechnen', () => {
    // Nach oben (12 Uhr)
    const upVelocity = shooter.calculateVelocity(-Math.PI/2);
    expect(upVelocity.velocityX).toBeCloseTo(0, 5);
    expect(upVelocity.velocityY).toBeCloseTo(-shooter.bubbleSpeed, 5);
    
    // Nach rechts oben (1 Uhr)
    const rightUpVelocity = shooter.calculateVelocity(-Math.PI/4);
    expect(rightUpVelocity.velocityX).toBeCloseTo(shooter.bubbleSpeed * Math.SQRT1_2, 5);
    expect(rightUpVelocity.velocityY).toBeCloseTo(-shooter.bubbleSpeed * Math.SQRT1_2, 5);
    
    // Nach links oben (11 Uhr)
    const leftUpVelocity = shooter.calculateVelocity(-3*Math.PI/4);
    expect(leftUpVelocity.velocityX).toBeCloseTo(-shooter.bubbleSpeed * Math.SQRT1_2, 5);
    expect(leftUpVelocity.velocityY).toBeCloseTo(-shooter.bubbleSpeed * Math.SQRT1_2, 5);
  });

  test('calculateWallReflection sollte die X-Geschwindigkeit umkehren', () => {
    const initialVelocity = { velocityX: 400, velocityY: -400 };
    const reflectedVelocity = shooter.calculateWallReflection(initialVelocity);
    expect(reflectedVelocity.velocityX).toBe(-initialVelocity.velocityX);
    expect(reflectedVelocity.velocityY).toBe(initialVelocity.velocityY);
  });

  test('isValidShootingDirection sollte korrekt validieren, ob eine Richtung gültig ist', () => {
    // Nach oben (gültig)
    expect(shooter.isValidShootingDirection(testX, testY - 100, gameWidth)).toBe(true);
    
    // Nach rechts oben (gültig)
    expect(shooter.isValidShootingDirection(testX + 100, testY - 100, gameWidth)).toBe(true);
    
    // Nach unten (ungültig)
    expect(shooter.isValidShootingDirection(testX, testY + 100, gameWidth)).toBe(false);
    
    // Außerhalb des Spielbereichs (ungültig)
    expect(shooter.isValidShootingDirection(-100, testY - 100, gameWidth)).toBe(false);
    expect(shooter.isValidShootingDirection(gameWidth + 100, testY - 100, gameWidth)).toBe(false);
  });

  test('checkWallCollision sollte Kollisionen mit der linken und rechten Wand erkennen', () => {
    // Bubble links außerhalb - Position so dass x - BUBBLE_RADIUS < 0
    const leftBubble = { x: BUBBLE_RADIUS - 1, y: 300, velocityX: -100, velocityY: -100 };
    expect(shooter.checkWallCollision(leftBubble, gameWidth)).toBe(true);
    expect(leftBubble.x).toBe(BUBBLE_RADIUS); // Position korrigiert
    expect(leftBubble.velocityX).toBe(100); // Geschwindigkeit umgekehrt (-(-100) = 100)
    
    // Bubble rechts außerhalb - Position so dass x + BUBBLE_RADIUS > gameWidth
    const rightBubble = { x: gameWidth - BUBBLE_RADIUS + 1, y: 300, velocityX: 100, velocityY: -100 };
    expect(shooter.checkWallCollision(rightBubble, gameWidth)).toBe(true);
    expect(rightBubble.x).toBe(gameWidth - BUBBLE_RADIUS); // Position korrigiert
    expect(rightBubble.velocityX).toBe(-100); // Geschwindigkeit umgekehrt (100 * -1 = -100)
    
    // Bubble innerhalb
    const middleBubble = { x: 400, y: 300, velocityX: 100, velocityY: -100 };
    expect(shooter.checkWallCollision(middleBubble, gameWidth)).toBe(false);
    expect(middleBubble.velocityX).toBe(100); // Geschwindigkeit unverändert
  });

  test('checkTopCollision sollte erkennen, wenn eine Bubble die obere Grenze erreicht', () => {
    // Bubble oberhalb der Grenze - y - BUBBLE_RADIUS < topY
    // Für topY = 20: y - 15 < 20 bedeutet y < 35
    // Teste mit einem extremeren Wert um sicherzustellen, dass es funktioniert
    expect(shooter.checkTopCollision({ x: 400, y: 10 }, 20)).toBe(true); // 10 - 15 = -5 < 20 = true
    
    // Bubble unterhalb der Grenze
    expect(shooter.checkTopCollision({ x: 400, y: 50 }, 20)).toBe(false);
    
    // Bubble genau auf der Grenze (Radius berücksichtigen)
    expect(shooter.checkTopCollision({ x: 400, y: 20 + BUBBLE_RADIUS }, 20)).toBe(false);
    expect(shooter.checkTopCollision({ x: 400, y: 20 + BUBBLE_RADIUS - 1 }, 20)).toBe(true);
  });
});
