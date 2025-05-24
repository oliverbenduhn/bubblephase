/**
 * Demo-Datei für die korrigierten TouchMenu-Features
 * Zeigt die Verwendung der neuen Event-Listener und konfigurierbaren Parameter
 */

import { TouchMenu } from './TouchMenu.js';

/**
 * Demonstriert die TouchMenu-Funktionalität mit benutzerdefinierten Konfigurationen
 */
export class TouchMenuDemo {
  constructor(scene) {
    this.scene = scene;
    
    // TouchMenu mit benutzerdefinierten konfigurierbaren Parametern erstellen
    this.touchMenu = new TouchMenu(scene, {
      buttonHeight: 70,        // Größere Buttons
      padding: 20,             // Mehr Abstand
      spacing: 25,             // Größerer Abstand zwischen Buttons
      backgroundColor: 0x2c3e50,
      buttonColor: 0x3498db,
      buttonActiveColor: 0x2980b9,
      animationDuration: 300,
      textSize: 24
    });
    
    this.setupDemoMenu();
    this.demonstrateFeatures();
  }
  
  setupDemoMenu() {
    // Verschiedene Menüeinträge hinzufügen
    this.touchMenu.addButton('Neues Spiel', () => {
      console.log('Neues Spiel gestartet');
      this.simulateScreenResize();
    });
    
    this.touchMenu.addButton('Einstellungen', () => {
      console.log('Einstellungen geöffnet');
      this.simulateOrientationChange();
    });
    
    this.touchMenu.addButton('Hilfe', () => {
      console.log('Hilfe angezeigt');
      this.testLayoutAdjustment();
    });
    
    // Pausemenü erstellen
    this.pauseButton = this.touchMenu.createPauseMenu();
  }
  
  demonstrateFeatures() {
    console.log('TouchMenu Demo gestartet');
    console.log('Features:');
    console.log('- ✅ Event-Listener für Resize-Events');
    console.log('- ✅ Event-Listener für Orientierungsänderungen');
    console.log('- ✅ Konfigurierbare Parameter statt hardcodierte Werte');
    console.log('- ✅ Korrekte Button-Eigenschaftszugriffe');
    console.log('- ✅ Robuste Fehlerbehandlung für Tests');
  }
  
  simulateScreenResize() {
    console.log('Simuliere Bildschirmgrößenänderung...');
    
    // Simuliere verschiedene Bildschirmgrößen
    const sizes = [
      { width: 800, height: 600 },   // Landscape
      { width: 600, height: 800 },   // Portrait
      { width: 1200, height: 800 },  // Wide Landscape
      { width: 400, height: 700 }    // Narrow Portrait
    ];
    
    sizes.forEach((size, index) => {
      setTimeout(() => {
        console.log(`Größe ${index + 1}: ${size.width}x${size.height}`);
        this.touchMenu.resize(size.width, size.height);
        
        // updateLayout wird automatisch durch die Event-Listener aufgerufen
        this.touchMenu.updateLayout();
      }, index * 1000);
    });
  }
  
  simulateOrientationChange() {
    console.log('Simuliere Orientierungsänderung...');
    
    // Zeige, dass die adjustLayout-Methode konfigurierbare Werte verwendet
    const originalConfig = { ...this.touchMenu.config };
    
    // Ändere Konfiguration zur Laufzeit
    this.touchMenu.config.buttonHeight = 80;
    this.touchMenu.config.padding = 30;
    this.touchMenu.config.spacing = 35;
    
    console.log('Neue Konfiguration angewendet:', {
      buttonHeight: this.touchMenu.config.buttonHeight,
      padding: this.touchMenu.config.padding,
      spacing: this.touchMenu.config.spacing
    });
    
    // Layout anpassen
    this.touchMenu.adjustLayout();
    
    // Nach 3 Sekunden zurücksetzen
    setTimeout(() => {
      this.touchMenu.config = { ...this.touchMenu.config, ...originalConfig };
      this.touchMenu.adjustLayout();
      console.log('Konfiguration zurückgesetzt');
    }, 3000);
  }
  
  testLayoutAdjustment() {
    console.log('Teste Layout-Anpassung...');
    
    // Zeige, dass die Button-Eigenschaften korrekt zugegriffen werden
    console.log('Anzahl Buttons:', this.touchMenu.buttons.length);
    
    this.touchMenu.buttons.forEach((button, index) => {
      console.log(`Button ${index + 1}:`, {
        hasRectangle: !!button.rectangle,
        hasText: !!button.text,
        rectangleWidth: button.rectangle?.width,
        textContent: button.text?.text,
        yPosition: button.y
      });
    });
    
    // Teste die adjustLayout-Methode direkt
    console.log('Führe adjustLayout aus...');
    this.touchMenu.adjustLayout();
    console.log('Layout-Anpassung abgeschlossen');
  }
  
  destroy() {
    console.log('TouchMenu Demo wird zerstört...');
    
    // Die destroy-Methode entfernt automatisch alle Event-Listener
    this.touchMenu.destroy();
    
    console.log('Event-Listener wurden ordnungsgemäß entfernt');
  }
}

// Export für Tests
export default TouchMenuDemo;
