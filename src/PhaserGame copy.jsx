import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { Bubble, BUBBLE_COLORS, BUBBLE_RADIUS } from './Bubble';
import { Grid } from './Grid';
import { Shooter } from './Shooter';
import { Collision } from './Collision';

// Eine einfache, leere Phaser-Szene
export class BootScene extends Phaser.Scene {
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
        this.MIN_GROUP_SIZE = 3; // Mindestgröße für eine Gruppe gleichfarbiger Bubbles
        
        // Spielzustände
        this.gameStates = {
            START: 'start',
            PLAYING: 'playing',
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
        this.isMobile = false;
    }

    preload() {
        // Hier könnten später Assets geladen werden
        console.log('BootScene preload');
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
        
        // Layout basierend auf Orientierung anpassen
        this.adjustLayoutForOrientation(isPortrait);
        
        // Event Listener für Orientierungsänderungen
        this.sys.game.events.on('orientationchange', (isPortrait) => {
            this.adjustLayoutForOrientation(isPortrait);
        });

        // Grid initialisieren
        const gridRows = 12;
        // Berechne die maximale Anzahl von Spalten basierend auf der Spielbreite
        const gridCols = Math.floor((gameWidth - 40) / (BUBBLE_RADIUS * 2)); // 40px Gesamtabstand (20px pro Seite)
        const xOffset = (gameWidth - (gridCols * BUBBLE_RADIUS * 2)) / 2; // Zentriere das Grid horizontal
        const yOffset = 50;

        console.log(`Initialisiere Grid mit ${gridCols} Spalten bei ${gameWidth}px Breite`);
        this.grid = new Grid(this, gridRows, gridCols, xOffset, yOffset);
        this.grid.initializeWithBubbles(Math.ceil(gridRows * 0.5)); // Fülle die Hälfte des Grids
        this.grid.forEachBubble((bubble, row, col) => {
            bubble.draw();
        });

        // Game Over Linie definieren (exakt 10 Reihen von oben)
        const rowHeight = BUBBLE_RADIUS * Math.sqrt(3);
        this.gameOverY = this.grid.yOffset + (10 * rowHeight);
        
        // Game Over Linie erstellen
        this.gameOverLine = this.add.line(
            0, this.gameOverY,           // x, y Position der Linie (Startpunkt)
            0, 0,   // Startpunkt der Linie relativ zur Position
            gameWidth, 0,  // Endpunkt der Linie relativ zur Position
            0xff0000, 1    // Farbe (rot) und volle Deckkraft
        );
        this.gameOverLine.setOrigin(0, 0); // Ursprung links oben setzen
        this.gameOverLine.setLineWidth(4);

        // Kanone initialisieren
        const cannonX = gameWidth / 2;
        const cannonY = gameHeight - 60;
        this.cannon = this.add.circle(cannonX, cannonY, BUBBLE_RADIUS + 2, 0xcccccc);
        this.cannon.setStrokeStyle(2, 0x999999);
        this.cannonPointer = this.add.line(0,0, cannonX, cannonY, cannonX, cannonY - BUBBLE_RADIUS, 0x999999, 1);
        this.cannonPointer.setLineWidth(4,2);

        // Shooter initialisieren
        this.shooter = new Shooter(this, cannonX, cannonY);

        // Ziellinie initialisieren
        this.aimLine = this.add.line(cannonX, cannonY, 0, 0, 0, -70, 0xffffff, 0.5);
        this.aimLine.setOrigin(0,0);
        this.aimLine.setVisible(false); // Initial ausblenden
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
        this.scoreText = this.add.text(gameWidth - 150, 10, 'Score: 0', { 
            fill: '#fff', 
            fontSize: '18px' 
        });

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
        // Touch und Pointer Move für das Zielen
        this.input.on('pointermove', (pointer) => {
            if (this.currentState === this.gameStates.PLAYING && this.canShoot) {
                this.updateAim(pointer.x, pointer.y);
            }
        });

        // Touch/Click Start und Ende Handling
        this.input.on('pointerdown', (pointer) => {
            // Bei START-Zustand wird der Klick vom Start-Button verarbeitet
            if (this.currentState === this.gameStates.START) {
                return;
            }
            
            // Speichere den Startpunkt für potentielle Drag-Operationen auf mobilen Geräten
            this.touchStartPoint = { x: pointer.x, y: pointer.y };
            
            // Bei mobile Touch nur Zielen beginnen, nicht sofort schießen
            if (this.isMobile && this.currentState === this.gameStates.PLAYING) {
                // Verstärke die Sichtbarkeit der Ziellinie beim Touch
                this.aimLine.setAlpha(0.8);
                this.updateAim(pointer.x, pointer.y);
            }
            // Beim Desktop-Klick oder wenn nicht im PLAYING-Zustand
            else if (!this.isMobile && this.currentState === this.gameStates.PLAYING && this.canShoot && this.shootingBubble && !this.shootingBubble.isMoving) {
                this.shootBubble(pointer.x, pointer.y);
            }
        });
        
        // Beim Loslassen des Fingers/Maustaste
        this.input.on('pointerup', (pointer) => {
            // Bei mobilen Geräten: Schießen beim Loslassen
            if (this.isMobile && this.currentState === this.gameStates.PLAYING && this.canShoot && 
                this.shootingBubble && !this.shootingBubble.isMoving) {
                // Ziellinie zurücksetzen
                this.aimLine.setAlpha(0.3);
                this.shootBubble(pointer.x, pointer.y);
            }
        });

        // Game Over Linie ist bereits erstellt worden
    }

