import * as Phaser from 'phaser';

export class MobileOptimization {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      minButtonSize: 48, // Erhöht für bessere Touch-Zugänglichkeit (WCAG Standard)
      maxButtonSize: 96, // Größere maximale Größe für Tablets
      hapticFeedback: true,
      showTouchControls: true,
      controlsOpacity: 0.4, // Leicht erhöht für bessere Sichtbarkeit
      activeOpacity: 0.8, // Deutlicheres Feedback
      animationDuration: 120, // Schnellere Animationen für responsiveres Gefühl
      touchThrottle: 16,
      minTouchSpacing: 56, // Mindestabstand zwischen Touch-Elementen
      safeAreaInsets: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      ...config
    };
    
    this.touchControls = null;
    this.isMobile = this.checkIsMobile();
    this.lastTouchTime = 0;
    this.trajectoryIndicators = [];
    this.aimHelper = null;
    
    this.updateSafeArea();
    this.setupTouchControls();
    this.monitorScreenSize();
    this.setupTrajectoryHelpers();
  }

  /**
   * Aktualisiert die Safe Area Insets basierend auf dem Environment
   */
  updateSafeArea() {
    // Prüfe auf CSS Environment Variables für Safe Areas
    if (typeof window !== 'undefined' && window.CSS && window.CSS.supports) {
      if (window.CSS.supports('padding: env(safe-area-inset-top)')) {
        // Nutze CSS Environment Variables für moderne Browser
        const style = getComputedStyle(document.documentElement);
        this.config.safeAreaInsets = {
          top: parseInt(style.getPropertyValue('--sat') || '0') || this.config.safeAreaInsets.top,
          right: parseInt(style.getPropertyValue('--sar') || '0') || this.config.safeAreaInsets.right,
          bottom: parseInt(style.getPropertyValue('--sab') || '0') || this.config.safeAreaInsets.bottom,
          left: parseInt(style.getPropertyValue('--sal') || '0') || this.config.safeAreaInsets.left
        };
      }
    }

    // Fallback für Geräte ohne env() Support
    if (!this.config.safeAreaInsets.top) {
      this.detectNotchAndSafeAreas();
    }
  }

  /**
   * Erkennt Notch und Safe Areas auf älteren Geräten
   */
  detectNotchAndSafeAreas() {
    const userAgent = navigator.userAgent;
    
    // iPhone X+ Serie Erkennung
    if (/iPhone/.test(userAgent)) {
      const screenHeight = window.screen.height;
      const screenWidth = window.screen.width;
      
      // iPhone X+ Modelle haben typischerweise diese Auflösungen
      if ((screenHeight === 812 && screenWidth === 375) ||  // iPhone X, XS
          (screenHeight === 896 && screenWidth === 414) ||  // iPhone XR, XS Max
          (screenHeight === 844 && screenWidth === 390) ||  // iPhone 12, 13
          (screenHeight === 926 && screenWidth === 428)) {  // iPhone 12 Pro Max, 13 Pro Max
        
        this.config.safeAreaInsets = {
          top: 44,
          right: 0,
          bottom: 34,
          left: 0
        };
      }
    }
    
    // Android mit Notch Erkennung (allgemeine Heuristik)
    if (/Android/.test(userAgent) && window.screen.height > 1800) {
      this.config.safeAreaInsets = {
        top: 24,
        right: 0,
        bottom: 12,
        left: 0
      };
    }
  }

  /**
   * Prüft, ob das Gerät ein mobiles Gerät ist
   */
  checkIsMobile() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
  }

  /**
   * Erstellt die Touch-Steuerelemente
   */
  setupTouchControls() {
    if (!this.isMobile || !this.config.showTouchControls) return;

    // Container für die Touch-Steuerelemente
    this.touchControls = {
      left: this.createTouchButton('left', this.scene.width * 0.1, this.scene.height * 0.9),
      right: this.createTouchButton('right', this.scene.width * 0.9, this.scene.height * 0.9),
      shoot: this.createTouchButton('shoot', this.scene.width * 0.5, this.scene.height * 0.9)
    };

    // Transparenter Overlay für Touch-Zielen
    this.touchOverlay = this.scene.add.rectangle(
      0, 0, this.scene.width, this.scene.height * 0.8,
      0xffffff, 0
    ).setOrigin(0, 0).setInteractive();

    this.setupTouchEvents();
  }

  /**
   * Berechnet die optimale Buttongröße basierend auf Bildschirmgröße und Touch-Zugänglichkeit
   */
  calculateButtonSize() {
    const screenMin = Math.min(this.scene.width, this.scene.height);
    const screenMax = Math.max(this.scene.width, this.scene.height);
    
    // Dynamische Berechnung basierend auf Bildschirmgröße und Orientierung
    let size;
    
    if (screenMin < 375) {
      // Kleine Bildschirme (iPhone SE, etc.)
      size = screenMin * 0.11;
    } else if (screenMin < 414) {
      // Standard Smartphones
      size = screenMin * 0.12;
    } else if (screenMin < 768) {
      // Große Smartphones / kleine Tablets
      size = screenMin * 0.10;
    } else {
      // Tablets
      size = screenMin * 0.08;
    }
    
    // Stelle sicher, dass Mindestabstand zwischen Buttons eingehalten wird
    const availableSpace = screenMin - (this.config.safeAreaInsets.left + this.config.safeAreaInsets.right);
    const maxButtonsPerRow = 3; // Annahme: maximal 3 Buttons nebeneinander
    const maxSizeBasedOnSpacing = (availableSpace - (this.config.minTouchSpacing * (maxButtonsPerRow + 1))) / maxButtonsPerRow;
    
    size = Math.min(size, maxSizeBasedOnSpacing);
    
    // Begrenzen auf Min/Max mit verbesserter Logik
    size = Math.max(size, this.config.minButtonSize);
    size = Math.min(size, this.config.maxButtonSize);
    
    return Math.round(size);
  }

  /**
   * Erstellt einen Touch-Button mit der Mindestgröße
   */
  createTouchButton(type, x, y) {
    const buttonSize = this.calculateButtonSize();
    const button = this.scene.add.circle(x, y, buttonSize / 2);
    
    // Grundlegendes Styling
    button.setStrokeStyle(3, 0xffffff, this.config.controlsOpacity)
          .setFillStyle(0xffffff, this.config.controlsOpacity * 0.5)
          .setInteractive()
          .on('pointerdown', () => this.handleButtonDown(button, type))
          .on('pointerup', () => this.handleButtonUp(button));

    // Button-Icon hinzufügen
    this.addButtonIcon(type, button, buttonSize);
    
    return button;
  }

  /**
   * Fügt das passende Icon zum Button hinzu
   */
  addButtonIcon(type, button, size) {
    const graphics = this.scene.add.graphics();
    const iconSize = size * 0.4;
    graphics.lineStyle(3, 0xffffff, this.config.controlsOpacity);

    switch(type) {
      case 'left': this.addLeftArrow(button, iconSize); break;
      case 'right': this.addRightArrow(button, iconSize); break;
      case 'shoot': this.addShootIcon(button, iconSize); break;
    }
  }

  /**
   * Fügt Pfeil-Links-Icon zum Button hinzu
   */
  addLeftArrow(button, size) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.beginPath();
    graphics.moveTo(button.x + size/2, button.y - size/2);
    graphics.lineTo(button.x - size/2, button.y);
    graphics.lineTo(button.x + size/2, button.y + size/2);
    graphics.strokePath();
  }

  /**
   * Fügt Pfeil-Rechts-Icon zum Button hinzu
   */
  addRightArrow(button, size) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.beginPath();
    graphics.moveTo(button.x - size/2, button.y - size/2);
    graphics.lineTo(button.x + size/2, button.y);
    graphics.lineTo(button.x - size/2, button.y + size/2);
    graphics.strokePath();
  }

  /**
   * Fügt Schuss-Icon zum Button hinzu
   */
  addShootIcon(button, size) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.beginPath();
    graphics.arc(button.x, button.y, size/2, 0, Math.PI * 2);
    graphics.strokePath();
    graphics.beginPath();
    graphics.arc(button.x, button.y, size/4, 0, Math.PI * 2);
    graphics.strokePath();
  }

  /**
   * Event-Handler für Button-Down
   */
  handleButtonDown(button, type) {
    this.scene.tweens.add({
      targets: button,
      scaleX: 0.9,
      scaleY: 0.9,
      alpha: this.config.activeOpacity,
      duration: this.config.animationDuration / 2
    });
    
    if (type === 'left' || type === 'right') {
      this.handleMove(type);
    } else if (type === 'shoot') {
      this.handleShoot();
    }
    
    this.provideFeedback();
  }

  /**
   * Event-Handler für Button-Up
   */
  handleButtonUp(button) {
    this.scene.tweens.add({
      targets: button,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: this.config.animationDuration
    });
  }

  /**
   * Richtet Touch-Event-Handler ein
   */
  setupTouchEvents() {
    if (!this.touchControls) return;

    // Touch-Overlay mit Throttling
    this.touchOverlay.on('pointermove', (pointer) => {
      const now = Date.now();
      if (pointer.isDown && now - this.lastTouchTime >= this.config.touchThrottle) {
        this.handleAiming(pointer);
        this.lastTouchTime = now;
      }
    });
  }

  /**
   * Behandelt die Bewegung des Schützen
   */
  handleMove(direction) {
    // Diese Methode sollte von der Game-Szene überschrieben werden
    this.scene.emit('mobileMove', direction);
  }

  /**
   * Behandelt das Zielen
   */
  handleAiming(pointer) {
    let angle = Phaser.Math.Angle.Between(
      this.scene.width / 2, this.scene.height,
      pointer.x, pointer.y
    );
    
    // Winkelbegrenzung implementieren (gleiche Logik wie in PhaserGame.jsx)
    // Konvertiere in Grad für bessere Lesbarkeit
    let angleInDegrees = Phaser.Math.RadToDeg(angle);
    
    // Normalisiere den Winkel auf Bereich -180 bis 180
    if (angleInDegrees > 180) angleInDegrees -= 360;
    
    // In Phaser ist -90 Grad nach oben, 0 Grad nach rechts, 90 Grad nach unten
    // Begrenzungen: Nicht nach unten (-20 bis -160) und nicht direkt seitlich (-70 bis -110)
    const MIN_ANGLE = -160; // Nicht zu weit nach rechts (fast nach unten)
    const MAX_ANGLE = -20;  // Nicht zu weit nach links (fast nach unten)
    
    // Winkel auf erlaubten Bereich begrenzen
    if (angleInDegrees > MAX_ANGLE && angleInDegrees < 90) {
        angle = Phaser.Math.DegToRad(MAX_ANGLE);
    } else if (angleInDegrees < MIN_ANGLE && angleInDegrees > -270) {
        angle = Phaser.Math.DegToRad(MIN_ANGLE);
    }
    
    // Diese Methode sollte von der Game-Szene überschrieben werden
    this.scene.emit('mobileAim', angle);
  }

  /**
   * Behandelt das Schießen
   */
  handleShoot() {
    // Diese Methode sollte von der Game-Szene überschrieben werden
    this.scene.emit('mobileShoot');
  }

  /**
   * Bietet haptisches Feedback für Touch-Interaktionen
   */
  provideFeedback() {
    if (this.config.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // 10ms Vibration für Feedback
    }
  }

  /**
   * Passt die UI-Elemente an die Bildschirmgröße und Safe Areas an
   */
  resize(width, height) {
    if (!this.touchControls) return;

    // Aktualisiere Safe Areas bei Größenänderung
    this.updateSafeArea();

    const safeWidth = width - this.config.safeAreaInsets.left - this.config.safeAreaInsets.right;
    const safeHeight = height - this.config.safeAreaInsets.top - this.config.safeAreaInsets.bottom;
    const buttonSize = this.calculateButtonSize();
    const spacing = this.config.minTouchSpacing;

    // Intelligente Button-Positionierung basierend auf Orientierung
    const isPortrait = height > width;
    let positions;

    if (isPortrait) {
      // Portrait: Buttons am unteren Rand, horizontal angeordnet
      const bottomY = height - this.config.safeAreaInsets.bottom - buttonSize - spacing;
      const centerX = width / 2;
      const buttonSpacing = buttonSize + spacing;

      positions = {
        left: {
          x: centerX - buttonSpacing,
          y: bottomY
        },
        shoot: {
          x: centerX,
          y: bottomY
        },
        right: {
          x: centerX + buttonSpacing,
          y: bottomY
        }
      };
    } else {
      // Landscape: Kompaktere Anordnung
      const rightX = width - this.config.safeAreaInsets.right - buttonSize - spacing;
      const centerY = height / 2;
      const verticalSpacing = buttonSize * 0.8;

      positions = {
        left: {
          x: this.config.safeAreaInsets.left + buttonSize + spacing,
          y: height - this.config.safeAreaInsets.bottom - buttonSize - spacing
        },
        shoot: {
          x: rightX,
          y: centerY
        },
        right: {
          x: rightX,
          y: centerY + verticalSpacing
        }
      };
    }

    // Animiere Button-Positionen mit verbesserter Easing
    Object.entries(this.touchControls).forEach(([type, button]) => {
      const pos = positions[type];
      this.scene.tweens.add({
        targets: button,
        x: pos.x,
        y: pos.y,
        scale: 1, // Konsistente Skalierung
        duration: this.config.animationDuration,
        ease: 'Back.easeOut'
      });
    });

    // Aktualisiere Touch-Overlay mit Safe Areas
    if (this.touchOverlay) {
      this.touchOverlay
        .setPosition(this.config.safeAreaInsets.left, this.config.safeAreaInsets.top)
        .setSize(safeWidth, safeHeight * 0.85); // Lasse Platz für Buttons
    }
  }

  /**
   * Passt die UI-Elemente basierend auf der Bildschirmgröße an
   */
  adjustUIElements() {
    const { width, height } = this.scene.scale;
    const isPortrait = height > width;

    // Beispiel: Anpassung der Button-Größe
    const buttonSize = Math.max(
      this.config.minButtonSize,
      Math.min(this.config.maxButtonSize, Math.min(width, height) * 0.1)
    );

    // Beispiel: Layout-Logik für Portrait- und Landscape-Modus
    // Prüfe, ob children.list existiert (für Tests)
    if (!this.scene.children || !this.scene.children.list) {
      // Im Test-Modus, keine UI-Anpassungen vornehmen
      return;
    }

    if (isPortrait) {
      this.scene.children.list.forEach((child) => {
        if (child.isButton) {
          child.setScale(buttonSize / child.width);
          child.setPosition(width / 2, height - buttonSize * 2);
        }
      });
    } else {
      this.scene.children.list.forEach((child) => {
        if (child.isButton) {
          child.setScale(buttonSize / child.width);
          child.setPosition(width - buttonSize * 2, height / 2);
        }
      });
    }
  }

  /**
   * Überwacht Änderungen der Bildschirmgröße und passt die UI an
   */
  monitorScreenSize() {
    this.scene.scale.on('resize', () => {
      this.adjustUIElements();
    });
  }

  /**
   * Zeigt oder versteckt die Touch-Steuerelemente
   */
  toggleTouchControls(show) {
    if (!this.touchControls) return;

    Object.values(this.touchControls).forEach(control => {
      this.scene.tweens.add({
        targets: control,
        alpha: show ? 1 : 0,
        duration: this.config.animationDuration,
        onComplete: () => control.setInteractive(show)
      });
    });
    this.touchOverlay.setInteractive(show);
  }

  /**
   * Entfernt die Mobile-Optimierungen
   */
  destroy() {
    if (this.touchControls) {
      Object.values(this.touchControls).forEach(control => control.destroy());
      this.touchOverlay.destroy();
    }
  }

  /**
   * Richtet erweiterte Safe Area Unterstützung ein
   */
  updateSafeArea() {
    // Prüfe auf CSS Environment Variables für Safe Areas
    if (typeof window !== 'undefined' && window.CSS && window.CSS.supports) {
      if (window.CSS.supports('padding: env(safe-area-inset-top)')) {
        // Nutze CSS Environment Variables für moderne Browser
        const style = getComputedStyle(document.documentElement);
        this.config.safeAreaInsets = {
          top: parseInt(style.getPropertyValue('--sat') || '0') || this.config.safeAreaInsets.top,
          right: parseInt(style.getPropertyValue('--sar') || '0') || this.config.safeAreaInsets.right,
          bottom: parseInt(style.getPropertyValue('--sab') || '0') || this.config.safeAreaInsets.bottom,
          left: parseInt(style.getPropertyValue('--sal') || '0') || this.config.safeAreaInsets.left
        };
      }
    }

    // Fallback für Geräte ohne env() Support
    if (!this.config.safeAreaInsets.top) {
      this.detectNotchAndSafeAreas();
    }
  }

  /**
   * Erkennt Notch und Safe Areas auf älteren Geräten
   */
  detectNotchAndSafeAreas() {
    const userAgent = navigator.userAgent;
    
    // iPhone X+ Serie Erkennung
    if (/iPhone/.test(userAgent)) {
      const screenHeight = window.screen.height;
      const screenWidth = window.screen.width;
      
      // iPhone X+ Modelle haben typischerweise diese Auflösungen
      if ((screenHeight === 812 && screenWidth === 375) ||  // iPhone X, XS
          (screenHeight === 896 && screenWidth === 414) ||  // iPhone XR, XS Max
          (screenHeight === 844 && screenWidth === 390) ||  // iPhone 12, 13
          (screenHeight === 926 && screenWidth === 428)) {  // iPhone 12 Pro Max, 13 Pro Max
        
        this.config.safeAreaInsets = {
          top: 44,
          right: 0,
          bottom: 34,
          left: 0
        };
      }
    }
    
    // Android mit Notch Erkennung (allgemeine Heuristik)
    if (/Android/.test(userAgent) && window.screen.height > 1800) {
      this.config.safeAreaInsets = {
        top: 24,
        right: 0,
        bottom: 12,
        left: 0
      };
    }
  }

  /**
   * Richtet Trajektorien-Hilfssystem ein
   */
  setupTrajectoryHelpers() {
    // Erstelle Trajektorien-Indikator für alle Geräte, aber mit unterschiedlicher Konfiguration
    this.aimHelper = this.scene.add.graphics();
    this.aimHelper.setDepth(100);
    this.aimHelper.setVisible(false);

    // Bestimme die Basis-Transparenz basierend auf Gerät
    const baseAlpha = this.config.trajectoryOpacity || (this.isMobile ? 0.7 : 0.3);
    
    // Erstelle mehrere Trajektorien-Punkte für bessere Visualisierung
    for (let i = 0; i < 8; i++) {
      const alpha = baseAlpha - (i * 0.05);
      const indicator = this.scene.add.circle(0, 0, 3, 0x00ff00, Math.max(alpha, 0.1));
      indicator.setVisible(false);
      indicator.setDepth(99);
      this.trajectoryIndicators.push(indicator);
    }
  }

  /**
   * Zeigt Trajektorien-Hilfe basierend auf Touch-Position
   */
  showTrajectoryHelper(startX, startY, targetX, targetY) {
    if (!this.aimHelper || !this.trajectoryIndicators.length) return;

    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const distance = Math.min(Phaser.Math.Distance.Between(startX, startY, targetX, targetY), 200);
    
    // Zeige Trajektorien-Punkte
    this.trajectoryIndicators.forEach((indicator, index) => {
      const progress = (index + 1) / this.trajectoryIndicators.length;
      const pointDistance = distance * progress * 0.8;
      
      const x = startX + Math.cos(angle) * pointDistance;
      const y = startY + Math.sin(angle) * pointDistance;
      
      indicator.setPosition(x, y);
      indicator.setVisible(true);
      
      // Animiere die Punkte für bessere Sichtbarkeit
      this.scene.tweens.add({
        targets: indicator,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
    });

    // Zeichne Zielkreis mit konfigurierbarer Transparenz
    this.aimHelper.clear();
    const lineAlpha = this.config.trajectoryOpacity || (this.isMobile ? 0.7 : 0.4);
    this.aimHelper.lineStyle(3, 0x00ff00, lineAlpha);
    this.aimHelper.strokeCircle(targetX, targetY, 25);
    this.aimHelper.setVisible(true);
  }

  /**
   * Versteckt alle Trajektorien-Hilfen
   */
  hideTrajectoryHelper() {
    if (this.aimHelper) {
      this.aimHelper.setVisible(false);
    }
    
    this.trajectoryIndicators.forEach(indicator => {
      indicator.setVisible(false);
    });
  }
}
