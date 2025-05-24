import * as Phaser from 'phaser';

/**
 * TouchMenu-Klasse für touch-optimierte Menüs in mobilen Spielen
 * Fügt Touch-freundliche Menüs mit Gesten-Unterstützung, Animationen und Feedback hinzu
 */
export class TouchMenu {
  /**
   * Erstellt ein neues TouchMenu
   * @param {Phaser.Scene} scene - Die Phaser-Szene, zu der das Menü gehört
   * @param {Object} config - Konfigurationsoptionen für das Menü
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      width: scene.width * 0.8,           // Menübreite relativ zur Szenenbreite
      buttonHeight: 60,                   // Höhe der Menü-Buttons
      padding: 16,                        // Innenabstand
      spacing: 20,                        // Abstand zwischen Buttons
      buttonRadius: 12,                   // Abrundung der Button-Ecken
      backgroundColor: 0x333333,          // Hintergrundfarbe
      backgroundAlpha: 0.8,               // Hintergrund-Transparenz
      buttonColor: 0x555555,              // Button-Standardfarbe
      buttonActiveColor: 0x777777,        // Button-Aktivfarbe
      textColor: '#ffffff',               // Button-Textfarbe
      textFont: 'Arial',                  // Schriftart
      textSize: 22,                       // Schriftgröße
      animationDuration: 200,             // Dauer der Animationen in ms
      buttonAnimationScale: 0.95,         // Skalierungsfaktor bei Button-Aktivierung
      swipeThreshold: 50,                 // Mindestdistanz für Swipe-Erkennung
      hapticFeedback: true,               // Haptisches Feedback aktivieren
      hideOnClose: true,                  // Menü ausblenden beim Schließen
      swipeToClose: true,                 // Ob Swipe-Geste zum Schließen erlaubt
      closeOnOutsideClick: true,          // Bei Klick außerhalb schließen
      ...config
    };

    // Menü-Container und -Elemente
    this.container = null;
    this.background = null;
    this.buttons = [];
    this.menu = {
      x: 0,
      y: 0,
      width: this.config.width,
      height: 0,
      isOpen: false
    };

    // Ereignis-Handler
    this.onOpen = null;
    this.onClose = null;
    this.onButtonClick = null;

    // Gesten-Tracking
    this.gestures = {
      startX: 0,
      startY: 0,
      isDragging: false
    };

    // Methode zur Anpassung der UI-Elemente basierend auf Bildschirmgröße und Orientierung
    this.adjustLayout = () => {
      // Sichere Fallback-Werte für Tests und unvollständige Konfigurationen
      const gameConfig = this.scene.sys?.game?.config || {};
      const width = gameConfig.width || this.scene.width || 800;
      const height = gameConfig.height || this.scene.height || 600;
      const isPortrait = height > width;

      // Verwende konfigurierbare Werte statt hardcodierte
      const buttonHeight = isPortrait ? this.config.buttonHeight * 1.33 : this.config.buttonHeight;
      const padding = this.config.padding;
      const spacing = this.config.spacing;

      this.buttons.forEach((button, index) => {
        if (isPortrait) {
          // Korrigiere Button-Eigenschaftszugriff: verwende button.rectangle statt button direkt
          button.rectangle.setPosition(padding, height - (buttonHeight + padding) * (index + 1));
          // Korrigiere Font-Größe: verwende button.text statt button.setFontSize
          button.text.setFontSize(buttonHeight / 3);
        } else {
          // Korrigiere width-Zugriff: verwende button.rectangle.width
          button.rectangle.setPosition(padding + (button.rectangle.width + spacing) * index, height - buttonHeight - padding);
          button.text.setFontSize(buttonHeight / 3);
        }
      });
    }

    // Methode zum Aktualisieren des UI-Layouts
    this.updateLayout = () => {
      this.adjustLayout();
    }

    // Event-Listener für Resize und Orientierungsänderungen hinzufügen
    if (this.scene.scale && typeof this.scene.scale.on === 'function') {
      this.scene.scale.on('resize', this.updateLayout);
    }
    
    // Orientierungsänderung Event-Listener (falls verfügbar)
    if (typeof window !== 'undefined' && window.addEventListener) {
      this.handleOrientationChange = () => {
        // Kleine Verzögerung, um sicherzustellen, dass die Größenänderung abgeschlossen ist
        setTimeout(() => {
          this.updateLayout();
        }, 100);
      };
      
      window.addEventListener('orientationchange', this.handleOrientationChange);
      window.addEventListener('resize', this.handleOrientationChange);
    }

    // Initialisierung
    this.create();
  }

  /**
   * Erstellt den Menü-Container und Hintergrund
   * @private
   */
  create() {
    // Container erstellen
    this.container = this.scene.add.container(
      this.scene.width / 2,
      this.scene.height / 2
    );
    this.container.setVisible(false);
    
    // Transparenter Overlay für Klicks außerhalb
    if (this.config.closeOnOutsideClick) {
      this.overlay = this.scene.add.rectangle(
        0, 0, this.scene.width, this.scene.height,
        0x000000, 0.3
      ).setOrigin(0, 0).setInteractive();
      this.overlay.on('pointerdown', () => this.close());
      this.container.add(this.overlay);
      this.overlay.setPosition(-this.scene.width/2, -this.scene.height/2);
    }

    // Menü-Hintergrund
    this.background = this.scene.add.rectangle(
      0, 0, this.config.width, 100,
      this.config.backgroundColor, this.config.backgroundAlpha
    );
    this.background.setOrigin(0.5, 0.5);
    this.background.setStrokeStyle(2, 0xffffff, 0.3);
    this.container.add(this.background);

    // Swipe-Handler einrichten, wenn aktiviert
    if (this.config.swipeToClose) {
      this.background.setInteractive();
      this.background.on('pointerdown', (pointer) => this.onDragStart(pointer), this);
      this.background.on('pointermove', (pointer) => this.onDragMove(pointer), this);
      this.background.on('pointerup', () => this.onDragEnd(), this);
      this.background.on('pointerout', () => this.onDragEnd(), this);
    }
  }

