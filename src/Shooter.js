import Phaser from 'phaser';
import { BUBBLE_RADIUS } from './config';

export class Shooter {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.shootAngle = 0; // In Radians
    this.bubbleSpeed = 800; // Geschwindigkeit der Bubble in Pixel pro Sekunde
  }

  /**
   * Berechnet den Winkel zwischen der Kanone und einem Zielpunkt
   * Winkel wird in Radians zurückgegeben
   * @param {number} targetX - X-Koordinate des Zielpunkts 
   * @param {number} targetY - Y-Koordinate des Zielpunkts
   * @returns {number} - Winkel in Radians
   */
  calculateAngle(targetX, targetY) {
    return Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
  }

  /**
   * Berechnet die Geschwindigkeit (Vektoren) für die abgeschossene Bubble
   * @param {number} angle - Winkel in Radians 
   * @returns {Object} - Objekt mit velocityX und velocityY
   */
  calculateVelocity(angle) {
    const velocityX = this.bubbleSpeed * Math.cos(angle);
    const velocityY = this.bubbleSpeed * Math.sin(angle);
    return { velocityX, velocityY };
  }

  /**
   * Berechnet den Aufprallwinkel, wenn die Bubble die Wand trifft
   * Für einfache Reflexionen wird der horizontale Geschwindigkeitsvektor umgekehrt
   * @param {Object} velocity - Aktuelle Geschwindigkeit mit velocityX und velocityY 
   * @returns {Object} - Neue Geschwindigkeit nach der Reflexion
   */
  calculateWallReflection(velocity) {
    return {
      velocityX: -velocity.velocityX,
      velocityY: velocity.velocityY
    };
  }

  /**
   * Prüft, ob die angegebenen Koordinaten gültig für einen Schuss sind
   * (z.B. oberhalb der Kanone, innerhalb der Spielgrenzen)
   * @param {number} targetX - X-Koordinate des Zielpunkts 
   * @param {number} targetY - Y-Koordinate des Zielpunkts
   * @param {number} gameWidth - Breite des Spielbereichs
   * @returns {boolean} - true wenn valide, sonst false
   */
  isValidShootingDirection(targetX, targetY, gameWidth) {
    if (targetY >= this.y) return false; // Nicht nach unten schießen
    if (targetX < 0 || targetX > gameWidth) return false; // Nicht außerhalb der Spielgrenzen
    return true;
  }

  /**
   * Prüft, ob eine Bubble mit der Wand kollidiert und korrigiert ihre Position/Geschwindigkeit
   * @param {Object} bubble - Die Bubble, die geprüft wird
   * @param {number} gameWidth - Breite des Spielbereichs
   * @returns {boolean} - true wenn Kollision erkannt wurde, sonst false
   */
  checkWallCollision(bubble, gameWidth) {
    let hasCollision = false;
    
    // Linke Wand
    if (bubble.x - BUBBLE_RADIUS < 0) {
      bubble.x = BUBBLE_RADIUS; // Position korrigieren
      bubble.velocityX *= -1; // Reflexion
      hasCollision = true;
    }
    // Rechte Wand
    else if (bubble.x + BUBBLE_RADIUS > gameWidth) {
      bubble.x = gameWidth - BUBBLE_RADIUS; // Position korrigieren
      bubble.velocityX *= -1; // Reflexion
      hasCollision = true;
    }
    return hasCollision;
  }

  /**
   * Prüft, ob die angegebene Bubble die obere Wand (oder eine bestimmte Y-Koordinate) erreicht hat
   * @param {Object} bubble - Die zu prüfende Bubble 
   * @param {number} topY - Y-Koordinate der oberen Grenze (optional, Default ist 0)
   * @returns {boolean} - true wenn die Bubble die obere Grenze erreicht hat
   */
  checkTopCollision(bubble, topY = 0) {
    const result = bubble.y - BUBBLE_RADIUS < topY;
    return result;
  }

  /**
   * Update-Methode für den Shooter (wird vom Spiel-Loop aufgerufen)
   * @param {number} delta - Zeit seit dem letzten Frame in Millisekunden
   */
  update(delta) {
    // Placeholder für zukünftige Shooter-Updates
    // Zum Beispiel: Animation der Kanone, automatisches Zielen, etc.
  }
}
