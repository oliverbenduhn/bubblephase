import * as Phaser from 'phaser';

export class MobileOptimization {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      minButtonSize: 44, // Minimale Buttongröße für Touch (Apple HIG Standard)
      maxButtonSize: 88, // Maximale Buttongröße
      hapticFeedback: true, // Ob haptisches Feedback aktiviert sein soll
      showTouchControls: true, // Ob Touch-Steuerelemente angezeigt werden sollen
      controlsOpacity: 0.3, // Grundopazität der Steuerelemente
      activeOpacity: 0.6, // Opazität bei Berührung
      animationDuration: 150, // Dauer der Übergangsanimationen in ms
      touchThrottle: 16, // Touch-Event Throttling in ms (≈60fps)
      safeAreaInsets: { // Sichere Bereiche für moderne Mobilgeräte
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
    this.updateSafeArea();
    this.setupTouchControls();
    this.monitorScreenSize();
  }

  /**
   * Aktualisiert die Safe Area Insets basierend auf dem Environment
   */
  updateSafeArea() {
    if ('env' in window && window.env.getEnv) {
      const env = window.env.getEnv();
      this.config.safeAreaInsets = {
        top: env.safe_area_inset_top || 0,
        right: env.safe_area_inset_right || 0,
        bottom: env.safe_area_inset_bottom || 0,
        left: env.safe_area_inset_left || 0
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
   * Berechnet die optimale Buttongröße basierend auf der Bildschirmgröße
   */
  calculateButtonSize() {
    const screenMin = Math.min(this.scene.width, this.scene.height);
    let size = screenMin * 0.12; // Reduziert von 0.15 auf 0.12 für mittlere Bildschirme
    
    // Begrenzen auf Min/Max
    size = Math.max(size, this.config.minButtonSize);
    size = Math.min(size, this.config.maxButtonSize);
    
    return size;
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
          .on('pointerover', () => this.handleButtonOver(button))
          .on('pointerout', () => this.handleButtonOut(button))
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
   * Event-Handler für Button-Hover
   */
  handleButtonOver(button) {
    this.scene.tweens.add({
      targets: button,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: this.config.animationDuration / 2
    });
    button.setStrokeStyle(3, 0xffffff, this.config.controlsOpacity * 1.2)
          .setFillStyle(0xffffff, this.config.controlsOpacity * 0.7);
  }

  /**
   * Event-Handler für Button-Out
   */
  handleButtonOut(button) {
    this.scene.tweens.add({
      targets: button,
      scaleX: 1,
      scaleY: 1,
      duration: this.config.animationDuration / 2
    });
    button.setStrokeStyle(3, 0xffffff, this.config.controlsOpacity)
          .setFillStyle(0xffffff, this.config.controlsOpacity * 0.5);
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
    const angle = Phaser.Math.Angle.Between(
      this.scene.width / 2, this.scene.height,
      pointer.x, pointer.y
    );
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
   * Passt die UI-Elemente an die Bildschirmgröße an
   */
  resize(width, height) {
    if (!this.touchControls) return;

    const safeWidth = width - this.config.safeAreaInsets.left - this.config.safeAreaInsets.right;
    const safeHeight = height - this.config.safeAreaInsets.top - this.config.safeAreaInsets.bottom;
    const buttonSize = this.calculateButtonSize();

    const positions = {
      left: {
        x: this.config.safeAreaInsets.left + buttonSize,
        y: height - this.config.safeAreaInsets.bottom - buttonSize
      },
      right: {
        x: width - this.config.safeAreaInsets.right - buttonSize,
        y: height - this.config.safeAreaInsets.bottom - buttonSize
      },
      shoot: {
        x: width / 2,
        y: height - this.config.safeAreaInsets.bottom - buttonSize
      }
    };

    Object.entries(this.touchControls).forEach(([type, button]) => {
      const pos = positions[type];
      this.scene.tweens.add({
        targets: button,
        x: pos.x,
        y: pos.y,
        scale: buttonSize / this.config.minButtonSize,
        duration: this.config.animationDuration,
        ease: 'Power2'
      });
    });

    this.touchOverlay
      .setPosition(this.config.safeAreaInsets.left, this.config.safeAreaInsets.top)
      .setSize(safeWidth, safeHeight * 0.8);
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
}