    update(time, delta) {
        // Überprüfe Game-Over-Zustand am Anfang jedes Updates
        if (this.checkGameOver()) {
            return; // Keine weitere Verarbeitung, wenn das Spiel vorbei ist
        }

        if (this.shootingBubble && this.shootingBubble.isMoving) {
            const speedFactor = delta / 1000;
            
            // Alte Position zum Debugging
            const oldX = this.shootingBubble.x;
            const oldY = this.shootingBubble.y;
            
            // Bewegung der Bubble
            this.shootingBubble.x += this.shootingBubble.velocityX * speedFactor;
            this.shootingBubble.y += this.shootingBubble.velocityY * speedFactor;
            this.shootingBubble.gameObject.setPosition(this.shootingBubble.x, this.shootingBubble.y);

            // Wandkollision
            const gameWidth = this.sys.game.config.width;
            if (this.shooter.checkWallCollision(this.shootingBubble, gameWidth)) {
                console.log(`Wall collision: Position (${this.shootingBubble.x.toFixed(2)}, ${this.shootingBubble.y.toFixed(2)})`);
            }

            // Kollision mit anderen Bubbles im Grid
            const collidingBubble = Collision.checkGridCollision(this.shootingBubble, this.grid);
            if (collidingBubble) {
                console.log(`Bubble collision: Pos (${this.shootingBubble.x.toFixed(2)}, ${this.shootingBubble.y.toFixed(2)})`);
                console.log(`Movement: (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) -> (${this.shootingBubble.x.toFixed(2)}, ${this.shootingBubble.y.toFixed(2)})`);
                this.handleBubbleCollision();
                
                // Nach einer Kollision, prüfe erneut auf Game-Over
                this.checkGameOver();
                
                return; // Wichtig: Nach Kollision nicht mehr weiter prüfen
            }

            // Kollision mit der Decke (oberer Rand)
            // Diese Überprüfung erst NACH der Bubble-Kollisionserkennung durchführen
            if (this.shooter.checkTopCollision(this.shootingBubble, this.grid.yOffset)) {
                console.log(`Top collision: Position (${this.shootingBubble.x.toFixed(2)}, ${this.shootingBubble.y.toFixed(2)})`);
                this.handleBubbleAtTopPosition();
                
                // Nach einer Kollision, prüfe erneut auf Game-Over
                this.checkGameOver();
            }
        }
    }

