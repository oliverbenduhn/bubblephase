import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { MobileOptimization } from './MobileOptimization';
import { TouchMenu } from './TouchMenu';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_COLORS } from './config';
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
        this.isAttaching = false; // Verhindert mehrfache Bubble-Attachment
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
        
        // Mobile Optimierung - wird in create() initialisiert
        this.mobileOptimization = null;
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
        // Mobile-optimierte Konstanten
        this.BUBBLE_RADIUS = 15; // Wird später neu berechnet
        this.INITIAL_ROWS = 5;
        this.GAME_OVER_LINE_OFFSET = 120;
        
        // Berechne zentrale Position für die Kanone
        const cannonY = this.scale.height - 60;
        const cannonX = this.scale.width / 2;
        
        // Berechne Grid-Parameter - Exakt 8 Kugeln pro Reihe
        const gridRows = 12;
        const gridCols = 8; // Fest auf 8 Kugeln pro Reihe gesetzt
        
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
        
        // Erstelle die Kanone an der berechneten Position - größer und besser sichtbar
        this.cannon = this.add.circle(cannonX, cannonY, this.BUBBLE_RADIUS * 1.2, 0x444444);
        this.cannon.setStrokeStyle(2, 0x666666);
        this.cannon.setDepth(10);
        
        // Initialisiere den Shooter mit mobiler Geschwindigkeit
        this.shooter = new Shooter(this, 700);
        
        // Erstelle die Ziellinie mit angepasster Transparenz
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(12);
        
        // Initialisiere Mobile-Optimierung
        this.mobileOptimization = new MobileOptimization(this, {
            showTouchControls: true,
            trajectoryOpacity: 0.5,
            uiScale: 0.8
        });
        
        // Score-Text unten links anzeigen
        this.scoreText = this.add.text(10, this.scale.height - 80, 'Score: 0', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.scoreText.setDepth(10);
        
        // Game Over Linie
        this.gameOverY = this.scale.height - this.GAME_OVER_LINE_OFFSET;
        this.gameOverLine = this.add.graphics();
        this.gameOverLine.lineStyle(2, 0xff0000, 0.5);
        this.gameOverLine.lineBetween(0, this.gameOverY, this.scale.width, this.gameOverY);
        this.gameOverLine.setDepth(1);
        
        // Spiel-Anweisungen oben anzeigen
        this.add.text(this.scale.width / 2, 20, 'Ziele und schieße! 3+ gleiche Farben = Punkte', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0).setDepth(10);
        
        // Initialisiere Touch-Menü
        this.touchMenu = new TouchMenu(this, 0.8);
        
        // Fülle das Grid mit initialen Bubbles
        this.initializeGrid();
        
        // Initialisiere ColorGroup für Match-Prüfungen
        this.colorGroup = new ColorGroup(this.grid);
        
        this.loadNextBubbleToCannon();
        
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
                    const angle = Phaser.Math.Angle.Between(
                        this.cannon.x,
                        this.cannon.y,
                        pointer.x,
                        pointer.y
                    );
                    this.shootBubble(angle);
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
    }

    initializeGrid() {
        // Verwende die Grid-eigene Methode zur Initialisierung mit Bubbles
        this.grid.initializeWithBubbles(this.INITIAL_ROWS);
    }

    // Bereite die nächste Blase vor (intelligente Farbauswahl)
    prepareNextBubble() {
        // Sammle alle verfügbaren Farben aus dem aktuellen Grid
        const gridColors = new Set();
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
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
        this.nextBubble = new Bubble(this, 0, 0, this.BUBBLE_RADIUS, randomColor);
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
        
        // Nächste Blase vorbereiten und anzeigen
        this.prepareNextBubble();
        if (this.nextBubbleDisplay) {
            this.nextBubbleDisplay.destroy();
        }
        this.nextBubbleDisplay = new Bubble(this, this.scale.width - 60, this.scale.height - 120, this.BUBBLE_RADIUS, this.nextBubble.color);
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
            console.log("❌ Cannot shoot:", { canShoot: this.canShoot, hasShootingBubble: !!this.shootingBubble, state: this.currentState });
            return;
        }
        
        console.log("🚀 Shooting bubble at angle:", angle, "from position:", this.shootingBubble.x, this.shootingBubble.y);
        this.canShoot = false;
        this.aimLine.setVisible(false); // Verstecke die Ziellinie während des Schusses
        
        // Verstecke auch die erweiterte Trajektorien-Hilfe
        if (this.mobileOptimization) {
            this.mobileOptimization.hideTrajectoryHelper();
        }
        
        const speed = 400;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        console.log("💨 Setting velocity:", { velocityX, velocityY });
        
        // Physik für die schießende Blase aktivieren
        if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
            this.shootingBubble.gameObject.body.setImmovable(false);
            this.shootingBubble.gameObject.body.setVelocity(velocityX, velocityY);
            console.log("✅ Bubble physics activated and velocity set");
        }
        
        // Collision detection hinzufügen
        this.setupCollisionDetection();
    }
    
    setupCollisionDetection() {
        if (!this.shootingBubble || !this.shootingBubble.gameObject) {
            console.log("No shooting bubble for collision detection");
            return;
        }
        
        console.log("Setting up collision detection for bubble at:", this.shootingBubble.x, this.shootingBubble.y);
        
        // Entferne alle existierenden Kollisions-Detektoren für diese Bubble
        if (this.collider) {
            this.collider.destroy();
            this.collider = null;
        }
        // Removed: this.physics.world.removeCollider(this.shootingBubble.gameObject); // This might be causing issues
        
        // Kollision mit Grid-Bubbles prüfen
        const gridBubbles = this.grid.getAllBubbleObjects();
        console.log("Grid bubbles found for collision:", gridBubbles.length);
        if (gridBubbles.length > 0) {
            this.collider = this.physics.add.overlap(this.shootingBubble.gameObject, gridBubbles, (gameObject, hitBubbleGameObject) => {
                console.log("🔴 Grid collision detected between shooting bubble and grid bubble");
                // Pass the Bubble instance directly to the handler
                this.handleBubbleCollision(this.shootingBubble, hitBubbleGameObject);
            });
        }
        
        // Kollision mit Weltgrenzen aktivieren
        this.shootingBubble.gameObject.body.setCollideWorldBounds(true);
        this.shootingBubble.gameObject.body.setBounce(1, 0); // Horizontale Reflexion
        
        // Event für Grenzenkollision
        this.shootingBubble.gameObject.body.onWorldBounds = true;
        
        // Entferne vorherige worldbounds Event-Listener um doppelte Aufrufe zu vermeiden
        this.physics.world.off('worldbounds');
        
        this.physics.world.on('worldbounds', (event, body) => {
            if (body === this.shootingBubble.gameObject.body) {
                console.log("🌍 World boundary collision:", event);
                // Wenn die Bubble die obere Grenze erreicht, befestigen wir sie
                if (event.up) {
                    console.log("🔝 Bubble hit top boundary - attaching to grid");
                    this.attachBubbleToGrid();
                }
                // Wenn die Bubble seitlich die Grenze erreicht, einfach reflektieren
                // Wenn die Bubble nach unten verloren geht, zurücksetzen
                if (event.down) {
                    console.log("⬇️ Bubble verloren - falle nach unten");
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
        try {
            console.log("DEBUG: isAttaching at very start of handleBubbleCollision:", this.isAttaching); // Moved this line
            // Verhindere mehrfache Aufrufe der Kollisionsbehandlung
            if (this.isAttaching) {
                console.log("⚠️ Already attaching bubble, ignoring duplicate collision");
                return;
            }

            this.isAttaching = true;
            console.log("🟡 Bubble collision detected! Stopping movement and attaching to grid");
            console.log("🎯 Collision at bubble position:", shootingBubble.x, shootingBubble.y);
            console.log("🎯 Hit grid bubble at:", gridBubble.x, gridBubble.y);

            // Entferne SOFORT alle Kollisionsdetektoren um weitere Kollisionen zu verhindern
            if (this.collider) {
                this.collider.destroy();
                this.collider = null;
            }
            // Removed: this.physics.world.removeCollider(this.shootingBubble.gameObject); // This might be causing issues

            // Stoppe die Bewegung der schießenden Bubble
            if (shootingBubble.gameObject && shootingBubble.gameObject.body) {
                shootingBubble.gameObject.body.setVelocity(0, 0);
                shootingBubble.gameObject.body.setImmovable(true);
                shootingBubble.gameObject.body.enable = false; // Deaktiviere Physik komplett
                console.log("Bubble movement stopped");
            }
            
            // Speichere die Kollisionsposition für bessere Platzierung
            this.collisionPosition = { x: shootingBubble.gameObject.x, y: shootingBubble.gameObject.y };
            
            // Berechne benachbarte freie Zelle um den getroffenen Grid-Bubble
            const hitGrid = this.grid.findCellByBubble(gridBubble);
            if (hitGrid) {
                const neighbors = this.grid.getNeighbors(hitGrid.row, hitGrid.col);
                const emptyNeighbors = neighbors.filter(n => !this.grid.getBubble(n.row, n.col));
                if (emptyNeighbors.length > 0) {
                    let best = null;
                    let minDist = Number.MAX_VALUE;
                    for (const n of emptyNeighbors) {
                        const pos = this.grid.gridToPixel(n.row, n.col);
                        const dx = this.collisionPosition.x - pos.x;
                        const dy = this.collisionPosition.y - pos.y;
                        const d = Math.hypot(dx, dy);
                        if (d < minDist) {
                            minDist = d;
                            best = n;
                        }
                    }
                    this.forcedCell = best;
                }
            }
            
            // Befestige die Bubble am Grid
            console.log("DEBUG: Before calling attachBubbleToGrid. this.shootingBubble is:", this.shootingBubble);
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
        
        // Use precise collision position if available
        const pos = this.collisionPosition || { x: this.shootingBubble.x, y: this.shootingBubble.y };
        
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
            
            // Stoppe jegliche Bewegung der Bubble BEVOR wir sie positionieren
            if (this.shootingBubble.gameObject && this.shootingBubble.gameObject.body) {
                this.shootingBubble.gameObject.body.setVelocity(0, 0);
                this.shootingBubble.gameObject.body.setImmovable(true);
                console.log("✅ Bubble movement completely stopped");
            }

            // Berechne die korrekte Pixel-Position für die Grid-Position
            const targetPixelPos = this.grid.gridToPixel(nearestCell.row, nearestCell.col);
            console.log("📍 Target pixel position:", targetPixelPos);
            
            // Setze die Bubble-Position direkt
            this.shootingBubble.setPosition(targetPixelPos.x, targetPixelPos.y);
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

    // Methode zum Aktualisieren der Ziellinie mit verbessertem Touch-Feedback
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

        // Ziellinie mit besserem visuellen Feedback
        this.aimLine.clear();
        
        // Wenn gerade gezielt wird, dickere und hellere Linie
        if (this.isAiming) {
            this.aimLine.lineStyle(4, 0x00ff00, 0.9); // Grün und dicker beim Zielen
            
            // Zusätzliche gestrichelte Linie für bessere Sichtbarkeit
            for (let i = 0; i < distance; i += 20) {
                const x1 = this.cannon.x + Math.cos(angle) * i;
                const y1 = this.cannon.y + Math.sin(angle) * i;
                const x2 = this.cannon.x + Math.cos(angle) * (i + 10);
                const y2 = this.cannon.y + Math.sin(angle) * (i + 10);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
        } else {
            this.aimLine.lineStyle(2, 0xffffff, 0.6); // Normal beim Hover
            this.aimLine.lineBetween(this.cannon.x, this.cannon.y, endX, endY);
        }

        // Erweiterte Trajektorien-Hilfe anzeigen
        if (this.mobileOptimization) {
            this.mobileOptimization.showTrajectoryHelper(
                this.cannon.x,
                this.cannon.y,
                pointerX,
                pointerY
            );
        }
    }

    // Game Over Detection
    checkGameOver() {
        const gameHeight = this.scale.height;
        const gameOverLine = gameHeight - this.GAME_OVER_LINE_OFFSET;

        // Prüfe alle Bubbles im Grid
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                if (this.grid.getBubble(row, col)) {
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

    // Mobile Event-Handler
    handleMobileAim(angle) {
        if (this.currentState === this.gameStates.PLAYING && this.canShoot) {
            // Konvertiere Winkel zu Zielkoordinaten für updateAim
            const distance = 200;
            const targetX = this.cannon.x + Math.cos(angle) * distance;
            const targetY = this.cannon.y + Math.sin(angle) * distance;
            this.updateAim(targetX, targetY);
            this.aimLine.setVisible(true);
        }
    }

    handleMobileShoot() {
        if (this.currentState === this.gameStates.PLAYING && this.canShoot && this.shootingBubble) {
            // Verwende den aktuellen Winkel der Ziellinie für den Schuss
            const angle = Phaser.Math.Angle.Between(
                this.cannon.x,
                this.cannon.y,
                this.cannon.x + this.aimLine.geom.x2,
                this.cannon.y + this.aimLine.geom.y2
            );
            this.shootBubble(angle);
        }
    }

    handleMobileMove(direction) {
        // Placeholder für eventuelle zukünftige Kanonen-Bewegung
        console.log('Mobile move:', direction);
    }

}

// React-Komponente für das Phaserspiel
export function PhaserGame() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) {
      // Mobile-optimierte Spielfeldgröße
      const gameWidth = window.innerWidth;
      const gameHeight = window.innerHeight;
      
      const config = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: gameWidth,
        height: gameHeight,
        scene: BootScene,
        backgroundColor: '#000000',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false,
            fps: 60,
            timeScale: 1
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

  return <div ref={gameRef} className="game-container" />;
}

// Default-Export der Komponente
export default PhaserGame;
