import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { MobileOptimization } from './MobileOptimization';
import { TouchMenu } from './TouchMenu';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_RADIUS, BUBBLE_COLORS } from './config';
import bubbleParticlePath from './assets/bubble-particle.svg';

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
        this.INITIAL_ROWS = 5; // Anzahl der Reihen, die zu Beginn mit Bubbles gefüllt werden
        this.INITIAL_COLOR_COUNT = 4; // Anzahl der verschiedenen Farben zu Beginn
        this.GAME_OVER_LINE_OFFSET = 150; // Abstand der Game Over Linie von unten
        
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
        // Für bessere Sichtbarkeit - subtrahiere mehr Platz an den Rändern
        const gridCols = Math.floor((gameWidth - 80) / (BUBBLE_RADIUS * 2));
        // Mehr Platz am linken Rand
        const xOffset = (gameWidth - (gridCols * BUBBLE_RADIUS * 2)) / 2;
        const yOffset = 50;

        this.grid = new Grid(this, gridRows, gridCols, xOffset, yOffset);
        
        // ColorGroup für Match-Erkennung initialisieren
        this.colorGroup = new ColorGroup(this.grid);
        
        // Fülle die ersten Reihen mit Blasen (intelligente Farbverteilung)
        const availableColors = Object.values(BUBBLE_COLORS);
        for (let row = 0; row < this.INITIAL_ROWS; row++) {
            for (let col = 0; col < gridCols; col++) {
                // Verwende eine begrenzte Anzahl von Farben für bessere Spielbarkeit
                const colorIndex = Math.floor(Math.random() * Math.min(this.INITIAL_COLOR_COUNT, availableColors.length));
                const randomColor = availableColors[colorIndex];
                const gridPos = this.grid.gridToPixel(row, col);
                const bubble = new Bubble(this, gridPos.x, gridPos.y, BUBBLE_RADIUS, randomColor);
                this.grid.addBubble(row, col, bubble);
                bubble.draw();
            }
        }

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

        // Score-Anzeige
        this.scoreText = this.add.text(10, 50, `Score: ${this.score}`, {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setDepth(10);

        // Anzeige für die nächste Bubble
        this.add.text(gameWidth - 150, gameHeight - 100, 'Next:', { 
            fill: '#fff',
            fontSize: '18px',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 1
        });

        // Spiel-Info anzeigen
        this.add.text(10, 10, 'Bubble Shooter', {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setDepth(10);

        this.add.text(10, gameHeight - 40, 'Ziele und schieße! 3+ gleiche Farben = Punkte', {
            fontSize: '14px',
            fill: '#ccc',
            fontStyle: 'italic'
        }).setDepth(10);
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

        // Schieß-Event hinzufügen - sowohl für Maus als auch Touch
        this.input.on('pointerdown', (pointer) => {
            if (this.currentState === this.gameStates.PLAYING && this.canShoot && pointer.y < this.cannon.y) {
                const angle = Phaser.Math.Angle.Between(
                    this.cannon.x,
                    this.cannon.y,
                    pointer.x,
                    pointer.y
                );
                this.shootBubble(angle);
            }
        });

        // Touch-spezifische Events für bessere mobile Unterstützung
        this.input.on('pointerup', () => {
            // Bei Touch-Geräten: Ziellinie verstecken wenn Touch beendet
            if (this.input.activePointer.isDown === false) {
                this.aimLine.setVisible(false);
            }
        });

        // Verhindere Standardverhalten bei Touch-Geräten
        this.input.manager.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.input.manager.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    // Bereite die nächste Blase vor (intelligente Farbauswahl)
    prepareNextBubble() {
        // Sammle alle verfügbaren Farben aus dem aktuellen Grid
        const gridColors = new Set();
        for (let row = 0; row < this.grid.getRows(); row++) {
            for (let col = 0; col < this.grid.getCols(); col++) {
                const bubble = this.grid.getBubble(row, col);
                if (bubble) {
                    gridColors.add(bubble.color);
                }
            }
        }

        // Wenn keine Bubbles mehr im Grid sind, verwende alle verfügbaren Farben
        const availableColors = gridColors.size > 0 ? Array.from(gridColors) : Object.values(BUBBLE_COLORS);
        
        // Füge gelegentlich neue Farben hinzu für Abwechslung (30% Chance)
        if (Math.random() < 0.3 && gridColors.size > 0) {
            const allColors = Object.values(BUBBLE_COLORS);
            const newColor = allColors[Math.floor(Math.random() * allColors.length)];
            availableColors.push(newColor);
        }

        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        this.nextBubble = new Bubble(this, 0, 0, BUBBLE_RADIUS, randomColor);
    }

    // Lade die vorbereitete Blase in die Kanone
    loadNextBubbleToCannon() {
        if (!this.nextBubble) {
            this.prepareNextBubble();
        }

        const cannonX = this.cannon.x;
        const cannonY = this.cannon.y;
        
        // Aktuelle Blase zum Schießen vorbereiten
        this.shootingBubble = this.nextBubble;
        this.shootingBubble.setPosition(cannonX, cannonY);
        this.shootingBubble.draw();
        
        // Nächste Blase vorbereiten und anzeigen
        this.prepareNextBubble();
        if (this.nextBubbleDisplay) {
            this.nextBubbleDisplay.destroy();
        }
        this.nextBubbleDisplay = new Bubble(this, this.sys.game.config.width - 80, this.sys.game.config.height - 80, BUBBLE_RADIUS, this.nextBubble.color);
        this.nextBubbleDisplay.draw();
        
        this.canShoot = true;
    }

    // Methode zum Schießen der Blase
    shootBubble(angle) {
        if (!this.canShoot || !this.shootingBubble || this.currentState !== this.gameStates.PLAYING) return;
        
        this.canShoot = false;
        this.aimLine.setVisible(false); // Verstecke die Ziellinie während des Schusses
        
        const speed = 400;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        // Physik für die schießende Blase aktivieren
        if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
            this.shootingBubble.gameObject.body.setVelocity(velocityX, velocityY);
        }
        
        // Collision detection hinzufügen
        this.setupCollisionDetection();
    }
    
    setupCollisionDetection() {
        if (!this.shootingBubble || !this.shootingBubble.gameObject) return;
        
        // Kollision mit Grid-Bubbles prüfen
        const gridBubbles = this.grid.getAllBubbleObjects();
        for (const gridBubble of gridBubbles) {
            this.physics.add.overlap(this.shootingBubble.gameObject, gridBubble, (shootingBubble, hitBubble) => {
                this.handleBubbleCollision(shootingBubble, hitBubble);
            });
        }
        
        // Kollision mit Weltgrenzen aktivieren
        this.shootingBubble.gameObject.body.setCollideWorldBounds(true);
        this.shootingBubble.gameObject.body.setBounce(1, 0); // Horizontale Reflexion
        
        // Event für Grenzenkollision
        this.shootingBubble.gameObject.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', (event, body) => {
            if (body === this.shootingBubble.gameObject.body) {
                // Wenn die Bubble die obere Grenze erreicht, befestigen wir sie
                if (event.up) {
                    this.attachBubbleToGrid();
                }
                // Wenn die Bubble seitlich die Grenze erreicht, einfach reflektieren
                // Wenn die Bubble nach unten verloren geht, zurücksetzen
                if (event.down) {
                    console.log("Bubble verloren - falle nach unten");
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
    
    handleBubbleCollision(shootingBubble, gridBubble) {
        // Stoppe die Bewegung
        shootingBubble.body.setVelocity(0, 0);
        
        // Finde die beste Grid-Position für die neue Blase
        this.attachBubbleToGrid();
    }
    
    attachBubbleToGrid() {
        if (!this.shootingBubble) return;
        
        // Finde die nächste freie Position im Grid
        const gridPos = this.grid.pixelToGrid(this.shootingBubble.x, this.shootingBubble.y);
        
        // Nutze Collision.findNearestEmptyCell um die beste freie Position zu finden
        const nearestCell = Collision.findNearestEmptyCell(this.grid, this.shootingBubble);
        
        if (nearestCell) {
            const pixelPos = this.grid.gridToPixel(nearestCell.row, nearestCell.col);
            this.shootingBubble.setPosition(pixelPos.x, pixelPos.y);
            this.grid.addBubble(nearestCell.row, nearestCell.col, this.shootingBubble);
            
            // Prüfe auf Matches
            this.checkForMatches(nearestCell.row, nearestCell.col);
        } else {
            // Fallback: Entferne die Blase, wenn keine Position gefunden wurde
            if (this.shootingBubble.gameObject) {
                this.shootingBubble.destroy();
            }
        }
        
        this.shootingBubble = null;
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
        this.checkGameOver();
        
        // Bereite nächsten Schuss vor (nur wenn Spiel noch läuft)
        if (this.currentState === this.gameStates.PLAYING) {
            this.loadNextBubbleToCannon();
        }
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

    // Methode zum Aktualisieren der Ziellinie
    updateAim(pointerX, pointerY) {
        if (!this.aimLine || !this.cannon) return;

        const angle = Phaser.Math.Angle.Between(
            this.cannon.x,
            this.cannon.y,
            pointerX,
            pointerY
        );

        const distance = 200;
        const endX = this.cannon.x + Math.cos(angle) * distance;
        const endY = this.cannon.y + Math.sin(angle) * distance;

        this.aimLine.setTo(this.cannon.x, this.cannon.y, endX, endY);
    }

    // Game Over Detection
    checkGameOver() {
        const gameHeight = this.scale.height;
        const gameOverLine = gameHeight - this.GAME_OVER_LINE_OFFSET;

        // Prüfe alle Bubbles im Grid
        for (let row = 0; row < this.grid.getRows(); row++) {
            for (let col = 0; col < this.grid.getCols(); col++) {
                if (this.grid.hasBubble(row, col)) {
                    const position = this.grid.gridToPixel(row, col);
                    if (position.y >= gameOverLine) {
                        this.handleGameOver();
                        return true;
                    }
                }
            }
        }

        // Prüfe auch, ob keine Bubbles mehr vorhanden sind (Victory)
        if (this.grid.getAllBubbleObjects().length === 0) {
            this.handleVictory();
            return true;
        }

        return false;
    }

    // Game Over Handler
    handleGameOver() {
        this.currentState = this.gameStates.GAME_OVER;
        this.canShoot = false;
        
        // Game Over Text anzeigen
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        
        this.add.rectangle(gameWidth/2, gameHeight/2, gameWidth, gameHeight, 0x000000, 0.7);
        this.add.text(gameWidth/2, gameHeight/2 - 50, 'GAME OVER!', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(gameWidth/2, gameHeight/2, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(gameWidth/2, gameHeight/2 + 50, 'Click to restart', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Restart beim Klick
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    // Victory Handler
    handleVictory() {
        this.currentState = this.gameStates.GAME_OVER;
        this.canShoot = false;
        
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        
        this.add.rectangle(gameWidth/2, gameHeight/2, gameWidth, gameHeight, 0x000000, 0.7);
        this.add.text(gameWidth/2, gameHeight/2 - 50, 'VICTORY!', {
            fontSize: '48px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(gameWidth/2, gameHeight/2, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(gameWidth/2, gameHeight/2 + 50, 'Click to restart', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Restart beim Klick
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// React-Komponente für das Phaserspiel
export function PhaserGame() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) {
      const config = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 800,
        height: 600,
        scene: BootScene,
        backgroundColor: '#000000',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        }
      };

      const game = new Phaser.Game(config);

      // Cleanup beim Unmounten der Komponente
      return () => {
        game.destroy(true);
      };
    }
  }, []);

  return <div ref={gameRef} />;
}

// Default-Export der Komponente
export default PhaserGame;