    // Neue optimierte Methode zur Behandlung von Kollisionen
    handleBubbleCollision() {
        // Stoppe die Bubble-Bewegung
        this.stopShootingBubble();
        
        // Finde die nächste freie Zelle
        const nearestEmptyCell = Collision.findNearestEmptyCell(this.grid, this.shootingBubble);
        
        if (nearestEmptyCell) {
            // Füge die Bubble dem Grid hinzu
            this.grid.addBubble(nearestEmptyCell.row, nearestEmptyCell.col, this.shootingBubble);
            this.shootingBubble.draw(); // Stelle sicher, dass die Bubble gezeichnet wird
            
            // Prüfe auf Gruppen und entferne sie
            this.checkAndRemoveGroups(nearestEmptyCell.row, nearestEmptyCell.col);
        } else {
            // Wenn keine passende Position gefunden wurde, zerstöre die Bubble
            console.warn("No valid position found for bubble attachment - destroying bubble");
            this.shootingBubble.destroy();
        }
        
        // Lade die nächste Bubble in die Kanone
        this.shootingBubble = null;
        this.loadNextBubbleToCannon();
    }

    // Behandlung, wenn die Bubble den oberen Rand erreicht
    handleBubbleAtTopPosition() {
        this.stopShootingBubble();
        
        // Berechne die nächste Grid-Position basierend auf der X-Koordinate
        const col = Math.round((this.shootingBubble.x - this.grid.xOffset) / (BUBBLE_RADIUS * 2));
        const row = 0; // Oberste Reihe
        
        if (this.grid.isValidGridPosition(row, col) && !this.grid.getBubble(row, col)) {
            this.grid.addBubble(row, col, this.shootingBubble);
            this.shootingBubble.draw(); // Stelle sicher, dass die Bubble gezeichnet wird
            
            // Prüfe auf Gruppen und entferne sie
            this.checkAndRemoveGroups(row, col);
        } else {
            // Suche alternativ nach einer freien Zelle in der obersten Reihe
            let placed = false;
            for (let c = 0; c < this.grid.cols; c++) {
                if (!this.grid.getBubble(0, c)) {
                    this.grid.addBubble(0, c, this.shootingBubble);
                    this.shootingBubble.draw(); // Stelle sicher, dass die Bubble gezeichnet wird
                    this.checkAndRemoveGroups(0, c);
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                console.warn("No space at top row, destroying bubble");
                this.shootingBubble.destroy();
            }
        }
        
        this.shootingBubble = null;
        this.loadNextBubbleToCannon();
    }

    // Prüft auf Gruppen gleichfarbiger Bubbles und entfernt sie
    checkAndRemoveGroups(row, col) {
        // Finde zusammenhängende Bubbles gleicher Farbe
        const { size, positions } = Collision.findColorGroup(this.grid, row, col, this.MIN_GROUP_SIZE);
        let removedCount = 0;
        
        if (size >= this.MIN_GROUP_SIZE) {
            console.log(`Found a group of ${size} bubbles to remove`);
            
            // Entferne die Bubbles mit einer Animation
            positions.forEach(pos => {
                const bubble = this.grid.getBubble(pos.row, pos.col);
                if (bubble && bubble.gameObject) {
                    // Animiere die Bubble-Entfernung
                    this.tweens.add({
                        targets: bubble.gameObject,
                        scale: 0,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            bubble.destroy();
                        }
                    });
                }
            });
            
            // Entferne die Bubbles aus dem Grid
            this.grid.removeBubbles(positions);
            removedCount += positions.length;
            
            // Punktezahl aktualisieren (mehr Punkte für größere Gruppen)
            const pointsPerBubble = 10;
            const bonus = (size > this.MIN_GROUP_SIZE) ? (size - this.MIN_GROUP_SIZE) * 5 : 0;
            const points = size * pointsPerBubble + bonus;
            this.score += points;
            
            // Zeige Punkteanimation
            this.showPointsAnimation(points, col, row);
            
            // Nach dem Entfernen der Gruppe, prüfe auf freischwebende Bubbles
            const floatingBubbles = Collision.findFloatingBubbles(this.grid);
            
            if (floatingBubbles.length > 0) {
                console.log(`Found ${floatingBubbles.length} floating bubbles`);
                
                // Entferne die freischwebenden Bubbles mit einer Fallanimation
                floatingBubbles.forEach(pos => {
                    const bubble = this.grid.getBubble(pos.row, pos.col);
                    if (bubble && bubble.gameObject) {
                        // Animiere das Fallen
                        this.tweens.add({
                            targets: bubble.gameObject,
                            y: `+=${this.sys.game.config.height - bubble.y + BUBBLE_RADIUS}`,
                            alpha: 0,
                            duration: 500,
                            ease: 'Cubic.easeIn',
                            onComplete: () => {
                                bubble.destroy();
                            }
                        });
                    }
                });
                this.grid.removeBubbles(floatingBubbles);
                removedCount += floatingBubbles.length;
                
                // Zusätzliche Punkte für freischwebende Bubbles
                const floatingBonus = floatingBubbles.length * 15; // Höherer Bonus für freischwebende Bubbles
                this.score += floatingBonus;
                console.log(`Removed ${floatingBubbles.length} floating bubbles for ${floatingBonus} bonus points`);
            }
            
            // Aktualisiere den angezeigten Score
            this.scoreText.setText(`Score: ${this.score}`);
            
            if (removedCount > 0) {
                console.log(`Total removed: ${removedCount} bubbles`);
            }
        }
    }

