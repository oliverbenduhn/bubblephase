// Browser Debug Script - Im Browser-Konsole ausführen
// Kopiere diesen Code in die Browser-Entwicklertools Konsole

function debugGridCollision() {
    console.log("🔍 === BROWSER GRID COLLISION DEBUG ===");
    
    // Finde Phaser Game Instance
    if (typeof window.phaserGame === 'undefined') {
        console.log("❌ Phaser Game nicht gefunden in window.phaserGame");
        return;
    }
    
    const scene = window.phaserGame.scene.scenes[0]; // BootScene
    
    if (!scene) {
        console.log("❌ Scene nicht gefunden");
        return;
    }
    
    console.log("✅ Scene gefunden:", scene.constructor.name);
    
    // Grid prüfen
    if (!scene.grid) {
        console.log("❌ Grid nicht initialisiert");
        return;
    }
    
    console.log("✅ Grid gefunden");
    console.log("📊 Grid Info:");
    console.log("- Grid-Größe:", scene.grid.grid.length, "Reihen");
    
    // Zähle Bubbles im Grid
    let totalBubbles = 0;
    let bubblesWithGameObjects = 0;
    
    for (let row = 0; row < scene.grid.grid.length; row++) {
        for (let col = 0; col < scene.grid.grid[row].length; col++) {
            const bubble = scene.grid.grid[row][col];
            if (bubble) {
                totalBubbles++;
                if (bubble.gameObject) {
                    bubblesWithGameObjects++;
                }
            }
        }
    }
    
    console.log(`📊 Bubble Statistiken:`);
    console.log(`- Total Bubbles: ${totalBubbles}`);
    console.log(`- Bubbles mit gameObjects: ${bubblesWithGameObjects}`);
    console.log(`- Bubbles ohne gameObjects: ${totalBubbles - bubblesWithGameObjects}`);
    
    // getAllBubbleObjects testen
    const bubbleObjects = scene.grid.getAllBubbleObjects();
    console.log(`🎯 getAllBubbleObjects() Ergebnis: ${bubbleObjects.length} Objekte`);
    
    if (bubbleObjects.length === 0) {
        console.log("❌ PROBLEM GEFUNDEN: getAllBubbleObjects() gibt leeres Array zurück!");
        console.log("🔧 Mögliche Ursachen:");
        console.log("- gameObjects wurden nicht erstellt");
        console.log("- draw() wurde nicht für alle Bubbles aufgerufen");
        console.log("- Physics Bodies fehlen");
    } else {
        console.log("✅ getAllBubbleObjects() funktioniert korrekt");
    }
    
    // Debug-System prüfen
    if (scene.bubbleDebug) {
        console.log("✅ BubbleDebug System verfügbar");
        scene.bubbleDebug.analyzeGridBubbleObjects();
    } else {
        console.log("❌ BubbleDebug System nicht initialisiert");
    }
    
    return {
        totalBubbles,
        bubblesWithGameObjects,
        bubbleObjectsLength: bubbleObjects.length,
        scene: scene
    };
}

// Automatisch alle 3 Sekunden Debug-Info ausgeben
let debugInterval = null;

function startContinuousDebug() {
    if (debugInterval) {
        clearInterval(debugInterval);
    }
    
    console.log("🚀 Starte kontinuierliches Grid-Debugging...");
    debugInterval = setInterval(() => {
        debugGridCollision();
    }, 3000);
}

function stopContinuousDebug() {
    if (debugInterval) {
        clearInterval(debugInterval);
        debugInterval = null;
        console.log("⏹️ Kontinuierliches Debugging gestoppt");
    }
}

// Tastatur-Shortcuts für Debug
document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
        debugGridCollision();
    } else if (event.key === 'F2') {
        startContinuousDebug();
    } else if (event.key === 'F3') {
        stopContinuousDebug();
    }
});

console.log("🔧 === BROWSER DEBUG SYSTEM GELADEN ===");
console.log("📝 Verfügbare Befehle:");
console.log("• debugGridCollision() - Einmalige Grid-Analyse");
console.log("• startContinuousDebug() - Kontinuierliches Debugging starten");
console.log("• stopContinuousDebug() - Kontinuierliches Debugging stoppen");
console.log("📝 Tastatur-Shortcuts:");
console.log("• F1 - Grid Debug ausführen");
console.log("• F2 - Kontinuierliches Debug starten");
console.log("• F3 - Kontinuierliches Debug stoppen");
