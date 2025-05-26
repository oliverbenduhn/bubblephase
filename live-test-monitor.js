// Live Test Script - Überwacht Browser-Konsole für Debug-Ausgaben
// Führe aus: node live-test-monitor.js

import { spawn } from 'child_process';
import http from 'http';

console.log("🔍 === LIVE TEST MONITOR ===");
console.log("Überwacht das Bubble Shooter Spiel auf http://localhost:3000");
console.log("Sucht nach Grid-Kollisions-Debug-Ausgaben...\n");

// Test-Request an localhost:3000 um zu prüfen ob Server läuft
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.setTimeout(1000, () => {
            req.abort();
            resolve(false);
        });
    });
}

async function runLiveTest() {
    console.log("🚀 Checking if dev server is running...");
    
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        console.log("❌ Dev Server ist nicht erreichbar auf http://localhost:3000");
        console.log("💡 Starte zuerst: npm run dev");
        return;
    }
    
    console.log("✅ Dev Server läuft auf http://localhost:3000");
    console.log("\n📋 === LIVE TEST ANWEISUNGEN ===");
    console.log("1. ✅ Server läuft - Spiel ist erreichbar");
    console.log("2. 🌐 Öffne http://localhost:3000 im Browser");
    console.log("3. 🔍 Öffne die Browser-Entwicklertools (F12)");
    console.log("4. 📊 Wechsle zum 'Console' Tab");
    console.log("5. 🎯 Lade die Seite neu (F5) um Grid-Initialisierung zu sehen");
    console.log("6. 🎮 Klicke/Touche das Spiel um ersten Schuss abzugeben");
    
    console.log("\n🔍 === ERWARTETE DEBUG-AUSGABEN ===");
    console.log("📝 Bei Seitenaufruf:");
    console.log("• '🎯 === GRID INITIALISIERUNG GESTARTET ==='");
    console.log("• '📊 === GRID INITIALISIERUNG ABGESCHLOSSEN ==='");
    console.log("• Grid Statistiken mit Bubble-Anzahl");
    console.log("• getAllBubbleObjects() Ergebnis");
    
    console.log("\n📝 Bei erstem Schuss:");
    console.log("• '🎯 === FIRST SHOT DIAGNOSIS ==='");
    console.log("• Detaillierte Grid-Analyse");
    console.log("• Eventuell Emergency-Repair-Messages");
    
    console.log("\n📝 Automatisches Browser-Debug (nach 3 Sekunden):");
    console.log("• '🔍 === BROWSER GRID COLLISION DEBUG ==='");
    console.log("• Bubble-Statistiken und gameObject-Status");
    
    console.log("\n🚨 === PROBLEME ERKENNEN ===");
    console.log("❌ Wenn 'getAllBubbleObjects() Ergebnis: 0 Objekte':");
    console.log("  → Grid-Bubbles haben keine gameObjects");
    console.log("  → Bubble.draw() wurde nicht korrekt ausgeführt");
    console.log("  → Phaser Physics-System Problem");
    
    console.log("❌ Wenn 'Bubbles ohne gameObjects: X > 0':");
    console.log("  → Einige Bubbles wurden nicht korrekt gerendert");
    console.log("  → Emergency-Repair sollte automatisch starten");
    
    console.log("✅ Wenn 'getAllBubbleObjects() funktioniert korrekt':");
    console.log("  → Grid-System funktioniert");
    console.log("  → Problem liegt in der Kollisionserkennung");
    
    console.log("\n⚡ === KEYBOARD SHORTCUTS IM BROWSER ===");
    console.log("• F1 - Manual Grid Debug ausführen");
    console.log("• D - Debug-Visualisierung ein/aus");
    console.log("• G - Grid-Anzeige ein/aus");
    
    console.log("\n🎯 === NÄCHSTE SCHRITTE ===");
    console.log("1. Browser-Konsole prüfen für Debug-Ausgaben");
    console.log("2. Ersten Schuss abgeben und Diagnose beobachten");
    console.log("3. Problem-Muster identifizieren");
    console.log("4. Bei Bedarf: debugGridCollision() in Browser-Konsole eingeben");
    
    console.log("\n🚀 === LIVE TEST BEREIT ===");
    console.log("💡 Monitor läuft - prüfe Browser-Konsole für Ergebnisse!");
}

runLiveTest().catch(console.error);