    // Zeigt eine Punkteanimation an der Position einer entfernten Bubble-Gruppe
    showPointsAnimation(points, col, row) {
        // Konvertiere Grid-Position in Pixel-Koordinaten
        const position = this.grid.gridToPixel(row, col);
        
        // Erstelle den Punktetext
        const pointsText = this.add.text(position.x, position.y, `+${points}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        pointsText.setOrigin(0.5);
        
        // Animiere den Text nach oben und lasse ihn verschwinden
        this.tweens.add({
            targets: pointsText,
            y: position.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                pointsText.destroy();
            }
        });
    }

    prepareNextBubble() {
        const availableColors = Object.values(BUBBLE_COLORS);
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        this.nextBubble = new Bubble(this, 0, 0, BUBBLE_RADIUS, randomColor);
        
        // Aktualisiere die Anzeige für die nächste Bubble
        if (this.nextBubbleDisplay) {
            this.nextBubbleDisplay.destroy();
        }
        this.nextBubbleDisplay = new Bubble(
            this,
            this.sys.game.config.width - 80,
            this.sys.game.config.height - 80,
            BUBBLE_RADIUS,
            randomColor
        );
        this.nextBubbleDisplay.draw();
    }

    loadNextBubbleToCannon() {
        if (this.shootingBubble && this.shootingBubble.gameObject) {
            // Alte Bubble bereinigen, falls vorhanden
            this.shootingBubble.destroy();
        }

        if (this.nextBubble) {
            this.shootingBubble = this.nextBubble;
            this.shootingBubble.setPosition(this.cannon.x, this.cannon.y);
            this.shootingBubble.draw();
            this.shootingBubble.isMoving = false;
            this.shootingBubble.velocityX = 0;
            this.shootingBubble.velocityY = 0;
            this.canShoot = true;
            this.aimLine.setVisible(true);
            // Ziellinie auf Kanonenposition zurücksetzen
            this.aimLine.setTo(0, 0, 0, 0);
            // Kanonenzeiger auf Standardwinkel setzen (nach oben)
            this.cannonPointer.rotation = -Math.PI / 2;
            this.prepareNextBubble();
        } else {
            console.log("No more bubbles to load!");
            this.canShoot = false;
            this.aimLine.setVisible(false);
        }
    }

    updateAim(pointerX, pointerY) {
        // Begrenze die y-Koordinate auf oberhalb der Kanone
        let constrainedY = Math.min(pointerY, this.cannon.y - 1);

        // Berechne den Winkel von der Kanone zur Mausposition
        const angle = Phaser.Math.Angle.Between(this.cannon.x, this.cannon.y, pointerX, constrainedY);

        // Berechne die maximale Länge der Ziellinie (z.B. bis zum oberen Rand des Spielfelds)
        const maxLength = this.cannon.y - this.grid.yOffset;

        // Berechne Endpunkt der Ziellinie basierend auf Winkel und Länge
        const endX = this.cannon.x + Math.cos(angle) * maxLength;
        const endY = this.cannon.y + Math.sin(angle) * maxLength;

        // Setze die Ziellinie von (0,0) (Kanonenposition) zum berechneten Endpunkt relativ
        this.aimLine.setTo(0, 0, endX - this.cannon.x, endY - this.cannon.y);

        // Setze Rotation des Kanonenzeigers
        this.cannonPointer.rotation = angle + Math.PI / 2;
    }

    shootBubble(pointerX, pointerY) {
        if (!this.shootingBubble || this.shootingBubble.isMoving || pointerY >= this.cannon.y) {
            return;
        }

        this.canShoot = false;
        this.shootingBubble.isMoving = true;
        this.aimLine.setVisible(false);

        const angle = this.shooter.calculateAngle(pointerX, pointerY);
        const velocity = this.shooter.calculateVelocity(angle);

        this.shootingBubble.velocityX = velocity.velocityX;
        this.shootingBubble.velocityY = velocity.velocityY;

        // Nach dem Schuss die Ziellinie auf Kanonenposition zurücksetzen
        this.aimLine.setTo(0, 0, 0, 0);
        // Kanonenzeiger auf Standardwinkel setzen (nach oben)
        this.cannonPointer.rotation = -Math.PI / 2;
    }

    stopShootingBubble() {
        if (this.shootingBubble) {
            this.shootingBubble.isMoving = false;
            this.shootingBubble.velocityX = 0;
            this.shootingBubble.velocityY = 0;
        }
    }

    // Spielzustand ändern
    setGameState(newState) {
        this.currentState = newState;

        if (newState === this.gameStates.GAME_OVER) {
            this.gameOverText = this.add.text(this.cannon.x, this.cannon.y - 100, 'Game Over', { 
                fill: '#ff0000', 
                fontSize: '32px',
                align: 'center'
            }).setOrigin(0.5, 0.5);

            // Restart-Button hinzufügen
            this.restartButton = this.add.text(this.cannon.x, this.cannon.y, 'Restart', { 
                fill: '#00ff00', 
                fontSize: '24px',
                align: 'center' 
            }).setOrigin(0.5, 0.5).setInteractive();

            this.restartButton.on('pointerdown', () => {
                this.restartGame();
            });

            // Game Over Linie sichtbar machen
            this.gameOverLine.setVisible(true);
            this.gameOverLine.setTo(0, this.grid.yOffset, this.sys.game.config.width, this.grid.yOffset);
        }
    }
    
    // Startet das Spiel aus dem START-Zustand
    startGame() {
        console.log('Starte Spiel');
        this.currentState = this.gameStates.PLAYING;
        
        // Start-Button entfernen
        if (this.startButton) {
            this.startButton.graphics.destroy();
            this.startButton.text.destroy();
            this.startButton.zone.destroy();
            this.startButton = null;
        }
        
        // Ziellinie anzeigen und Schießen aktivieren
        this.aimLine.setVisible(true);
        this.canShoot = true;

        // Start-Text entfernen, falls vorhanden
        if (this.startText) {
            this.startText.destroy();
            this.startText = null;
        }
    }

    // Prüft, ob das Spiel verloren ist (Bubbles erreichen die Game-Over-Linie)
    checkGameOver() {
        if (this.currentState === this.gameStates.GAME_OVER) return true;
        
        let gameOver = false;
        this.grid.forEachBubble((bubble, row, col) => {
            if (bubble.y >= this.gameOverY) {
                gameOver = true;
            }
        });
        
        if (gameOver && this.currentState !== this.gameStates.GAME_OVER) {
            this.handleGameOver();
        }
        
        return gameOver;
    }
    
    // Behandelt den Game-Over-Zustand
    handleGameOver() {
        console.log('Game Over!');
        this.currentState = this.gameStates.GAME_OVER;
        this.canShoot = false;
        this.aimLine.setVisible(false);
        
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Game Over Text anzeigen
        this.gameOverText = this.add.text(gameWidth / 2, gameHeight / 2 - 40, 'GAME OVER', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center'
        });
        this.gameOverText.setOrigin(0.5);
        
        // Ergebnistext anzeigen
        const finalScoreText = this.add.text(gameWidth / 2, gameHeight / 2, `Punkte: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        });
        finalScoreText.setOrigin(0.5);
        
