# Bubble Shooter Game

Dieses Projekt ist ein Bubble Shooter Spiel, entwickelt mit [Phaser 3](https://phaser.io/), React und modernen Webtechnologien.

## Features

- Hexagonales Gitter mit Bubbles in verschiedenen Farben
- Schießen von Bubbles mit Maus oder Touch-Steuerung
- Erkennung und Entfernung von Gruppen gleichfarbiger Bubbles
- Erkennung und Entfernung von freischwebenden Bubbles
- Mobile Optimierungen mit Touch-Steuerelementen
- Responsive Layout für verschiedene Bildschirmgrößen und Ausrichtungen
- Partikeleffekte bei Bubble-Explosionen
- Game Over und Neustart-Funktionalität

## Installation

1. Repository klonen:
   ```bash
   git clone <repository-url>
   cd bubblephase
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

4. Öffne im Browser:
   ```
   http://localhost:3000
   ```

## Projektstruktur

- `src/` - Quellcode des Spiels
  - `PhaserGame.jsx` - Hauptkomponente und Spiel-Logik
  - `Grid.js` - Logik für das hexagonale Gitter
  - `Bubble.js` - Bubble-Klasse und Darstellung
  - `Shooter.js` - Steuerung der Kanone und Schuss-Logik
  - `Collision.js` - Kollisions- und Gruppen-Erkennung
  - `MobileOptimization.js` - Touch-Steuerung und mobile Optimierungen
  - `config.js` - Konfigurationswerte wie Farben und Größen
- `assets/` - Grafiken und andere Ressourcen
- `.gitignore` - Git Ignore Datei
- `README.md` - Dieses Dokument

## Nutzung

- Klicke oder tippe auf den Bildschirm, um Bubbles zu schießen.
- Ziel ist es, Gruppen von mindestens 3 gleichfarbigen Bubbles zu bilden, um sie zu entfernen.
- Das Spiel endet, wenn die Bubbles die untere Game-Over-Linie erreichen.
- Nutze die Neustart-Funktion, um ein neues Spiel zu starten.

## Abhängigkeiten

- [Phaser 3](https://phaser.io/)
- React
- Vite (für den Entwicklungsserver)

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

---

Viel Spaß beim Spielen!
