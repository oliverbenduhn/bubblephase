# 🐛 Debug-System für Bubble-Andocken

## Aktivierung
Das Debug-System ist bereits aktiviert (DEBUG = true in PhaserGame.jsx).

## Tastatur-Steuerung
- **D-Taste**: Debug-Visualisierung ein/aus
- **G-Taste**: Grid-Visualisierung ein/aus

## Debug-Features

### 1. Visuelle Diagnostik
- **Grid-Visualisierung**: Zeigt besetzte/freie Zellen
- **Kollisions-Bereiche**: Markiert Kollisions-Punkte
- **Andock-Positionen**: Hebt gefundene Ziel-Positionen hervor
- **Bewegungs-Pfade**: Zeigt Bubble-Trajektorien

### 2. Konsolen-Logging
```javascript
// Aktiviert durch DEBUG = true
console.log("🟡 Bubble collision detected!");
console.log("🎯 Collision at bubble position:", x, y);
console.log("📍 Target pixel position:", targetPos);
```

### 3. Performance-Monitoring
- **Timing-Analyse**: Misst Dauer der Andock-Prozesse
- **Frame-by-Frame Tracking**: Überwacht Position über mehrere Frames
- **Physik-Anomalien**: Erkennt unerwartete Bewegungen

### 4. Erweiterte Tracking-Features
- **Movement Tracking**: Verfolgt Bubble-Position in verschiedenen Phasen
- **Physics Analysis**: Überwacht Physik-Zustand vor/nach Änderungen
- **Multi-Frame Detection**: Erkennt "Hüpfen" über 5 Frames

## Problem-Diagnose

### "Hüpfen" der Bubbles erkennen:
1. Schaue in die Browser-Konsole nach:
   ```
   🎭 MOVEMENT TRACKING [PHASE]: {...}
   🔬 PHYSIK-ANALYSE [KONTEXT]: {...}
   🚨 PHYSIK-ANOMALIEN gefunden: [...]
   ```

2. Achte auf diese Anomalien:
   - **UNERWARTETE_BEWEGUNG**: Velocity > 0.1 nach dem Stoppen
   - **POSITION_DESYNC**: GameObject und Bubble-Position stimmen nicht überein

3. Performance-Warnings:
   ```
   🐌 PERFORMANCE WARNING: BUBBLE_POSITIONING dauerte XXms (> 16ms)
   ```

### Debugging-Workflow:
1. Starte das Spiel
2. Drücke **D** um Debug-Visualisierung zu aktivieren
3. Drücke **G** um Grid-Anzeige zu aktivieren
4. Schieße eine Bubble und beobachte:
   - Konsolen-Output
   - Visuelle Marker
   - Performance-Zeiten

## Häufige Probleme und Lösungen

### Problem 1: Bubble "hüpft" nach Andocken
**Symptome:**
- `POSITION_DESYNC` in Konsole
- Visuelle Bewegung nach setPosition()

**Debugging:**
- Multi-Frame Tracking zeigt Position-Änderungen
- Physik-Analyse zeigt aktive Velocity

### Problem 2: Langsames Andocken
**Symptome:**
- Performance-Warnings > 16ms
- Verzögerung beim Bubble-Attachment

**Debugging:**
- Performance-Traces zeigen Bottlenecks
- Timing-Analyse identifiziert langsame Schritte

### Problem 3: Falsche Andock-Position
**Symptome:**
- Bubble dockt an unerwarteter Position an
- Grid-Visualisierung zeigt Diskrepanzen

**Debugging:**
- Kollisions-Bereiche zeigen tatsächlichen Treffpunkt
- Andock-Position-Highlights zeigen berechnete Ziele

## Debug-System erweitern

Um neue Debug-Features hinzuzufügen:

1. In `BubbleDebug.js`:
```javascript
myNewDebugMethod(params) {
    if (!this.debugMode) return;
    // Debug-Logik hier
}
```

2. In `PhaserGame.jsx`:
```javascript
if (this.bubbleDebug && DEBUG) {
    this.bubbleDebug.myNewDebugMethod(params);
}
```

## Performance-Optimierung

Das Debug-System ist nur bei `DEBUG = true` aktiv.
Für Produktion: `const DEBUG = false;`