        // Neustart-Button erstellen
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonX = gameWidth / 2 - buttonWidth / 2;
        const buttonY = gameHeight / 2 + 40;
        
        const buttonGraphics = this.add.graphics();
        buttonGraphics.fillStyle(0x4CAF50, 1); // Grüne Farbe
        buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        
        const buttonText = this.add.text(gameWidth / 2, buttonY + buttonHeight / 2, 'Neustart', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        // Interaktiver Bereich für den Button
        const buttonZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight);
        buttonZone.setInteractive();
        buttonZone.on('pointerover', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x3e8e41, 1); // Dunkleres Grün beim Hover
            buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        });
        buttonZone.on('pointerout', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x4CAF50, 1); // Zurück zur normalen Farbe
            buttonGraphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        });
        buttonZone.on('pointerdown', () => {
            this.restartGame();
        });
        
        this.restartButton = { graphics: buttonGraphics, text: buttonText, zone: buttonZone };
    }
    
    // Startet das Spiel neu
    restartGame() {
        // Entferne Game-Over-Elemente
        if (this.gameOverText) this.gameOverText.destroy();
        if (this.restartButton) {
            this.restartButton.graphics.destroy();
            this.restartButton.text.destroy();
            this.restartButton.zone.destroy();
        }
        
        // Entferne alle Bubbles
        this.grid.forEachBubble((bubble) => {
            bubble.destroy();
        });
        
        // Initialisiere das Grid neu
        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                this.grid.grid[r][c] = null;
            }
        }
        this.grid.initializeWithBubbles(5);
        this.grid.forEachBubble((bubble) => {
            bubble.draw();
        });
        
        // Setze Spielvariablen zurück
        this.score = 0;
        this.scoreText.setText('Score: 0');
        this.currentState = this.gameStates.PLAYING;
        
        // Lade neue Bubble
        this.prepareNextBubble();
        this.loadNextBubbleToCannon();
    }
    
    // Passt das Layout abhängig von der Orientierung an
    adjustLayoutForOrientation(isPortrait) {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Elemente, die angepasst werden müssen, wenn sie bereits existieren
        if (this.scoreText) {
            if (isPortrait) {
                // Im Portrait-Modus Score oben rechts
                this.scoreText.setPosition(gameWidth - 150, 10);
            } else {
                // Im Landscape-Modus Score oben rechts, aber mit mehr Platz
                this.scoreText.setPosition(gameWidth - 200, 10);
            }
        }
        
        // Next Bubble Anzeige anpassen
        if (this.nextBubbleDisplay && this.nextBubbleDisplay.gameObject) {
            if (isPortrait) {
                // Im Portrait-Modus unten rechts
                this.nextBubbleDisplay.setPosition(gameWidth - 80, gameHeight - 80);
            } else {
                // Im Landscape-Modus rechts mittig
                this.nextBubbleDisplay.setPosition(gameWidth - 100, gameHeight / 2);
            }
        }
        
        // Kanone anpassen
        if (this.cannon) {
            const cannonX = gameWidth / 2;
            const cannonY = gameHeight - 60;
            this.cannon.setPosition(cannonX, cannonY);
            this.cannonPointer.setPosition(cannonX, cannonY);
            this.shooter.x = cannonX;
            this.shooter.y = cannonY;
            this.aimLine.setPosition(cannonX, cannonY);
        }
        
        // Game Over Linie anpassen
        if (this.gameOverLine) {
            this.gameOverY = this.grid.yOffset + (10 * BUBBLE_RADIUS * Math.sqrt(3));
            this.gameOverY = Math.min(this.gameOverY, gameHeight - 100);
            this.gameOverLine.setPosition(0, this.gameOverY);
            this.gameOverLine.setTo(0, 0, gameWidth, 0);
        }
        
        // Touch-Indikator für mobile Geräte anpassen oder erstellen
        if (this.isMobile) {
            if (!this.touchIndicator) {
                // Erstelle einen Touch-Indikator für mobile Nutzer
                this.touchIndicator = this.add.text(gameWidth / 2, gameHeight - 20, 'Touch & ziehen zum Zielen, loslassen zum Schießen', {
                    fill: '#ffffff',
                    fontSize: '14px',
                    align: 'center'
                });
                this.touchIndicator.setOrigin(0.5);
            } else {
                // Passe bestehenden Indikator an
                this.touchIndicator.setPosition(gameWidth / 2, gameHeight - 20);
            }
        }
        
        // UI-Elemente für Game Over anpassen, falls vorhanden
        if (this.currentState === this.gameStates.GAME_OVER) {
            // Game Over Text neu positionieren
            if (this.gameOverText) {
                this.gameOverText.setPosition(gameWidth / 2, gameHeight / 2 - 40);
            }
            
            // Restart Button neu positionieren
            if (this.restartButton) {
                const buttonWidth = 120;
                const buttonHeight = 40;
                const buttonX = gameWidth / 2 - buttonWidth / 2;
                const buttonY = gameHeight / 2 + 40;
                
                this.restartButton.graphics.clear();
                this.restartButton.graphics.fillStyle(0x4CAF50, 1);
                this.restartButton.graphics.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.restartButton.text.setPosition(gameWidth / 2, buttonY + buttonHeight / 2);
                this.restartButton.zone.setPosition(buttonX + buttonWidth/2, buttonY + buttonHeight/2);
                this.restartButton.zone.setSize(buttonWidth, buttonHeight);
            }
        }
    }
}