  /**
   * Fügt einen neuen Button zum Menü hinzu
   * @param {string} text - Text, der auf dem Button angezeigt wird
   * @param {function} callback - Funktion, die bei Klick aufgerufen wird
   * @param {Object} options - Zusätzliche Optionen für den Button
   * @returns {Object} Die erstellte Button-Instanz
   */
  addButton(text, callback, options = {}) {
    const yPos = this.buttons.length === 0 
      ? -(this.buttons.length * (this.config.buttonHeight + this.config.spacing)) 
      : this.buttons[this.buttons.length - 1].y + this.config.buttonHeight + this.config.spacing;
    
    const buttonOptions = {
      color: this.config.buttonColor,
      activeColor: this.config.buttonActiveColor,
      textColor: this.config.textColor,
      textSize: this.config.textSize,
      icon: null,
      disabled: false,
      ...options
    };

    // Button-Hintergrund
    const button = this.scene.add.rectangle(
      0, yPos,
      this.config.width - (this.config.padding * 2),
      this.config.buttonHeight,
      buttonOptions.color
    );
    button.setOrigin(0.5, 0.5);
    button.setInteractive({ useHandCursor: true });
    button.customData = { ...buttonOptions, callback };

    // Ecken abrunden durch eine Maske
    if (this.config.buttonRadius > 0) {
      const mask = this.scene.add.graphics();
      mask.fillStyle(0xffffff);
      mask.fillRoundedRect(
        button.x - button.width / 2,
        button.y - button.height / 2,
        button.width,
        button.height,
        this.config.buttonRadius
      );
      button.setMask(mask.createGeometryMask());
      this.container.add(mask);
    }

    // Button-Text
    const textObj = this.scene.add.text(
      0, yPos,
      text,
      {
        fontFamily: this.config.textFont,
        fontSize: buttonOptions.textSize,
        fill: buttonOptions.textColor,
        align: 'center'
      }
    );
    textObj.setOrigin(0.5, 0.5);

    // Icon hinzufügen, falls vorhanden
    let icon = null;
    if (buttonOptions.icon) {
      icon = this.scene.add.image(
        -button.width / 2 + 30, yPos,
        buttonOptions.icon
      );
      icon.setOrigin(0.5, 0.5);
      icon.setScale(0.5);
      this.container.add(icon);
    }

    // Event-Handler
    button.on('pointerover', () => {
      if (buttonOptions.disabled) return;
      button.setFillStyle(buttonOptions.activeColor);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: this.config.animationDuration / 2,
        ease: 'Sine.easeOut'
      });
    });

    button.on('pointerout', () => {
      if (buttonOptions.disabled) return;
      button.setFillStyle(buttonOptions.color);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: this.config.animationDuration / 2,
        ease: 'Sine.easeIn'
      });
    });

    button.on('pointerdown', () => {
      if (buttonOptions.disabled) return;
      this.scene.tweens.add({
        targets: button,
        scaleX: this.config.buttonAnimationScale,
        scaleY: this.config.buttonAnimationScale,
        duration: this.config.animationDuration / 4,
        ease: 'Sine.easeIn'
      });

      // Haptisches Feedback
      if (this.config.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(10);
      }
    });

    button.on('pointerup', () => {
      if (buttonOptions.disabled) return;
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: this.config.animationDuration / 2,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Verwende den gespeicherten callback aus customData
          if (typeof button.customData.callback === 'function') {
            button.customData.callback();
          }
          
          if (this.onButtonClick) {
            this.onButtonClick(button, text);
          }
        }
      });
    });

    // Dem Container hinzufügen
    this.container.add(button);
    this.container.add(textObj);
    
    // Speichere die Referenz
    this.buttons.push({
      rectangle: button,
      text: textObj,
      icon,
      y: yPos
    });

    // Menü-Höhe aktualisieren
    this.updateMenuHeight();
    
    return button;
  }

  /**
   * Aktualisiert die Menü-Höhe basierend auf den hinzugefügten Buttons
   * @private
   */
  updateMenuHeight() {
    if (this.buttons.length === 0) {
      this.menu.height = this.config.padding * 2;
    } else {
      const lastButton = this.buttons[this.buttons.length - 1];
      this.menu.height = (lastButton.y + this.config.buttonHeight / 2) * 2 + this.config.padding;
    }
    
    this.background.height = this.menu.height;
  }

  /**
   * Startet die Drag-Verfolgung
   * @private
   */
  onDragStart(pointer) {
    // Stellen sicher, dass this.gestures initialisiert ist
    if (!this.gestures) {
      this.gestures = {
        startX: 0,
        startY: 0,
        isDragging: false
      };
    }

    if (!pointer || typeof pointer !== 'object') {
      // Wenn kein valider Pointer übergeben wurde, benutze Standardwerte (für Tests)
      this.gestures.startX = 0;
      this.gestures.startY = 0;
    } else {
      this.gestures.startX = pointer.x;
      this.gestures.startY = pointer.y;
    }
    this.gestures.isDragging = true;
  }

  /**
   * Verfolgt die Drag-Bewegung
   * @private
   */
  onDragMove(pointer) {
    // Stellen sicher, dass this.gestures initialisiert ist
    if (!this.gestures) {
      this.gestures = {
        startX: 0,
        startY: 0,
        isDragging: false
      };
      return;
    }

    if (!this.gestures.isDragging || !pointer || typeof pointer !== 'object') return;

    const deltaY = pointer.y - this.gestures.startY;
    const deltaX = pointer.x - this.gestures.startX;

    // Vertikales Swipen
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.config.swipeThreshold) {
      if (deltaY > 0) { // Nach unten swipen = Schließen
        this.close();
      }
      this.gestures.isDragging = false;
    }
  }

  /**
   * Beendet die Drag-Verfolgung
   * @private
   */
  onDragEnd() {
    // Stellen sicher, dass this.gestures initialisiert ist
    if (!this.gestures) {
      this.gestures = {
        startX: 0,
        startY: 0,
        isDragging: false
      };
      return;
    }
    
    this.gestures.isDragging = false;
  }

  /**
   * Öffnet das Menü mit Animation
   */
  open() {
    if (this.menu.isOpen) return;
    
    this.container.setVisible(true);
    this.container.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.scene.height / 2,
      duration: this.config.animationDuration,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.menu.isOpen = true;
        if (this.onOpen) this.onOpen();
      }
    });
  }

  /**
   * Schließt das Menü mit Animation
   */
  close() {
    if (!this.menu.isOpen && !this.container.visible) return;
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.scene.height + 100,
      duration: this.config.animationDuration,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (this.config.hideOnClose) {
          this.container.setVisible(false);
        }
        this.menu.isOpen = false;
        if (this.onClose) this.onClose();
      }
    });
  }

  /**
   * Fügt ein Haupt- und Pausemenü zum Spiel hinzu
   * @param {Array} menuItems - Array von Menüeinträgen mit Text und Callback
   */
  createMainMenu(menuItems = []) {
    // Standardeinträge
    const defaultItems = [
      { text: 'Fortsetzen', callback: () => this.close() },
      { text: 'Neues Spiel', callback: () => this.scene.scene.restart() },
      { text: 'Einstellungen', callback: () => console.log('Einstellungen') }
    ];
    
    const items = menuItems.length > 0 ? menuItems : defaultItems;
    
    // Menüeinträge hinzufügen
    items.forEach(item => {
      this.addButton(item.text, item.callback, item.options);
    });
    
    // Zentriere das Menü auf dem Bildschirm
    this.container.setPosition(this.scene.width / 2, this.scene.height + 100);
  }

  /**
   * Erstellt ein Touch-optimiertes Pausemenü
   * @param {Array} menuItems - Array von Menüeinträgen
   */
  createPauseMenu(menuItems = []) {
    this.createMainMenu(menuItems);
    
    // Pausenbutton in der oberen rechten Ecke hinzufügen
    const pauseButtonSize = 44;
    const safeAreaX = this.scene.width - pauseButtonSize - 20;
    const safeAreaY = pauseButtonSize + 20;
    
    this.pauseButton = this.scene.add.circle(safeAreaX, safeAreaY, pauseButtonSize / 2);
    this.pauseButton.setStrokeStyle(3, 0xffffff, 0.8);
    this.pauseButton.setFillStyle(0x000000, 0.5);
    this.pauseButton.setInteractive({ useHandCursor: true });
    
    // Pause-Symbol
    const pauseIcon = this.scene.add.graphics();
    pauseIcon.fillStyle(0xffffff, 1);
    pauseIcon.fillRect(safeAreaX - 7, safeAreaY - 10, 5, 20);
    pauseIcon.fillRect(safeAreaX + 2, safeAreaY - 10, 5, 20);
    
    // Event-Handler
    this.pauseButton.on('pointerup', () => {
      if (this.menu.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });
    
    return this.pauseButton;
  }
  
  /**
   * Passt die Position und Größe des Menüs an die Bildschirmgröße an
   * @param {number} width - Neue Bildschirmbreite
   * @param {number} height - Neue Bildschirmhöhe
   */
  resize(width, height) {
    // Aktualisiere Menübreite basierend auf der Bildschirmorientierung
    const isPortrait = height > width;
    this.config.width = isPortrait ? width * 0.9 : width * 0.6;
    
    // Aktualisiere Button-Größen
    this.buttons.forEach((button, index) => {
      button.rectangle.width = this.config.width - (this.config.padding * 2);
      if (button.icon) {
        button.icon.x = -button.rectangle.width / 2 + 30;
      }
    });
    
    // Menühintergrund aktualisieren
    this.background.width = this.config.width;
    
    // Container neu positionieren
    this.container.setPosition(width / 2, this.menu.isOpen ? height / 2 : height + 100);
    
    // Overlay-Größe aktualisieren, falls vorhanden
    if (this.overlay) {
      this.overlay.setSize(width, height);
      this.overlay.setPosition(-width/2, -height/2);
    }
    
    // Pausenbutton neu positionieren, falls vorhanden
    if (this.pauseButton) {
      const safeAreaX = width - this.pauseButton.radius * 2 - 20;
      const safeAreaY = this.pauseButton.radius * 2 + 20;
      this.pauseButton.setPosition(safeAreaX, safeAreaY);
    }
  }

  /**
   * Gibt alle Ressourcen frei
   */
  destroy() {
    // Event-Listener entfernen
    if (this.scene.scale && typeof this.scene.scale.off === 'function') {
      this.scene.scale.off('resize', this.updateLayout);
    }
    
    if (typeof window !== 'undefined' && this.handleOrientationChange) {
      window.removeEventListener('orientationchange', this.handleOrientationChange);
      window.removeEventListener('resize', this.handleOrientationChange);
    }
    
    if (this.container) {
      this.container.destroy();
    }
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }
  }
}
