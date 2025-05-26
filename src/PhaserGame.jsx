import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Grid } from './Grid';
import { Shooter } from './Shooter';
import { Bubble } from './Bubble';
import { ColorGroup } from './ColorGroup';
import { MobileOptimization } from './MobileOptimization';
import { TouchMenu } from './TouchMenu'; // Import TouchMenu
import { Collision } from './Collision'; // Import Collision for findNearestEmptyCell
import { BubbleDebug } from './BubbleDebug'; // Import BubbleDebug for visual diagnostics
import { getCurrentTheme, switchColorTheme, COLOR_THEMES, getAvailableColorIds, BUBBLE_RADIUS } from './config'; // Importiere Config-Funktionen
import GameState from './GameState'; // Import GameState for checkGameOver
import bubbleParticlePath from './assets/bubble-particle.svg'; // Importiere den Pfad zum Asset

// Debug-Flag und Logging-Funktion
const DEBUG = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true';
const log = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.grid = null;
        this.cannon = null;
        this.nextBubbleDisplay = null;
        this.nextBubble = null;
        this.shootingBubble = null;
        this.canShoot = true;
        this.aimLine = null;
        this.shooter = null;
        this.scoreText = null;
        this.score = 0;
        this.level = 1;
        this.isAttaching = false; // Verhindert mehrfache Bubble-Attachment
        this.MIN_GROUP_SIZE = 3; // Mindestgröße für eine Gruppe gleichfarbiger Bubbles
        this.INITIAL_ROWS = 6; // Anzahl der Reihen, die zu Beginn mit Bubbles gefüllt werden
        this.INITIAL_COLOR_COUNT = 4; // Anzahl der verschiedenen Farben zu Beginn
        this.GAME_OVER_LINE_OFFSET = 150; // Abstand der Game Over Linie von unten
        
        // GameState für Game Over Check
        this.gameState = new GameState();
        
        // Spielzustände
        this.gameStates = {
            START: 'start',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.gameStates.PLAYING;
        this.gameOverText = null;
        this.restartButton = null;
        
        // Game Over Bedingung - wie weit das Grid nach unten reichen darf
        this.gameOverLine = null;
        this.gameOverY = 0; // Wird in create() gesetzt
        
        // Anzeige für Touch-Steuerung
        this.touchIndicator = null;
        this.touchMenu = null;
        this.isMobile = false;
        
        // Mobile Optimierung - wird in create() initialisiert
        this.mobileOptimization = null;
        
        // Hintergrund-Grafik für Theme-Wechsel
        this.backgroundGradient = null;
        
        // Debug-System für Bubble-Attachment
        this.bubbleDebug = null;
        
        // Debug-Flag für ersten Schuss
        this.hasShot = false;
        
        // Verhindere sofortiges Game Over in den ersten Sekunden
        this.gameStartTime = 0;
        this.GAME_OVER_PROTECTION_TIME = 3000; // 3 Sekunden Schutz
    }

    addScore(points) {
        this.score += points;
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }

    // Methode zum Entfernen von Bubbles und Punkte hinzufügen
    removeBubblesAndAddScore(bubbles) {
        if (!bubbles || bubbles.length === 0) return;
        // Beispiel: Punkte = Anzahl der entfernten Bubbles * 10
        const points = bubbles.length * 10;
        bubbles.forEach((bubble) => {
            if (bubble && bubble.destroy) {
                bubble.destroy();
            }
        });
        this.addScore(points);
    }

    preload() {
        // Lade das Partikel-Asset über den importierten Pfad
        this.load.image('bubble', bubbleParticlePath);
    }

    setupBackground() {
        // Hole das aktuelle Theme, um den passenden Hintergrund zu erstellen
        const currentTheme = getCurrentTheme();
        const themeKey = currentTheme.themeKey;
        const background = COLOR_THEMES[themeKey].background;
        
        // Erstelle Farbverlauf-Hintergrund basierend auf dem aktuellen Theme
        this.backgroundGradient = this.add.graphics();
        this.backgroundGradient.fillGradientStyle(
            background.from, background.to, // Von Startfarbe zu Endfarbe
            background.from, background.to, // Schräger Verlauf
            0.8 // Alpha-Wert für leichte Transparenz
        );
        this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);
        this.backgroundGradient.setDepth(-10); // Hinter allem anderen
    }

    setupGrid() {
        // Mobile-optimierte Konstanten
        this.BUBBLE_RADIUS = 15; // Wird später neu berechnet
        this.INITIAL_ROWS = 6;
        this.GAME_OVER_LINE_OFFSET = 120;
        
        // Berechne Grid-Parameter - Exakt 12 Kugeln pro Reihe
        const gridRows = 12; // Maximal 12 Reihen für Game Over
        const gridCols = 12; // Fest auf 12 Kugeln pro Reihe gesetzt
        
        // Berechnung der verfügbaren Breite mit minimalem Padding
        const padding = 10;
        const availableWidth = this.scale.width - (2 * padding);
        
        // Berechne die optimale Bubble-Größe basierend auf verfügbarer Breite
        const bubbleDiameter = availableWidth / gridCols;
        this.BUBBLE_RADIUS = Math.floor(bubbleDiameter / 2);
        
        // Stelle sicher, dass der Radius nicht zu klein wird
        const minRadius = 8;
        this.BUBBLE_RADIUS = Math.max(this.BUBBLE_RADIUS, minRadius);
        
        // Zentriere das Grid horizontal
        const totalGridWidth = gridCols * (this.BUBBLE_RADIUS * 2);
        const xOffset = (this.scale.width - totalGridWidth) / 2;
        const yOffset = 30;
        
        // Initialisiere das Spielraster mit korrekten Parametern
        this.grid = new Grid(this, gridRows, gridCols, xOffset, yOffset, this.BUBBLE_RADIUS);
    }

    setupCannon() {
        // Berechne zentrale Position für die Kanone
        const cannonY = this.scale.height - 60;
        const cannonX = this.scale.width / 2;
        
        // Erstelle die Kanone an der berechneten Position - größer und besser sichtbar
        this.cannon = this.add.circle(cannonX, cannonY, this.BUBBLE_RADIUS * 1.2, 0x444444);
        this.cannon.setStrokeStyle(2, 0x666666);
        this.cannon.setDepth(10);
        
        // Erstelle die Ziellinie mit angepasster Transparenz
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(12);
        
        // Initialisiere den Shooter mit korrekten Parametern
        this.shooter = new Shooter(this, cannonX, cannonY);
        // Setze die Geschwindigkeit separat
        this.shooter.bubbleSpeed = 800;
    }

    setupUI() {
        // Score-Text unten links anzeigen (über der Anleitung)
        this.scoreText = this.add.text(10, this.scale.height - 60, 'Score: 0', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.scoreText.setDepth(10);
        
        // Game Over Linie basierend auf Grid-Position - Reihe 11 wie gewünscht
        // Setze die Game Over Linie auf Reihe 11 (0-basiert, also Index 10) - ursprüngliche Position
        const gameOverRowPosition = this.grid.gridToPixel(10, 0); // 11. Reihe (0-basiert, also Index 10)
        this.gameOverY = gameOverRowPosition.y + this.BUBBLE_RADIUS; // Unterhalb der 11. Reihe
        
        console.log(`🎯 Game Over Linie gesetzt auf Y: ${this.gameOverY} (Reihe 11)`);
        console.log(`📊 Start-Bubbles reichen bis ca. Y: ${this.grid.gridToPixel(this.INITIAL_ROWS - 1, 0).y + this.BUBBLE_RADIUS}`);
        
        this.gameOverLine = this.add.graphics();
        this.gameOverLine.lineStyle(2, 0xff0000, 0.5);
        this.gameOverLine.lineBetween(0, this.gameOverY, this.scale.width, this.gameOverY);
        this.gameOverLine.setDepth(1);
        
        // Spiel-Anweisungen unten links anzeigen (unter dem Score)
        this.add.text(10, this.scale.height - 30, 'Ziele und schieße! 3+ gleiche Farben = Punkte', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setDepth(10);
        
        // Color Theme Button unten rechts
        this.createColorThemeButton();
    }

    setupInputHandlers() {
        // Touch-basierte Steuerung: Zielen und beim Loslassen schießen
        this.isAiming = false;
        this.aimStartTime = 0;
        
        this.input.on('pointerdown', (pointer) => {
            if (this.canShoot && this.currentState === this.gameStates.PLAYING) {
                this.isAiming = true;
                this.aimStartTime = pointer.time;
                this.updateAim(pointer.x, pointer.y);
                this.aimLine.setVisible(true);
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isAiming && this.currentState === this.gameStates.PLAYING) {
                this.updateAim(pointer.x, pointer.y);
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (this.isAiming && this.canShoot && this.currentState === this.gameStates.PLAYING) {
                // Mindest-Zielzeit von 100ms um versehentliche Schüsse zu vermeiden
                const aimDuration = pointer.time - this.aimStartTime;
                if (aimDuration > 100) {
                    // Berechne den Winkel zwischen Kanone und Zielpunkt
                    const angle = Phaser.Math.Angle.Between(
                        this.cannon.x,
                        this.cannon.y,
                        pointer.x,
                        pointer.y
                    );
    
                    const limitedAngle = this.clampAimAngle(angle);
                    this.shootBubble(limitedAngle);
                }
                this.isAiming = false;
                this.aimLine.setVisible(false);
            }
        });
        
        // Handle Touch-Cancel (wenn der Finger den Bildschirm verlässt)
        this.input.on('pointercancel', () => {
            this.isAiming = false;
            this.aimLine.setVisible(false);
        });

        // Event Listener für orientationchange hinzufügen
        this.game.events.on('orientationchange', (isPortrait) => {
            this.adjustLayoutForOrientation(isPortrait);
        });
        
        // 🐛 DEBUG: Keyboard-Handler für Debug-Funktionen
        if (DEBUG) {
            this.input.keyboard.on('keydown-D', () => {
                if (this.bubbleDebug) {
                    this.bubbleDebug.debugMode = !this.bubbleDebug.debugMode;
                    console.log('🐛 Debug-Visualisierung:', this.bubbleDebug.debugMode ? 'AKTIVIERT' : 'DEAKTIVIERT');
                }
            });
            
            this.input.keyboard.on('keydown-G', () => {
                if (this.bubbleDebug) {
                    this.bubbleDebug.showGrid = !this.bubbleDebug.showGrid;
                    this.bubbleDebug.drawGrid();
                    console.log('🐛 Grid-Visualisierung:', this.bubbleDebug.showGrid ? 'AKTIVIERT' : 'DEAKTIVIERT');
                }
            });
        }
    }

    setupMobileOptimization() {
        // Initialisiere Mobile-Optimierung
        this.mobileOptimization = new MobileOptimization(this, {
            showTouchControls: true,
            trajectoryOpacity: 0.5,
            uiScale: 0.8
        });
        
        // Initialisiere Touch-Menü
        this.touchMenu = new TouchMenu(this, 0.8);
    }

    initializeGameplay() {
        // Setze Game Start Zeit für Game Over Schutz
        this.gameStartTime = this.time.now;
        console.log("🎮 Spiel gestartet - Game Over Schutz für 3 Sekunden aktiv");
        
        // Fülle das Grid mit initialen Bubbles
        this.initializeGrid();
        
        // Initialisiere ColorGroup für Match-Prüfungen
        this.colorGroup = new ColorGroup(this.grid);
        
        // Lade die erste Bubble in die Kanone
        this.loadNextBubbleToCannon();
    }

    create() {
        // Initialisiere das Spiel durch Aufruf der organisierten Helper-Methoden
        this.setupBackground();
        this.setupGrid();
        this.setupCannon();
        this.setupUI();
        this.setupMobileOptimization();
        this.setupInputHandlers();
        this.initializeGameplay();
        
        // Initialisiere Debug-System für Bubble-Attachment
        this.bubbleDebug = new BubbleDebug(this);
    }

    initializeGrid() {
        console.log("🎯 === GRID INITIALISIERUNG GESTARTET ===");
        
        // Verwende die Grid-eigene Methode zur Initialisierung mit Bubbles
        this.grid.initializeWithBubbles(this.INITIAL_ROWS);
        
        // 🔍 SOFORTIGE DEBUG-AUSGABE nach Grid-Initialisierung
        console.log("📊 === GRID INITIALISIERUNG ABGESCHLOSSEN ===");
        
        // Zähle Bubbles im Grid
        let totalBubbles = 0;
        let bubblesWithGameObjects = 0;
        
        this.grid.forEachBubble((bubble) => {
            totalBubbles++;
            if (bubble && bubble.gameObject) {
                bubblesWithGameObjects++;
            }
        });
        
        console.log(`📊 Grid Statistiken:`);
        console.log(`- Total Bubbles: ${totalBubbles}`);
        console.log(`- Bubbles mit gameObjects: ${bubblesWithGameObjects}`);
        console.log(`- Bubbles ohne gameObjects: ${totalBubbles - bubblesWithGameObjects}`);
        
        // Teste getAllBubbleObjects sofort
        const bubbleObjects = this.grid.getAllBubbleObjects();
        console.log(`🎯 getAllBubbleObjects() Ergebnis: ${bubbleObjects.length} Objekte`);
        
        if (bubbleObjects.length === 0) {
            console.log("❌ KRITISCHES PROBLEM: getAllBubbleObjects() gibt leeres Array zurück!");
            console.log("🔧 Analysiere erste 5 Bubbles:");
            
            let count = 0;
            this.grid.forEachBubble((bubble, row, col) => {
                if (count < 5) {
                    console.log(`Bubble[${row}][${col}]:`, {
                        exists: !!bubble,
                        hasGameObject: !!bubble?.gameObject,
                        x: bubble?.x,
                        y: bubble?.y,
                        gameObjectExists: !!bubble?.gameObject
                    });
                    count++;
                }
            });
        } else {
            console.log("✅ getAllBubbleObjects() funktioniert korrekt");
        }
        
        // 🔍 SOFORTIGE GAME OVER PRÜFUNG nach Grid-Initialisierung
        console.log("🔍 Prüfe Game Over Status nach Grid-Initialisierung...");
        const immediateGameOverCheck = this.checkGameOver();
        if (immediateGameOverCheck) {
            console.log("❌ KRITISCH: Game Over direkt nach Grid-Initialisierung!");
            console.log("🔧 Die Game Over Linie ist zu hoch gesetzt oder Grid-Bubbles sind zu tief!");
        } else {
            console.log("✅ Kein sofortiges Game Over - Grid-Initialisierung OK");
        }
    }

    clampAimAngle(angleInRadians) { // NEW METHOD
        // Normalize angle to be between -PI and PI
        let normalizedAngleRad = Phaser.Math.Angle.Normalize(angleInRadians);
        let angleDeg = Phaser.Math.RadToDeg(normalizedAngleRad);

        const MIN_SHOOT_ANGLE_DEG = -160; // Nicht zu weit nach links (fast nach unten)
        const MAX_SHOOT_ANGLE_DEG = -20;  // Nicht zu weit nach rechts (fast nach unten)

        let finalAngleRad = normalizedAngleRad;

        // Winkel auf erlaubten Bereich begrenzen
        // This logic ensures the bubble is shot upwards within a defined cone.
        if (angleDeg > MAX_SHOOT_ANGLE_DEG && angleDeg < 90) { // Angle is too far "right" (e.g., -10 deg) or downwards-right
            finalAngleRad = Phaser.Math.DegToRad(MAX_SHOOT_ANGLE_DEG);
        } else if (angleDeg < MIN_SHOOT_ANGLE_DEG && angleDeg > -270) { 
            // After normalization, angleDeg is in (-180, 180].
            // So, `angleDeg > -270` is always true if `angleDeg < MIN_SHOOT_ANGLE_DEG` (e.g. -170).
            // This clamps angles too far "left" (e.g., -170 deg) or downwards-left.
            finalAngleRad = Phaser.Math.DegToRad(MIN_SHOOT_ANGLE_DEG);
        }
        return finalAngleRad;
    }

    // Erstelle Color Theme Button unten rechts
    createColorThemeButton() {
        const buttonWidth = 80;
        const buttonHeight = 35;
        const padding = 10;
        
        const buttonX = this.scale.width - buttonWidth - padding;
        const buttonY = this.scale.height - buttonHeight - padding;
        
        // Button-Hintergrund
        this.colorThemeButton = this.add.graphics();
        this.colorThemeButton.fillStyle(0x444444, 0.8);
        this.colorThemeButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        this.colorThemeButton.lineStyle(2, 0x666666, 1);
        this.colorThemeButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        this.colorThemeButton.setDepth(20);
        
        // Button-Text
        const currentTheme = getCurrentTheme();
        this.colorThemeText = this.add.text(buttonX + buttonWidth/2, buttonY + buttonHeight/2, currentTheme.themeName, {
            fontSize: '10px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(21);
        
        // Mache Button interaktiv
        const buttonZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0)
            .setInteractive()
            .setDepth(22);
            
        buttonZone.on('pointerdown', () => {
            this.switchColorTheme();
        });
        
        // Only add hover effects on non-mobile devices
        if (!this.mobileOptimization || !this.mobileOptimization.isMobile) {
            buttonZone.on('pointerover', () => {
                this.colorThemeButton.clear();
                this.colorThemeButton.fillStyle(0x555555, 0.9);
                this.colorThemeButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.colorThemeButton.lineStyle(2, 0x888888, 1);
                this.colorThemeButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            });
            
            buttonZone.on('pointerout', () => {
                this.colorThemeButton.clear();
                this.colorThemeButton.fillStyle(0x444444, 0.8);
                this.colorThemeButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.colorThemeButton.lineStyle(2, 0x666666, 1);
                this.colorThemeButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            });
        }
        
        this.colorThemeButtonZone = buttonZone;
    }

    // Wechsle das Farbthema
    switchColorTheme() {
        const newTheme = switchColorTheme();
        const themeKey = newTheme.themeKey;
        
        // Aktualisiere Button-Text
        this.colorThemeText.setText(newTheme.themeName);
        
        // Aktualisiere alle existierenden Bubbles im Grid mit neuen Farben
        this.updateGridColors();
        
        // Aktualisiere die Shooting Bubble und Next Bubble
        this.updateShootingBubbleColors();
        
        // Aktualisiere den Hintergrundgradienten
        if (this.backgroundGradient) {
            // Lösche den alten Gradienten
            this.backgroundGradient.clear();
            
            // Hole die Farbwerte aus dem aktuellen Theme
            const background = COLOR_THEMES[themeKey].background;
            
            // Zeichne neuen Gradienten
            this.backgroundGradient.fillGradientStyle(
                background.from, background.to,
                background.from, background.to,
                0.8
            );
            this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);
        }
        
        log(`🎨 Farbthema gewechselt zu: ${newTheme.themeName}`);
    }

    // Aktualisiere Farben aller Bubbles im Grid
    updateGridColors() {
        if (!this.grid) return;
        
        this.grid.forEachBubble((bubble, row, col) => {
            if (bubble && bubble.gameObject) {
                // Bubbles haben jetzt logische Farb-IDs - einfach visuelle Farbe aktualisieren
                bubble.updateVisualColor();
            }
        });
    }

    // Aktualisiere Shooting Bubble und Next Bubble Farben
    updateShootingBubbleColors() {
        // Shooting Bubble aktualisieren
        if (this.shootingBubble && this.shootingBubble.gameObject) {
            this.shootingBubble.updateVisualColor();
        }
        
        // Next Bubble aktualisieren
        if (this.nextBubbleDisplay && this.nextBubbleDisplay.gameObject) {
            this.nextBubbleDisplay.updateVisualColor();
        }
    }

    // Bereite die nächste Blase vor (intelligente Farbauswahl)
    prepareNextBubble() {
        // Sammle alle verfügbaren Farb-IDs aus dem aktuellen Grid
        const gridColorIds = new Set();
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const bubble = this.grid.getBubble(row, col);
                if (bubble) {
                    gridColorIds.add(bubble.colorId);
                }
            }
        }

        // Verwende verfügbare Farb-IDs
        const availableColorIds = getAvailableColorIds();
        
        // Wenn keine Bubbles mehr im Grid sind, verwende alle verfügbaren Farb-IDs
        const selectableColorIds = gridColorIds.size > 0 ? Array.from(gridColorIds) : availableColorIds;
        
        // Füge gelegentlich neue Farb-IDs hinzu für Abwechslung (30% Chance)
        if (Math.random() < 0.3 && gridColorIds.size > 0) {
            const newColorId = availableColorIds[Math.floor(Math.random() * availableColorIds.length)];
            selectableColorIds.push(newColorId);
        }

        const randomColorId = selectableColorIds[Math.floor(Math.random() * selectableColorIds.length)];
        this.nextBubble = new Bubble(this, 0, 0, this.BUBBLE_RADIUS, randomColorId);
    }

    // Lade die vorbereitete Blase in die Kanone
    loadNextBubbleToCannon() {
        // Stelle sicher, dass this.nextBubble existiert
        if (!this.nextBubble) {
            this.prepareNextBubble();
        }

        if (!this.nextBubble) {
            console.error("Failed to create nextBubble!");
            return;
        }

        const cannonX = this.cannon.x;
        const cannonY = this.cannon.y;
        
        // Aktuelle Blase zum Schießen vorbereiten
        this.shootingBubble = this.nextBubble;
        
        this.shootingBubble.setPosition(cannonX, cannonY);
        const gameObject = this.shootingBubble.draw();
        
        // Setze höhere Tiefe für bessere Sichtbarkeit
        if (this.shootingBubble.gameObject) {
            this.shootingBubble.gameObject.setDepth(15);
        }
        
        // Physik für die Bubble aktivieren aber bewegungslos machen bis zum Schuss
        if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
            this.shootingBubble.gameObject.body.setVelocity(0, 0);
            this.shootingBubble.gameObject.body.setImmovable(false); // Kann bewegt werden beim Schuss
        }
        
        // Nächste Blase vorbereiten und anzeigen (rechts von der Schuss-Kugel mit kleinem Abstand)
        this.prepareNextBubble();
        if (this.nextBubbleDisplay) {
            this.nextBubbleDisplay.destroy();
        }
        
        // Position rechts von der Kanone mit kleinem Abstand (etwa 3x Bubble-Radius)
        const nextBubbleX = cannonX + (this.BUBBLE_RADIUS * 3);
        const nextBubbleY = cannonY;
        
        this.nextBubbleDisplay = new Bubble(this, nextBubbleX, nextBubbleY, this.BUBBLE_RADIUS * 0.8, this.nextBubble.colorId);
        this.nextBubbleDisplay.draw();
        
        // Setze höhere Tiefe für Next Bubble Display
        if (this.nextBubbleDisplay.gameObject) {
            this.nextBubbleDisplay.gameObject.setDepth(15);
        }
        
        // Physik für die Vorschau-Bubble deaktivieren
        if (this.nextBubbleDisplay.gameObject && this.nextBubbleDisplay.gameObject.body) {
            this.nextBubbleDisplay.gameObject.body.setVelocity(0, 0);
            this.nextBubbleDisplay.gameObject.body.setImmovable(true);
        }
        
        this.canShoot = true;
    }

    // Methode zum Schießen der Blase
    shootBubble(angle) {
        if (!this.canShoot || !this.shootingBubble || this.currentState !== this.gameStates.PLAYING) {
            log("❌ Cannot shoot:", { canShoot: this.canShoot, hasShootingBubble: !!this.shootingBubble, state: this.currentState });
            return;
        }
        
        log("🚀 Shooting bubble at angle:", angle, "from position:", this.shootingBubble.x, this.shootingBubble.y);
        
        // 🔍 ERSTE SCHUSS DEBUG: Ausführliche Diagnose beim ersten Schuss
        if (!this.hasShot) {
            this.hasShot = true;
            log("🎯 === FIRST SHOT DIAGNOSIS ===");
            
            if (this.bubbleDebug && DEBUG) {
                const gridAnalysis = this.bubbleDebug.analyzeGridBubbleObjects(this.grid);
                log("📊 Grid Analysis:", gridAnalysis);
                
                if (gridAnalysis.totalBubbles > 0 && gridAnalysis.allBubbleObjectsCount === 0) {
                    log("🚨 CRITICAL ISSUE DETECTED: Grid has bubbles but no gameObjects!");
                    log("🔧 Attempting emergency repair...");
                    
                    this.grid.forEachBubble((bubble, row, col) => {
                        if (bubble && !bubble.gameObject) {
                            const success = bubble.draw();
                            log(`🚑 Emergency repair at (${row}, ${col}): ${success ? "SUCCESS" : "FAILED"}`);
                        }
                    });
                    
                    // Re-analyze after repair
                    const postRepairAnalysis = this.bubbleDebug.analyzeGridBubbleObjects(this.grid);
                    log("📊 Post-Repair Analysis:", postRepairAnalysis);
                }
            }
        }
        
        this.canShoot = false;
        this.aimLine.setVisible(false); // Verstecke die Ziellinie während des Schusses
        
        // Verstecke auch die erweiterte Trajektorien-Hilfe
        if (this.mobileOptimization) {
            this.mobileOptimization.hideTrajectoryHelper();
        }
        
        // Verwende die Shooter-Geschwindigkeit für bessere Konsistenz
        const speed = this.shooter ? this.shooter.bubbleSpeed : 800;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        log("💨 Setting velocity:", { velocityX, velocityY, speed });
        
        // Physik für die schießende Blase aktivieren
        if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
            this.shootingBubble.gameObject.body.setImmovable(false);
            this.shootingBubble.gameObject.body.setVelocity(velocityX, velocityY);
            log("✅ Bubble physics activated and velocity set");
            
            // DEBUG: Überwache die Kugelbewegung für 3 Sekunden
            let frameCount = 0;
            const movementCheck = this.time.addEvent({
                delay: 16, // 60 FPS
                repeat: 180, // 3 Sekunden bei 60 FPS
                callback: () => {
                    frameCount++;
                    if (this.shootingBubble && this.shootingBubble.gameObject) {
                        const pos = this.shootingBubble.gameObject;
                        const vel = pos.body ? pos.body.velocity : { x: 0, y: 0 };
                        if (frameCount % 30 === 0) { // Jede halbe Sekunde loggen
                            log(`🏃‍♂️ Frame ${frameCount}: Position (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) Velocity (${vel.x.toFixed(1)}, ${vel.y.toFixed(1)})`);
                        }
                    } else {
                        movementCheck.destroy();
                    }
                }
            });
        }
        
        // Collision detection hinzufügen
        this.setupCollisionDetection();
    }
    
    setupCollisionDetection() {
        if (!this.shootingBubble || !this.shootingBubble.gameObject) {
            log("No shooting bubble for collision detection");
            return;
        }
        
        log("Setting up collision detection for bubble at:", this.shootingBubble.x, this.shootingBubble.y);
        
        // 🔍 DEBUG: Analysiere Grid-Kollisionssystem BEVOR Setup
        if (this.bubbleDebug && DEBUG) {
            this.bubbleDebug.debugGridCollisionSetup(this.shootingBubble, this.grid);
        }
        
        // Entferne alle existierenden Kollisions-Detektoren für diese Bubble
        if (this.collider) {
            this.collider.destroy();
            this.collider = null;
        }
        
        // Aktualisiere alle Bubbles im Grid, um sicherzustellen, dass sie ein gameObject haben
        let recreatedCount = 0;
        this.grid.forEachBubble((bubble, row, col) => {
            if (!bubble.gameObject) {
                bubble.draw();
                recreatedCount++;
                log(`🎯 Recreated missing gameObject for bubble at (${row}, ${col}) with colorId ${bubble.colorId}`);
            }
        });
        
        if (recreatedCount > 0) {
            log(`🔧 Recreated ${recreatedCount} missing gameObjects`);
        }
        
        // Kollision mit Grid-Bubbles prüfen
        const gridBubbles = this.grid.getAllBubbleObjects();
        log("Grid bubbles found for collision:", gridBubbles.length);
        
        // Deaktiviere Phaser's eigenes Overlap-System um Konflikte zu vermeiden
        // Unser optimiertes manuelles System in update() ist ausreichend
        log("🔧 Skipping Phaser overlap collision setup - using manual collision detection in update()");
        
        // Kollision mit Weltgrenzen aktivieren - aber angepasst an Grid-Bereich
        this.shootingBubble.gameObject.body.setCollideWorldBounds(true);
        this.shootingBubble.gameObject.body.setBounce(1, 0); // Horizontale Reflexion
        
        // Angepasste Weltgrenzen: obere Grenze sollte bei Grid-yOffset liegen
        const gridTopY = this.grid.yOffset;
        
        // 🔧 WICHTIG: Setze die Weltgrenzen dynamisch für diese Bubble
        // Phaser's Weltgrenzen sind global, aber wir können den Body anpassen
        const originalWorldBounds = this.physics.world.bounds;
        log("🌍 Original world bounds:", originalWorldBounds);
        log("🌍 Grid top Y:", gridTopY);
        
        // Überschreibe die obere Grenze temporär für diese Bubble
        this.physics.world.setBounds(0, gridTopY, this.scale.width, this.scale.height - gridTopY);
        
        // Event für Grenzenkollision
        this.shootingBubble.gameObject.body.onWorldBounds = true;
        
        // Entferne vorherige worldbounds Event-Listener um doppelte Aufrufe zu vermeiden
        this.physics.world.off('worldbounds');
        
        this.physics.world.on('worldbounds', (event, body) => {
            if (body === this.shootingBubble.gameObject.body) {
                log("🌍 World boundary collision:", event);
                log("🌍 Bubble position when hitting boundary:", body.x, body.y);
                log("🌍 Grid top boundary:", gridTopY);
                
                // Wenn die Bubble die obere Grenze erreicht ODER sehr nah am Grid ist
                if (event.up || body.y <= gridTopY + this.BUBBLE_RADIUS) {
                    log("🔝 Bubble hit top boundary or reached grid area - attaching to grid");
                    this.attachBubbleToGrid();
                }
                // Wenn die Bubble seitlich die Grenze erreicht, einfach reflektieren
                // Wenn die Bubble nach unten verloren geht, zurücksetzen
                if (event.down) {
                    log("⬇️ Bubble verloren - falle nach unten");
                    if (this.shootingBubble) {
                        this.shootingBubble.destroy();
                        this.shootingBubble = null;
                    }
                    // Lade eine neue Bubble in die Kanone
                    if (this.currentState === this.gameStates.PLAYING) {
                        this.loadNextBubbleToCannon();
                    }
                }
            }
        });
    }
    
    handleBubbleCollision(shootingBubble, gridBubbleGameObject) {
        try {
            log("DEBUG: isAttaching at very start of handleBubbleCollision:", this.isAttaching);
            // Verhindere mehrfache Aufrufe der Kollisionsbehandlung
            if (this.isAttaching) {
                log("⚠️ Already attaching bubble, ignoring duplicate collision");
                return;
            }

            this.isAttaching = true;
            log("🟡 Bubble collision detected! Stopping movement and attaching to grid");
            log("🎯 Collision at bubble position:", shootingBubble.x, shootingBubble.y);
            log("🎯 Hit grid bubble game object at:", gridBubbleGameObject.x, gridBubbleGameObject.y);

            // 🐛 DEBUG-VISUALISIERUNG der Kollision
            if (this.bubbleDebug && DEBUG) {
                this.bubbleDebug.drawCollisionArea(shootingBubble.x, shootingBubble.y, gridBubbleGameObject.x, gridBubbleGameObject.y);
                this.bubbleDebug.logAttachmentDetails(shootingBubble, gridBubbleGameObject, "COLLISION");
            }

            // Entferne SOFORT alle Kollisionsdetektoren um weitere Kollisionen zu verhindern
            if (this.collider) {
                this.collider.destroy();
                this.collider = null;
            }

            // Stoppe die Bewegung der schießenden Bubble SOFORT
            if (shootingBubble.gameObject && shootingBubble.gameObject.body) {
                // 🐛 DEBUG: Analysiere Physik vor dem Stoppen
                if (this.bubbleDebug && DEBUG) {
                    this.bubbleDebug.analyzePhysicsState(shootingBubble, "VOR_STOPP");
                    this.bubbleDebug.trackBubbleMovement(shootingBubble, "KOLLISION_ERKANNT");
                }
                
                shootingBubble.gameObject.body.setVelocity(0, 0);
                shootingBubble.gameObject.body.setImmovable(true);
                shootingBubble.gameObject.body.enable = false; // Deaktiviere Physik komplett
                log("Bubble movement stopped immediately");
                
                // 🐛 DEBUG: Analysiere Physik nach dem Stoppen
                if (this.bubbleDebug && DEBUG) {
                    this.bubbleDebug.analyzePhysicsState(shootingBubble, "NACH_STOPP");
                }
            }
            
            // Speichere die Kollisionsposition für bessere Platzierung
            this.collisionPosition = { x: shootingBubble.gameObject.x, y: shootingBubble.gameObject.y };
            
            // Befestige die Bubble SOFORT am Grid ohne weitere Prüfungen
            log("🔧 Attaching bubble immediately to grid");
            this.attachBubbleToGrid();
            
            // Bereinige die Kollisionsposition nach dem Anhängen
            this.collisionPosition = null;
            this.isAttaching = false; // Reset the flag immediately after attachment attempt

        } catch (error) {
            console.error("❌ Error in handleBubbleCollision:", error);
            this.isAttaching = false; // Ensure flag is reset on error
        }
    }
    
    attachBubbleToGrid() {
        if (!this.shootingBubble) {
            console.log("❌ No shooting bubble to attach");
            // The isAttaching flag is now reset in handleBubbleCollision, so no need to reset here.
            return;
        }

        console.log("🟢 Attaching bubble to grid - Current position:", this.shootingBubble.x, this.shootingBubble.y);
        
        // 🐛 AKTIVIERE DEBUG-VISUALISIERUNG und PERFORMANCE-TRACKING
        if (this.bubbleDebug && DEBUG) {
            this.bubbleDebug.startPerformanceTrace("BUBBLE_ATTACHMENT");
            this.bubbleDebug.trackBubbleMovement(this.shootingBubble, "ATTACHMENT_START");
            this.bubbleDebug.debugAttachment(this.shootingBubble, this.grid, this.collisionPosition);
        }
        
        // Use precise collision position if available
        const pos = this.collisionPosition || { x: this.shootingBubble.x, y: this.shootingBubble.y };
        
        // 🐛 DEBUG: Zusätzliche Info für oberste Kante
        if (this.bubbleDebug && DEBUG) {
            const gridTopY = this.grid.yOffset;
            const isNearTop = pos.y <= gridTopY + this.BUBBLE_RADIUS * 2;
            console.log("🔍 ATTACHMENT DEBUG:", {
                bubblePos: pos,
                gridTopY: gridTopY,
                isNearTop: isNearTop,
                hasCollisionPos: !!this.collisionPosition,
                hasForcedCell: !!this.forcedCell
            });
        }
        
        // Wähle erzwungene Zelle falls durch Kollision definiert, sonst finde die beste freie Position
        let nearestCell = null;
        if (this.forcedCell) {
            nearestCell = this.forcedCell;
        } else {
            nearestCell = Collision.findNearestEmptyCell(this.grid, pos);
        }
        // Clear forcedCell nach Verwendung
        this.forcedCell = null;

        if (nearestCell) {
            console.log("🎯 Found nearest cell:", nearestCell);
            
            // 🐛 DEBUG: Zeige Andock-Position vor der Bewegung
            if (this.bubbleDebug && DEBUG) {
                const targetPixelPos = this.grid.gridToPixel(nearestCell.row, nearestCell.col);
                this.bubbleDebug.highlightAttachmentPosition(nearestCell.row, nearestCell.col, targetPixelPos);
                console.log("🔍 DEBUG - Bubble vor Positionierung:", { x: this.shootingBubble.x, y: this.shootingBubble.y });
                console.log("🔍 DEBUG - Ziel-Position:", targetPixelPos);
            }
            
            // Stoppe jegliche Bewegung der Bubble BEVOR wir sie positionieren
            if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
                this.shootingBubble.gameObject.body.setVelocity(0, 0);
                this.shootingBubble.gameObject.body.setImmovable(true);
                console.log("✅ Bubble movement completely stopped");
            }

            // Berechne die korrekte Pixel-Position für die Grid-Position
            const targetPixelPos = this.grid.gridToPixel(nearestCell.row, nearestCell.col);
            console.log("📍 Target pixel position:", targetPixelPos);
            
            // 🐛 DEBUG: Performance-Tracking für Positionierung
            if (this.bubbleDebug && DEBUG) {
                this.bubbleDebug.startPerformanceTrace("BUBBLE_POSITIONING");
                this.bubbleDebug.trackBubbleMovement(this.shootingBubble, "VOR_POSITIONIERUNG");
            }
            
            // Setze die Bubble-Position direkt
            this.shootingBubble.setPosition(targetPixelPos.x, targetPixelPos.y);
            
            // 🐛 DEBUG: Überwache Position NACH dem Setzen
            if (this.bubbleDebug && DEBUG) {
                this.bubbleDebug.trackBubbleMovement(this.shootingBubble, "NACH_POSITIONIERUNG");
                console.log("🔍 DEBUG - Bubble nach setPosition():", { x: this.shootingBubble.x, y: this.shootingBubble.y });
                
                // Multi-Frame Tracking für "Hüpfen"-Detektion
                for (let frame = 1; frame <= 5; frame++) {
                    this.time.delayedCall(16 * frame, () => {
                        if (this.shootingBubble) {
                            this.bubbleDebug.trackBubbleMovement(this.shootingBubble, `FRAME_${frame}`);
                            if (frame === 5) {
                                this.bubbleDebug.endPerformanceTrace("BUBBLE_POSITIONING");
                            }
                        }
                    });
                }
            }
            
            // Zeichne die Bubble an ihrer neuen Position im Grid
            this.shootingBubble.draw(); 
            console.log("🎯 Bubble positioned and drawn manually at:", this.shootingBubble.x, this.shootingBubble.y);
            
            // Füge die Bubble zum Grid hinzu
            if (this.grid.isValidGridPosition(nearestCell.row, nearestCell.col)) {
                this.grid.grid[nearestCell.row][nearestCell.col] = this.shootingBubble;
                console.log("✅ Bubble added to grid at:", nearestCell.row, nearestCell.col);
                
                // Deaktiviere Physik komplett, nachdem die Bubble im Grid ist
                if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
                    this.shootingBubble.gameObject.body.enable = false; 
                    console.log("✅ Bubble physics completely disabled after grid attachment");
                }

                // Überprüfe, ob die Bubble tatsächlich im Grid ist
                const verifyBubble = this.grid.getBubble(nearestCell.row, nearestCell.col);
                console.log("🔍 Verification - Bubble in grid:", !!verifyBubble, verifyBubble?.color);
            }
            
            // Prüfe auf Matches
            console.log("🔄 Checking for matches...");
            this.checkForMatches(nearestCell.row, nearestCell.col);
            
            // Bereite nächsten Schuss vor, nachdem alle Match-Prüfungen abgeschlossen sind
            this.shootingBubble = null;
            console.log("🔄 Preparing next bubble...");
            
            // 🐛 DEBUG: Performance-Tracking beenden
            if (this.bubbleDebug && DEBUG) {
                this.bubbleDebug.endPerformanceTrace("BUBBLE_ATTACHMENT");
            }
            
            // 🔧 Weltgrenzen zurücksetzen auf ursprüngliche Werte
            this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
            
            if (this.currentState === this.gameStates.PLAYING) {
                this.loadNextBubbleToCannon();
            }
            // The isAttaching flag is now reset in handleBubbleCollision, so no need to reset here.
        } else {
            // Fallback: Entferne die Blase, wenn keine Position gefunden wurde
            console.warn("❌ Keine freie Position gefunden für Bubble");
            if (this.shootingBubble && this.shootingBubble.gameObject) {
                this.shootingBubble.destroy();
            }
            // Bereite nächsten Schuss vor
            this.shootingBubble = null;
            if (this.currentState === this.gameStates.PLAYING) {
                this.loadNextBubbleToCannon();
            }
        }
    }
    
    checkForMatches(row, col) {
        if (!this.colorGroup) return;
        
        // Finde und entferne Gruppen gleicher Farbe (mindestens 3)
        const removedBubbles = this.colorGroup.findAndRemoveGroup(row, col, this.MIN_GROUP_SIZE);
        
        if (removedBubbles.length > 0) {
            // Berechne Punkte basierend auf der Anzahl entfernter Bubbles
            const points = removedBubbles.length * 10;
            // Bonus für größere Gruppen
            if (removedBubbles.length >= 5) {
                this.score += points * 2; // Doppelte Punkte für große Gruppen
            } else {
                this.score += points;
            }
            
            // Score-Anzeige aktualisieren
            this.scoreText.setText(`Score: ${this.score}`);
            
            // Visuelles Feedback für entfernte Bubbles
            this.showScorePopup(points, removedBubbles.length);
            
            console.log(`Entfernt: ${removedBubbles.length} Bubbles, Punkte: ${points}`);
        }
        
        // Prüfe Game Over nach jedem Schuss
        // Wichtig: Hier NICHT mehr die nächste Bubble laden, das erledigt jetzt attachBubbleToGrid
        this.checkGameOver();
    }

    // Zeige Score-Popup für visuelles Feedback
    showScorePopup(points, bubbleCount) {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        
        // Text erstellen
        const scoreText = this.add.text(gameWidth / 2, gameHeight / 2, `+${points}`, {
            fontSize: '32px',
            fill: bubbleCount >= 5 ? '#ffff00' : '#00ff00', // Gelb für große Gruppen, Grün für normale
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);

        // Animation: Fade out und nach oben bewegen
        this.tweens.add({
            targets: scoreText,
            y: scoreText.y - 100,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }

    // Game Over Prüfung - verwendet GameState für die Logik
    checkGameOver() {
        if (this.currentState === this.gameStates.GAME_OVER) {
            return true;
        }
        
        // 🛡️ GAME OVER SCHUTZ: Verhindere Game Over in den ersten 3 Sekunden
        const timeSinceStart = this.time.now - this.gameStartTime;
        if (timeSinceStart < this.GAME_OVER_PROTECTION_TIME) {
            if (DEBUG) {
                console.log(`🛡️ Game Over Schutz aktiv: ${(this.GAME_OVER_PROTECTION_TIME - timeSinceStart).toFixed(0)}ms verbleibend`);
            }
            return false;
        }

        // Sammle alle Bubbles aus dem Grid
        const allBubbles = [];
        let lowestBubbleY = 0;
        
        this.grid.forEachBubble((bubble, row, col) => {
            if (bubble) {
                const bubbleBottomY = bubble.y + (bubble.radius || BUBBLE_RADIUS);
                allBubbles.push({
                    y: bubble.y,
                    radius: bubble.radius || BUBBLE_RADIUS,
                    x: bubble.x,
                    row: row,
                    col: col
                });
                
                // Finde die tiefste Bubble
                if (bubbleBottomY > lowestBubbleY) {
                    lowestBubbleY = bubbleBottomY;
                }
            }
        });

        // Verwende GameState für Game Over Check
        const fieldHeight = this.gameOverY;
        
        // 🔍 DEBUG: Game Over Check Details
        if (DEBUG && allBubbles.length > 0) {
            console.log(`🔍 Game Over Check: Tiefste Bubble Y: ${lowestBubbleY.toFixed(1)}, Game Over Linie: ${fieldHeight.toFixed(1)}, Abstand: ${(fieldHeight - lowestBubbleY).toFixed(1)}`);
        }
        
        const isGameOver = this.gameState.checkGameOver(allBubbles, fieldHeight);

        if (isGameOver && this.currentState !== this.gameStates.GAME_OVER) {
            console.log(`🚨 GAME OVER ausgelöst! Tiefste Bubble: ${lowestBubbleY}, Game Over Linie: ${fieldHeight}`);
            this.handleGameOver();
        }

        return isGameOver;
    }

    // Behandelt den Game Over Zustand
    handleGameOver() {
        console.log('🚨 GAME OVER!');
        this.currentState = this.gameStates.GAME_OVER;
        this.canShoot = false;
        this.aimLine.setVisible(false);

        // Game Over Text anzeigen
        if (!this.gameOverText) {
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'GAME OVER', {
                fontSize: '32px',
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5).setDepth(100);

            // Final Score anzeigen
            const finalScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 10, `Final Score: ${this.score}`, {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5).setDepth(100);

            // Restart Button
            const buttonWidth = 150;
            const buttonHeight = 50;
            const buttonX = this.scale.width / 2 - buttonWidth / 2;
            const buttonY = this.scale.height / 2 + 60;

            const restartButton = this.add.graphics();
            restartButton.fillStyle(0x4CAF50, 1);
            restartButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
            restartButton.setDepth(100);

            const restartText = this.add.text(this.scale.width / 2, buttonY + buttonHeight / 2, 'RESTART', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(101);

            const restartZone = this.add.zone(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth, buttonHeight);
            restartZone.setInteractive();
            restartZone.on('pointerdown', () => {
                this.restartGame();
            });
        }
    }

    // Restart das Spiel
    restartGame() {
        // Entferne Game Over UI
        if (this.gameOverText) {
            this.gameOverText.destroy();
            this.gameOverText = null;
        }

        // 🛡️ Game Over Schutz-Zeitpunkt neu setzen
        this.gameStartTime = this.time.now;
        console.log("🎮 Spiel gestartet - Game Over Schutz für 3 Sekunden aktiv (Restart)");

        // Reset GameState
        this.gameState.restartGame(() => {
            this.initializeGrid();
        });

        // Reset Spielvariablen
        this.score = 0;
        this.scoreText.setText('Score: 0');
        this.currentState = this.gameStates.PLAYING;
        this.canShoot = true;

        // Bereite neue Bubble vor
        this.loadNextBubbleToCannon();
    }

    // Simuliert die komplette Trajektorie mit Kollisionen und Wandabpraller
    simulateTrajectory(startX, startY, angle, maxBounces = 3, timeStep = 1/60, maxTime = 3) {
        const bubbleSpeed = this.shooter ? this.shooter.bubbleSpeed : 800;
        let currentX = startX;
        let currentY = startY;
        let velocityX = bubbleSpeed * Math.cos(angle);
        let velocityY = bubbleSpeed * Math.sin(angle);
        
        const trajectory = [{ x: currentX, y: currentY }];
        let bounces = 0;
        let totalTime = 0;
        
        while (totalTime < maxTime && bounces <= maxBounces) {
            // Kleine Zeitschritte für präzise Simulation
            currentX += velocityX * timeStep;
            currentY += velocityY * timeStep;
            totalTime += timeStep;
            
            // Prüfe Wandkollisionen
            let collisionDetected = false;
            
            // Linke Wand
            if (currentX - BUBBLE_RADIUS <= 0) {
                currentX = BUBBLE_RADIUS;
                velocityX = -velocityX;
                bounces++;
                collisionDetected = true;
            }
            // Rechte Wand
            else if (currentX + BUBBLE_RADIUS >= this.scale.width) {
                currentX = this.scale.width - BUBBLE_RADIUS;
                velocityX = -velocityX;
                bounces++;
                collisionDetected = true;
            }
            
            // Obere Wand
            if (currentY - BUBBLE_RADIUS <= this.grid.yOffset) {
                // Stoppe bei oberer Grenze
                break;
            }
            
            // Prüfe Grid-Kollisionen
            if (this.grid) {
                let gridCollision = false;
                
                // Teste Kollision mit vorhandenen Bubbles
                this.grid.forEachBubble((bubble, row, col) => {
                    if (bubble) {
                        const dx = currentX - bubble.x;
                        const dy = currentY - bubble.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= BUBBLE_RADIUS * 2) {
                            gridCollision = true;
                            return; // Stoppe bei erster Kollision
                        }
                    }
                });
                
                if (gridCollision) {
                    break;
                }
            }
            
            // Füge Punkt zur Trajektorie hinzu (alle paar Schritte für Performance)
            if (trajectory.length === 1 || totalTime % (timeStep * 3) < timeStep) {
                trajectory.push({ x: currentX, y: currentY });
            }
        }
        
        return trajectory;
    }

    // Methode zum Aktualisieren der Ziellinie mit erweiterter Kollisionssimulation
    updateAim(pointerX, pointerY) {
        if (!this.aimLine || !this.cannon) return;

        // Berechne den Winkel zwischen Kanone und Zielpunkt
        const angle = Phaser.Math.Angle.Between(
            this.cannon.x,
            this.cannon.y,
            pointerX,
            pointerY
        );

        // Winkelbegrenzung implementieren
        // Konvertiere in Grad für bessere Lesbarkeit
        let angleInDegrees = Phaser.Math.RadToDeg(angle);
        
        // Normalisiere den Winkel auf Bereich -180 bis 180
        if (angleInDegrees > 180) angleInDegrees -= 360;
        
        // In Phaser ist -90 Grad nach oben, 0 Grad nach rechts, 90 Grad nach unten
        // Begrenzungen: Nicht nach unten (-20 bis -160) und nicht direkt seitlich (-70 bis -110)
        const MIN_ANGLE = -160; // Nicht zu weit nach rechts (fast nach unten)
        const MAX_ANGLE = -20;  // Nicht zu weit nach links (fast nach unten)
        
        // Winkel auf erlaubten Bereich begrenzen
        let limitedAngle = angle;
        if (angleInDegrees > MAX_ANGLE && angleInDegrees < 90) {
            limitedAngle = Phaser.Math.DegToRad(MAX_ANGLE);
        } else if (angleInDegrees < MIN_ANGLE && angleInDegrees > -270) {
            limitedAngle = Phaser.Math.DegToRad(MIN_ANGLE);
        }
        
        // Simuliere die realistische Trajektorie mit dem begrenzten Winkel
        const trajectory = this.simulateTrajectory(this.cannon.x, this.cannon.y, limitedAngle);

        // Ziellinie mit besserem visuellen Feedback
        this.aimLine.clear();
        
        // Zeichne die simulierte Trajektorie als dünne Linie mit vielen Punkten
        if (trajectory.length > 1) {
            if (this.isAiming) {
                // Dünne, helle Linie beim aktiven Zielen
                this.aimLine.lineStyle(1.5, 0x00ff00, 0.8);
            } else {
                // Sehr dünne Linie beim Hover
                this.aimLine.lineStyle(1, 0xffffff, 0.5);
            }
            
            // Zeichne die Trajektorie als verbundene Linie
            this.aimLine.beginPath();
            this.aimLine.moveTo(trajectory[0].x, trajectory[0].y);
            
            for (let i = 1; i < trajectory.length; i++) {
                this.aimLine.lineTo(trajectory[i].x, trajectory[i].y);
            }
            
            this.aimLine.strokePath();
            
            // Zusätzlich: Zeichne kleine Punkte entlang der Trajektorie für bessere Sichtbarkeit
            if (this.isAiming) {
                for (let i = 0; i < trajectory.length; i += 5) {
                    const point = trajectory[i];
                    this.aimLine.fillStyle(0x00ff00, 0.8);
                    this.aimLine.fillCircle(point.x, point.y, 3);
                }
            }
        }
    }

    update(time, delta) {
        super.update(time, delta);
        
        // 🔍 DEBUG: Kontinuierliche Grid-Überwachung (alle 2 Sekunden)
        if (this.bubbleDebug && DEBUG && time - (this.lastGridCheck || 0) > 2000) {
            this.lastGridCheck = time;
            const gridAnalysis = this.bubbleDebug.analyzeGridBubbleObjects(this.grid);
            
            if (gridAnalysis.totalBubbles > 0 && gridAnalysis.allBubbleObjectsCount === 0) {
                console.error("⚠️ CONTINUOUS CHECK: Grid has bubbles but getAllBubbleObjects() returns 0!");
                console.log("🔧 Attempting to fix by calling draw() on all bubbles...");
                
                this.grid.forEachBubble((bubble, row, col) => {
                    if (bubble && !bubble.gameObject) {
                        bubble.draw();
                        console.log(`🔧 Fixed missing gameObject at (${row}, ${col})`);
                    }
                });
            }
        }
        
        // 🎯 OPTIMIERTE ANTI-TUNNELING KOLLISIONSPRÜFUNG
        // Einfachere, aber effektivere Lösung für schnelle Bubbles
        if (this.shootingBubble && this.shootingBubble.gameObject && !this.isAttaching) {
            const bubblePos = this.shootingBubble.gameObject;
            const bubbleRadius = this.BUBBLE_RADIUS;
            
            let collisionDetected = false;
            let collidingBubble = null;
            
            // Prüfe Kollision mit allen Grid-Bubbles mit optimiertem Threshold
            this.grid.forEachBubble((gridBubble, row, col) => {
                if (gridBubble && gridBubble.gameObject && !collisionDetected) {
                    const dx = bubblePos.x - gridBubble.gameObject.x;
                    const dy = bubblePos.y - gridBubble.gameObject.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Verwende größeren Kollisionsradius für frühere Erkennung
                    const collisionThreshold = bubbleRadius * 2.2; // Etwas größer für bessere Erkennung
                    
                    if (distance <= collisionThreshold) {
                        collisionDetected = true;
                        collidingBubble = gridBubble;
                        log("🔴 OPTIMIZED collision detected!", {
                            shootingPos: { x: bubblePos.x.toFixed(1), y: bubblePos.y.toFixed(1) },
                            gridPos: { x: gridBubble.gameObject.x.toFixed(1), y: gridBubble.gameObject.y.toFixed(1) },
                            distance: distance.toFixed(2),
                            threshold: collisionThreshold.toFixed(2)
                        });
                    }
                }
            });
            
            if (collisionDetected && collidingBubble) {
                log("🎯 Optimized collision handling triggered");
                this.handleBubbleCollision(this.shootingBubble, collidingBubble.gameObject);
            } else {
                // Prüfe obere Grenze nur wenn keine Grid-Kollision erkannt wurde
                const gridTopY = this.grid.yOffset;
                if (bubblePos.y <= gridTopY + bubbleRadius) {
                    log("🔝 Bubble reached top boundary - attaching");
                    this.attachBubbleToGrid();
                }
            }
        }
        
        // Aktualisiere den Shooter (falls benötigt)
        if (this.shooter) {
            this.shooter.update(delta);
        }
        
        // Debug-Info: Zeige aktuelle Spielzustände und Position der schießenden Blase
        if (DEBUG) {
            this.debugDisplay();
        }
    }
    
    debugDisplay() {
        if (!this.shootingBubble) return;
        
        const debugText = `State: ${this.currentState}\n` +
                          `ShootingBubble: (${this.shootingBubble.x.toFixed(0)}, ${this.shootingBubble.y.toFixed(0)})\n` +
                          `Velocity: (${this.shootingBubble.gameObject.body.velocity.x.toFixed(2)}, ${this.shootingBubble.gameObject.body.velocity.y.toFixed(2)})\n` +
                          `IsAttaching: ${this.isAttaching}`;
        
        // Aktualisiere oder erstelle das Debug-Textfeld
        if (!this.debugTextField) {
            this.debugTextField = this.add.text(10, 10, debugText, {
                fontSize: '14px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setDepth(100);
        } else {
            this.debugTextField.setText(debugText);
        }
    }
}

// Hauptspielkonfiguration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: BootScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// React-Komponente für das Phaser-Spiel
const PhaserGameComponent = () => {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);

    useEffect(() => {
        // Erstelle das Spiel nur, wenn es noch nicht existiert
        if (!phaserGameRef.current && gameRef.current) {
            // Erstelle eine Kopie der Config mit dem Parent-Element
            const gameConfig = {
                ...config,
                parent: gameRef.current
            };
            
            phaserGameRef.current = new Phaser.Game(gameConfig);
        }

        return () => {
            // Cleanup beim Unmount
            if (phaserGameRef.current && !phaserGameRef.current.isDestroyed) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
        };
    }, []);

    return <div ref={gameRef} style={{ width: '100%', height: '100%' }} />;
};

export default PhaserGameComponent;
export { BootScene }; // Exportiere BootScene als benannten Export für Tests
