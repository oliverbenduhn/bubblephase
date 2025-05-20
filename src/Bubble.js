export class Bubble {
  constructor(scene, x, y, radius, color) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.gameObject = null; // Wird später das Phaser Grafikobjekt halten
  }

  // Methode zum Zeichnen der Bubble
  draw() {
    if (this.gameObject) {
      this.gameObject.destroy(); // Altes Objekt entfernen, falls vorhanden
    }
    this.gameObject = this.scene.add.circle(this.x, this.y, this.radius, this.color);
    // Optional: Einen Rand hinzufügen, um die Bubbles besser zu unterscheiden
    this.gameObject.setStrokeStyle(1, 0x000000, 0.8); 
    return this.gameObject;
  }

  // Methode zum Setzen der Position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(x, y);
    }
  }

  // Methode zum Zerstören des Grafikobjekts (wichtig für Speicherbereinigung)
  destroy() {
    if (this.gameObject) {
      this.gameObject.destroy();
      this.gameObject = null;
    }
  }
}

// Mögliche Farben für die Bubbles
export const BUBBLE_COLORS = {
  RED: 0xff0000,
  GREEN: 0x00ff00,
  BLUE: 0x0000ff,
  YELLOW: 0xffff00,
  PURPLE: 0x800080,
  ORANGE: 0xffa500,
};

// Standardradius für Bubbles
export const BUBBLE_RADIUS = 20;
