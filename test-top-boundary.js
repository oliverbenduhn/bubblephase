// Test-Script für obere Grenzenkollision
// Füge dieses in die Browser-Konsole ein, um die obere Grenze zu testen

console.log('🧪 TESTE OBERE GRENZENKOLLISION');

// Simuliere eine Bubble, die gegen die obere Kante fliegt
function testTopBoundaryCollision() {
    // Hole die aktuelle Spiel-Instanz
    const gameScene = window.phaserGame?.scene?.scenes?.[0];
    
    if (!gameScene) {
        console.log('❌ Kein Spiel gefunden');
        return;
    }
    
    console.log('✅ Spiel gefunden:', gameScene);
    console.log('🔍 Grid yOffset:', gameScene.grid?.yOffset);
    console.log('🔍 Bubble Radius:', gameScene.BUBBLE_RADIUS);
    
    // Debug-Info über aktuellen Zustand
    if (gameScene.shootingBubble) {
        console.log('🎯 Aktuelle Shooting Bubble:', {
            x: gameScene.shootingBubble.x,
            y: gameScene.shootingBubble.y,
            velocity: gameScene.shootingBubble.gameObject?.body?.velocity
        });
    }
    
    // Teste Kollisionserkennung manuell
    const testPos = { x: 400, y: 20 }; // Position nahe der oberen Kante
    const nearestCell = gameScene.grid ? 
        window.Collision?.findNearestEmptyCell(gameScene.grid, testPos) : 
        null;
        
    console.log('🧪 Test Position:', testPos);
    console.log('🧪 Gefundene Zelle:', nearestCell);
}

// Führe Test aus
testTopBoundaryCollision();

// Kontinuierliches Monitoring
let monitorInterval;
function startMonitoring() {
    monitorInterval = setInterval(() => {
        const gameScene = window.phaserGame?.scene?.scenes?.[0];
        if (gameScene?.shootingBubble) {
            const bubble = gameScene.shootingBubble;
            const gridTop = gameScene.grid?.yOffset || 0;
            const y = bubble.gameObject?.y || bubble.y;
            
            if (y <= gridTop + 50) { // Nahe der oberen Grenze
                console.log('🔝 BUBBLE NAHE OBERER GRENZE:', {
                    bubbleY: y,
                    gridTopY: gridTop,
                    velocity: bubble.gameObject?.body?.velocity
                });
            }
        }
    }, 100);
    
    console.log('📊 Monitoring gestartet - verwende stopMonitoring() zum Stoppen');
}

function stopMonitoring() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        console.log('📊 Monitoring gestoppt');
    }
}

// Starte automatisches Monitoring
startMonitoring();

// Exportiere Funktionen für manuelle Nutzung
window.testTopBoundary = testTopBoundaryCollision;
window.startMonitoring = startMonitoring;
window.stopMonitoring = stopMonitoring;
