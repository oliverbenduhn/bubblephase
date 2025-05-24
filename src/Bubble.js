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
    // Erstelle einen physikalischen Kreis
    this.gameObject = this.scene.add.circle(this.x, this.y, this.radius, this.color);
    // Aktiviere die Physik für die Blase
    this.scene.physics.add.existing(this.gameObject, false);
    // Setze die Kollisionsbox
    this.gameObject.body.setCircle(this.radius);
    // Optional: Einen Rand hinzufügen, um die Bubbles besser zu unterscheiden
    this.gameObject.setStrokeStyle(1, 0x000000, 0.8);
    // Setze die Geschwindigkeit auf 0 um zu verhindern, dass die Blase fällt
    this.gameObject.body.setVelocity(0, 0);
    return this.gameObject;
  }

  // Methode zum Setzen der Position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.gameObject) {
      // Setze die Position des GameObjects
      this.gameObject.setPosition(x, y);
      
      // Aktualisiere auch die Physics-Body Position wenn vorhanden
      if (this.gameObject.body) {
        // Stoppe jegliche Bewegung
        this.gameObject.body.setVelocity(0, 0);
        // Setze die Position des Physics-Bodies direkt
        this.gameObject.body.x = x - this.radius;
        this.gameObject.body.y = y - this.radius;
        // Stelle sicher, dass der Body mit dem GameObject synchronisiert ist
        this.gameObject.body.updateFromGameObject();
      }
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

// Standardradius für Bubbles - moved to config.js
// export const BUBBLE_RADIUS = 20;