const PhaserGame = () => {
    const gameContainerRef = useRef(null);
    const gameInstanceRef = useRef(null);
    
    // Responsive Spielgröße berechnen
    const calculateGameSize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        
        // Im Portrait-Modus nehmen wir die volle Breite und proportionale Höhe
        // Im Landscape-Modus nehmen wir die volle Höhe und proportionale Breite
        if (isPortrait) {
            return {
                width: width,
                height: Math.min(height, width * 1.5), // Verhältnis 2:3
                isPortrait
            };
        } else {
            return {
                width: Math.min(width, height * 1.5), // Verhältnis 3:2
                height: height,
                isPortrait
            };
        }
    };

    useEffect(() => {
        if (gameContainerRef.current && !gameInstanceRef.current) {
            const { width, height, isPortrait } = calculateGameSize();
            
            const config = {
                type: Phaser.AUTO,
                width: width,
                height: height,
                parent: gameContainerRef.current,
                scene: [BootScene],
                backgroundColor: '#1a1a1a',
                input: {
                    touch: {
                        capture: true,
                        preventDefault: false // Erlaube Standard-Touch-Aktionen wenn notwendig
                    }
                },
                scale: {
                    mode: Phaser.Scale.RESIZE, // Automatische Größenanpassung
                    autoCenter: Phaser.Scale.CENTER_BOTH // Zentriere das Spiel
                },
                // Orientierung als Eigenschaft für die Szenen verfügbar machen
                callbacks: {
                    postBoot: (game) => {
                        game.isPortrait = isPortrait;
                    }
                }
            };

            gameInstanceRef.current = new Phaser.Game(config);
        }

        // Event Listener für Orientierungsänderungen und Größenänderungen
        const handleResize = () => {
            if (gameInstanceRef.current) {
                const { width, height, isPortrait } = calculateGameSize();
                gameInstanceRef.current.scale.resize(width, height);
                gameInstanceRef.current.isPortrait = isPortrait;
                
                // Eine benutzerdefinierte Event-Emission für Orientierungsänderungen
                gameInstanceRef.current.events.emit('orientationchange', isPortrait);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
                console.log('Phaser game destroyed');
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return <div ref={gameContainerRef} id="phaser-game-container" style={{width: '100%', height: '100vh'}} />;
};

export default PhaserGame;
