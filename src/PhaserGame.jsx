import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { Grid } from './Grid';
import { Bubble } from './Bubble'; // Geändert von 'import Bubble from "./Bubble";'
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { MobileOptimization } from './MobileOptimization';
import { TouchMenu } from './TouchMenu';
import { BUBBLE_RADIUS, BUBBLE_COLORS } from './config'; // Annahme, dass config.js existiert oder diese hier definiert sind
import bubbleParticlePath from './assets/bubble-particle.svg'; // SVG importieren

// Eine einfache, leere Phaser-Szene
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
        this.MIN_GROUP_SIZE = 3; // Mindestgröße für eine Gruppe gleichfarbiger Bubbles
        
        // Spielzustände
        this.gameStates = {
            START: 'start',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.gameStates.START;
        this.gameOverText = null;
        this.restartButton = null;
        
        // Game Over Bedingung - wie weit das Grid nach unten reichen darf
        this.gameOverLine = null;
        this.gameOverY = 0; // Wird in create() gesetzt
        
        // Anzeige für Touch-Steuerung
        this.touchIndicator = null;
        this.touchMenu = null;
        this.isMobile = false;
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

    create() {
        console.log('BootScene create');
        this.add.text(10, 10, 'Bubble Shooter!', { fill: '#0f0', fontSize: '24px' });

        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Prüfen, ob wir auf einem mobilen Gerät sind
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Orientierung für das Layout bestimmen
        const isPortrait = this.sys.game.isPortrait !== undefined ? 
                           this.sys.game.isPortrait : 
                           (gameHeight > gameWidth);
        
        // Event Listener für Orientierungsänderungen
        this.sys.game.events.on('orientationchange', (isPortrait) => {
            this.adjustLayoutForOrientation(isPortrait);
        });

        // Grid nur initialisieren, aber noch nicht füllen
        const gridRows = 12;
        const gridCols = Math.floor((gameWidth - 40) / (BUBBLE_RADIUS * 2));
        const xOffset = (gameWidth - (gridCols * BUBBLE_RADIUS * 2)) / 2;
        const yOffset = 50;

        this.grid = new Grid(this, gridRows, gridCols, xOffset, yOffset);

        // Game Over Linie definieren (wird erst später sichtbar)
        const rowHeight = BUBBLE_RADIUS * Math.sqrt(3);
        this.gameOverY = this.grid.yOffset + (this.grid.rows * rowHeight) + rowHeight / 2;
        
        this.gameOverLine = this.add.line(
            0, this.gameOverY,
            0, 0,
            gameWidth, 0,
            0xff0000, 1
        );
        this.gameOverLine.setOrigin(0, 0);
        this.gameOverLine.setLineWidth(4);
        this.gameOverLine.setVisible(false);

        // Kanone initialisieren
        const cannonX = gameWidth / 2;
        const cannonY = gameHeight - 60;
        this.cannon = this.add.circle(cannonX, cannonY, BUBBLE_RADIUS + 2, 0xcccccc);
        this.cannon.setStrokeStyle(2, 0x999999);
        this.cannonPointer = this.add.line(0,0, cannonX, cannonY, cannonX, cannonY - BUBBLE_RADIUS, 0x999999, 1);
        this.cannonPointer.setLineWidth(4,2);

        // Shooter initialisieren
        this.shooter = new Shooter(this, cannonX, cannonY);

        // Ziellinie initialisieren (unsichtbar bis Spielstart)
        this.aimLine = this.add.line(cannonX, cannonY, 0, 0, 0, -70, 0xffffff, 0.5);
        this.aimLine.setOrigin(0,0);
        this.aimLine.setVisible(false);
        this.aimLine.setLineWidth(3);

        // Start-Button erstellen
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = gameWidth / 2 - buttonWidth / 2;
        const buttonY = gameHeight / 2 - buttonHeight / 2;
        
        // Button Hintergrund
        const buttonGraphics = this.add.graphics();
        buttonGraphics.fillStyle(0x4CAF50, 1);
        buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        
        // Button Text
        const buttonText = this.add.text(gameWidth / 2, gameHeight / 2, 'Starten', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        buttonText.setOrigin(0.5);
        
        // Interaktiver Bereich
        const buttonZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight);
        buttonZone.setInteractive();
        buttonZone.on('pointerover', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x3e8e41, 1);
            buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        });
        buttonZone.on('pointerout', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x4CAF50, 1);
            buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        });
        buttonZone.on('pointerdown', () => {
            this.startGame();
        });
        
        this.startButton = { graphics: buttonGraphics, text: buttonText, zone: buttonZone };

        // Score-Anzeige
        this.scoreText = this.add.text(10, 50, `Score: ${this.score}`, {
            fontSize: '20px',
            fill: '#fff'
        }).setDepth(10);

        // Anzeige für die nächste Bubble
        this.add.text(gameWidth - 150, gameHeight - 80, 'Next:', { 
            fill: '#fff',
            fontSize: '18px' 
        });
        this.nextBubbleDisplay = new Bubble(this, gameWidth - 80, gameHeight - 80, BUBBLE_RADIUS, BUBBLE_COLORS.RED); 
        this.nextBubbleDisplay.draw();

        // Erste Bubbles vorbereiten
        this.prepareNextBubble();
        this.loadNextBubbleToCannon();

        // Optimierte Input Listener für Desktop und Mobile
        this.input.on('pointermove', (pointer) => {
            if (this.currentState === this.gameStates.PLAYING && this.canShoot) {
                // Aktualisiere die Ziellinie nur, wenn der Pointer oberhalb der Kanone ist
                if (pointer.y < this.cannon.y) {
                    this.updateAim(pointer.x, pointer.y);
                    this.aimLine.setVisible(true);
                } else {
                    this.aimLine.setVisible(false);
                }
            }
        });
    }
}
