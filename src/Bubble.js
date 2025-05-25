import { getColorValue } from './config.js';

export class Bubble {
  constructor(scene, x, y, radius, colorId) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colorId = colorId; // Logische Farb-ID (z.B. 'COLOR_A')
    this.gameObject = null; // Wird später das Phaser Grafikobjekt halten
  }

  // Getter für aktuelle Farbwert basierend auf Theme
  get color() {
    return getColorValue(this.colorId);
  }

  // Methode zum Zeichnen der Bubble
  draw() {
    if (this.gameObject) {
      this.gameObject.destroy(); // Altes Objekt entfernen, falls vorhanden
    }
    
    // Debug: Überprüfe die Farbwerte
    const colorValue = this.color;
    // Performance: console.log reduziert für Tests
    
    // Fallback-Farbe falls undefined
    const safeColor = colorValue || 0xff0000; // Rot als Fallback
    
    // Erstelle einen physikalischen Kreis mit der aktuellen Theme-Farbe
    this.gameObject = this.scene.add.circle(this.x, this.y, this.radius, safeColor);
    // Aktiviere die Physik für die Blase
    this.scene.physics.add.existing(this.gameObject, false);
    
    // Setze die Kollisionsbox und Physik-Parameter korrekt
    this.gameObject.body.setCircle(this.radius);
    this.gameObject.body.setCollideWorldBounds(false); // Wir handhaben das manuell
    this.gameObject.body.setBounce(0, 0); // Kein Abprallen standardmäßig
    this.gameObject.body.setFrictionX(0); // Keine Reibung in X-Richtung
    this.gameObject.body.setFrictionY(0); // Keine Reibung in Y-Richtung
    this.gameObject.body.setMaxVelocity(600, 600);  // Geschwindigkeitsbegrenzung für Stabilität
    this.gameObject.body.setDrag(0.98);  // Minimaler Luftwiderstand
    
    // Speichere eine Referenz auf diese Bubble im GameObject für einfachere Rückverfolgung
    this.gameObject.parentBubble = this;
    
    // Optional: Einen Rand hinzufügen, um die Bubbles besser zu unterscheiden
    this.gameObject.setStrokeStyle(1, 0x000000, 0.8);
    
    // Setze die Geschwindigkeit auf 0 um zu verhindern, dass die Blase fällt
    this.gameObject.body.setVelocity(0, 0);
    
    // Für statische Bubbles, setze sie als unbeweglich
    if (this !== this.scene.shootingBubble) {
      this.gameObject.body.setImmovable(true);
    }
    
    // Speichere eine Referenz auf die Bubble-Instanz im GameObject
    return this.gameObject;
  }

  // Methode zum Aktualisieren der visuellen Farbe (für Theme-Wechsel)
  updateVisualColor() {
    if (this.gameObject) {
      this.gameObject.setFillStyle(this.color);
    }
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
        // Synchronisiere den Body mit dem GameObject (falls die Methode existiert)
        if (typeof this.gameObject.body.updateFromGameObject === 'function') {
          this.gameObject.body.updateFromGameObject();
        }
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
