import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { Grid } from './Grid';
import { Bubble } from './Bubble';
import { Shooter } from './Shooter';
import { Collision } from './Collision';
import { MobileOptimization } from './MobileOptimization';
import { TouchMenu } from './TouchMenu';
import { ColorGroup } from './ColorGroup';
import { BUBBLE_COLORS, BUBBLE_RADIUS, CURRENT_BUBBLE_COLORS, switchColorTheme, getCurrentTheme, getRandomColorId, getAvailableColorIds, COLOR_THEMES } from './config';
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
        this.INITIAL_ROWS = 6; // Anzahl der Reihen, die zu Beginn mit Bubbles gefüllt werden
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
        
        // Hintergrund-Grafik für Theme-Wechsel
        this.backgroundGradient = null;
    }

    // ... restlicher Code unverändert ...

    someMethod() {
        // Beispiel für den Bereich mit den Event-Listenern
        // Visuelles Feedback beim Hover
        // Entferne pointerover und pointerout Event-Listener für bessere mobile Kompatibilität
        // Stattdessen kann pointerdown oder tap Events verwendet werden, falls gewünscht
        buttonZone.on('pointerdown', () => {
            this.switchColorTheme();
        });
    }
}
