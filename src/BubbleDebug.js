/**
 * Debug-System für Bubble-Andocken
 * Visualisiert Grid-Positionen, Kollisionsbereiche und Attachment-Prozess
 */

export class BubbleDebug {
    constructor(scene) {
        this.scene = scene;
        this.debugGraphics = null;
        this.isEnabled = false;
        this.debugInfo = [];
        this.init();
    }

    init() {
        // Erstelle Debug-Graphics-Objekt
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.setDepth(1000); // Über allen anderen Objekten
        
        // Debug-Panel für Text-Informationen
        this.debugText = this.scene.add.text(10, 10, '', {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setDepth(1001);
        this.debugText.setVisible(false);
    }

    enable() {
        this.isEnabled = true;
        this.debugGraphics.setVisible(true);
        this.debugText.setVisible(true);
        console.log("🐛 Bubble Debug aktiviert");
    }

    disable() {
        this.isEnabled = false;
        this.debugGraphics.setVisible(false);
        this.debugText.setVisible(false);
        this.clear();
        console.log("🐛 Bubble Debug deaktiviert");
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    clear() {
        this.debugGraphics.clear();
        this.debugInfo = [];
    }

    /**
     * Zeichnet das Grid-System
     */
    drawGrid(grid) {
        if (!this.isEnabled) return;

        this.debugGraphics.lineStyle(1, 0x444444, 0.5);
        
        // Zeichne Grid-Zellen
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const pos = grid.gridToPixel(row, col);
                const bubble = grid.getBubble(row, col);
                
                // Zell-Kreis
                if (bubble) {
                    this.debugGraphics.lineStyle(2, 0x00ff00, 0.8); // Grün für belegte Zellen
                } else {
                    this.debugGraphics.lineStyle(1, 0x444444, 0.3); // Grau für freie Zellen
                }
                
                this.debugGraphics.strokeCircle(pos.x, pos.y, grid.bubbleRadius);
                
                // Grid-Koordinaten anzeigen
                const coordText = this.scene.add.text(pos.x - 10, pos.y - 5, `${row},${col}`, {
                    fontSize: '8px',
                    fill: bubble ? '#00ff00' : '#666666'
                });
                coordText.setDepth(1002);
            }
        }
    }

    /**
     * Visualisiert den Kollisions-Bereich
     */
    drawCollisionArea(bubble, radius = null) {
        if (!this.isEnabled) return;

        const collisionRadius = radius || bubble.radius * 2;
        this.debugGraphics.lineStyle(2, 0xff0000, 0.8);
        this.debugGraphics.strokeCircle(bubble.x, bubble.y, collisionRadius);
        
        this.addDebugInfo(`Kollision: (${Math.round(bubble.x)}, ${Math.round(bubble.y)}) r=${Math.round(collisionRadius)}`);
    }

    /**
     * Zeigt den Suchbereich für findNearestEmptyCell
     */
    drawSearchArea(centerPos, searchRadius = 4, grid) {
        if (!this.isEnabled) return;

        const gridPos = grid.pixelToGrid(centerPos.x, centerPos.y);
        this.debugGraphics.lineStyle(2, 0x00ffff, 0.6);
        
        // Zeichne Suchbereich
        for (let rOffset = -searchRadius; rOffset <= searchRadius; rOffset++) {
            for (let cOffset = -searchRadius; cOffset <= searchRadius; cOffset++) {
                const testRow = gridPos.row + rOffset;
                const testCol = gridPos.col + cOffset;
                
                if (grid.isValidGridPosition(testRow, testCol)) {
                    const cellPos = grid.gridToPixel(testRow, testCol);
                    this.debugGraphics.strokeCircle(cellPos.x, cellPos.y, grid.bubbleRadius * 0.5);
                }
            }
        }
        
        this.addDebugInfo(`Suche um: (${gridPos.row}, ${gridPos.col})`);
    }

    /**
     * Markiert die gefundene Andock-Position
     */
    highlightAttachmentPosition(gridPos, grid, color = 0xffff00) {
        if (!this.isEnabled) return;

        const pixelPos = grid.gridToPixel(gridPos.row, gridPos.col);
        
        // Gelber Kreis für die Ziel-Position
        this.debugGraphics.lineStyle(3, color, 1.0);
        this.debugGraphics.strokeCircle(pixelPos.x, pixelPos.y, grid.bubbleRadius);
        
        // Kreuz in der Mitte
        this.debugGraphics.lineStyle(2, color, 1.0);
        const crossSize = 10;
        this.debugGraphics.lineBetween(
            pixelPos.x - crossSize, pixelPos.y,
            pixelPos.x + crossSize, pixelPos.y
        );
        this.debugGraphics.lineBetween(
            pixelPos.x, pixelPos.y - crossSize,
            pixelPos.x, pixelPos.y + crossSize
        );
        
        this.addDebugInfo(`Andockung: (${gridPos.row}, ${gridPos.col}) → (${Math.round(pixelPos.x)}, ${Math.round(pixelPos.y)})`);
    }

    /**
     * Zeigt Bubble-Bewegung mit Pfeil
     */
    drawMovementPath(startPos, endPos, color = 0xff00ff) {
        if (!this.isEnabled) return;

        this.debugGraphics.lineStyle(2, color, 0.8);
        this.debugGraphics.lineBetween(startPos.x, startPos.y, endPos.x, endPos.y);
        
        // Pfeilspitze
        const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        this.debugGraphics.lineBetween(
            endPos.x, endPos.y,
            endPos.x - arrowLength * Math.cos(angle - arrowAngle),
            endPos.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.debugGraphics.lineBetween(
            endPos.x, endPos.y,
            endPos.x - arrowLength * Math.cos(angle + arrowAngle),
            endPos.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        
        const distance = Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y);
        this.addDebugInfo(`Bewegung: ${Math.round(distance)}px`);
    }

    /**
     * Zeigt Nachbar-Zellen einer Position
     */
    drawNeighbors(gridPos, grid, color = 0x00ff00) {
        if (!this.isEnabled) return;

        const neighbors = grid.getNeighbors(gridPos.row, gridPos.col);
        this.debugGraphics.lineStyle(1, color, 0.6);
        
        neighbors.forEach(neighbor => {
            const pixelPos = grid.gridToPixel(neighbor.row, neighbor.col);
            this.debugGraphics.strokeCircle(pixelPos.x, pixelPos.y, grid.bubbleRadius * 0.3);
            
            const bubble = grid.getBubble(neighbor.row, neighbor.col);
            if (bubble) {
                this.debugGraphics.fillStyle(color, 0.3);
                this.debugGraphics.fillCircle(pixelPos.x, pixelPos.y, grid.bubbleRadius * 0.2);
            }
        });
        
        this.addDebugInfo(`Nachbarn von (${gridPos.row}, ${gridPos.col}): ${neighbors.length}`);
    }

    /**
     * Debug-Info hinzufügen
     */
    addDebugInfo(info) {
        this.debugInfo.push(info);
        this.updateDebugText();
    }

    /**
     * Aktualisiert den Debug-Text
     */
    updateDebugText() {
        if (!this.isEnabled) return;
        
        const text = this.debugInfo.slice(-10).join('\n'); // Nur letzte 10 Zeilen
        this.debugText.setText(text);
    }

    /**
     * Vollständige Debug-Visualisierung für Bubble-Attachment
     */
    debugAttachment(shootingBubble, grid, nearestCell, collisionPos = null) {
        if (!this.isEnabled) return;

        this.clear();
        
        // 1. Grid zeichnen
        this.drawGrid(grid);
        
        // 2. Bubble-Position vor Kollision
        if (collisionPos) {
            this.debugGraphics.lineStyle(2, 0xff0000, 1.0);
            this.debugGraphics.strokeCircle(collisionPos.x, collisionPos.y, shootingBubble.radius);
            this.addDebugInfo(`Kollision bei: (${Math.round(collisionPos.x)}, ${Math.round(collisionPos.y)})`);
        }
        
        // 3. Aktuelle Bubble-Position
        this.debugGraphics.lineStyle(2, 0xffffff, 1.0);
        this.debugGraphics.strokeCircle(shootingBubble.x, shootingBubble.y, shootingBubble.radius);
        this.addDebugInfo(`Bubble aktuell: (${Math.round(shootingBubble.x)}, ${Math.round(shootingBubble.y)})`);
        
        // 4. Suchbereich
        if (collisionPos) {
            this.drawSearchArea(collisionPos, 4, grid);
        }
        
        // 5. Gefundene Andock-Position
        if (nearestCell) {
            this.highlightAttachmentPosition(nearestCell, grid);
            this.drawNeighbors(nearestCell, grid);
            
            const targetPixel = grid.gridToPixel(nearestCell.row, nearestCell.col);
            
            // 6. Bewegungspfad
            if (collisionPos) {
                this.drawMovementPath(collisionPos, targetPixel);
            } else {
                this.drawMovementPath(
                    { x: shootingBubble.x, y: shootingBubble.y },
                    targetPixel
                );
            }
            
            // 7. Distanz-Info
            const startPos = collisionPos || { x: shootingBubble.x, y: shootingBubble.y };
            const distance = Math.hypot(targetPixel.x - startPos.x, targetPixel.y - startPos.y);
            this.addDebugInfo(`Andock-Distanz: ${Math.round(distance)}px`);
        }
        
        // 8. Physik-Status
        if (shootingBubble.gameObject && shootingBubble.gameObject.body) {
            const body = shootingBubble.gameObject.body;
            this.addDebugInfo(`Physik: enabled=${body.enable}, velocity=(${Math.round(body.velocity.x)}, ${Math.round(body.velocity.y)})`);
        }
    }

    /**
     * Erweiterte Konsolen-Logs für Debug
     */
    logAttachmentDetails(shootingBubble, grid, nearestCell, collisionPos = null) {
        console.group("🐛 BUBBLE ATTACHMENT DEBUG");
        
        if (collisionPos) {
            console.log("🔴 Kollisions-Position:", collisionPos);
        }
        
        console.log("⚪ Bubble-Position:", { x: shootingBubble.x, y: shootingBubble.y });
        
        if (nearestCell) {
            const targetPixel = grid.gridToPixel(nearestCell.row, nearestCell.col);
            console.log("🎯 Andock-Grid:", nearestCell);
            console.log("📍 Andock-Pixel:", targetPixel);
            
            const startPos = collisionPos || { x: shootingBubble.x, y: shootingBubble.y };
            const distance = Math.hypot(targetPixel.x - startPos.x, targetPixel.y - startPos.y);
            console.log("📏 Bewegungs-Distanz:", Math.round(distance), "px");
            
            // Prüfe ob Nachbarn vorhanden sind
            const neighbors = grid.getNeighbors(nearestCell.row, nearestCell.col);
            const adjacentBubbles = neighbors.filter(n => grid.getBubble(n.row, n.col));
            console.log("👥 Angrenzende Bubbles:", adjacentBubbles.length, "/", neighbors.length);
        }
        
        if (shootingBubble.gameObject && shootingBubble.gameObject.body) {
            const body = shootingBubble.gameObject.body;
            console.log("⚙️ Physik-Status:", {
                enabled: body.enable,
                velocity: { x: Math.round(body.velocity.x), y: Math.round(body.velocity.y) },
                immovable: body.immovable
            });
        }
        
        console.groupEnd();
    }
    
    // 🔍 ERWEITERTE TIMING-ANALYSE für das "Hüpfen"
    trackBubbleMovement(bubble, phase = "UNKNOWN") {
        if (!this.debugMode) return;
        
        const timestamp = Date.now();
        const position = {
            x: bubble.x,
            y: bubble.y,
            gameObjectX: bubble.gameObject?.x || 'N/A',
            gameObjectY: bubble.gameObject?.y || 'N/A'
        };
        
        console.log(`🎭 MOVEMENT TRACKING [${phase}]:`, {
            timestamp,
            phase,
            position,
            velocity: bubble.gameObject?.body ? {
                vx: bubble.gameObject.body.velocity.x,
                vy: bubble.gameObject.body.velocity.y
            } : 'N/A'
        });
        
        // Visueller Marker für die Position
        if (this.scene && bubble.x && bubble.y) {
            const marker = this.scene.add.circle(bubble.x, bubble.y, 3, 0xff00ff);
            marker.setDepth(999);
            
            // Automatisches Löschen nach 2 Sekunden
            this.scene.time.delayedCall(2000, () => {
                if (marker && marker.destroy) {
                    marker.destroy();
                }
            });
        }
    }
    
    // 🚨 ANALYSIERE PHYSIK-ANOMALIEN
    analyzePhysicsState(bubble, context = "") {
        if (!this.debugMode || !bubble || !bubble.gameObject) return;
        
        const body = bubble.gameObject.body;
        if (!body) return;
        
        const physicsState = {
            enabled: body.enable,
            immovable: body.immovable,
            velocity: { x: body.velocity.x, y: body.velocity.y },
            position: { x: bubble.gameObject.x, y: bubble.gameObject.y },
            bubblePosition: { x: bubble.x, y: bubble.y },
            worldBounds: body.worldBounds,
            bounce: { x: body.bounce.x, y: body.bounce.y }
        };
        
        console.log(`🔬 PHYSIK-ANALYSE [${context}]:`, physicsState);
        
        // Prüfe auf Anomalien
        const anomalies = [];
        if (Math.abs(physicsState.velocity.x) > 0.1 || Math.abs(physicsState.velocity.y) > 0.1) {
            anomalies.push("UNERWARTETE_BEWEGUNG");
        }
        if (physicsState.position.x !== physicsState.bubblePosition.x || 
            physicsState.position.y !== physicsState.bubblePosition.y) {
            anomalies.push("POSITION_DESYNC");
        }
        
        if (anomalies.length > 0) {
            console.warn(`🚨 PHYSIK-ANOMALIEN gefunden:`, anomalies);
        }
        
        return physicsState;
    }
    
    // 📊 PERFORMANCE-MONITORING für Attachment-Prozess
    startPerformanceTrace(label) {
        if (!this.debugMode) return;
        
        this.performanceTraces = this.performanceTraces || {};
        this.performanceTraces[label] = {
            startTime: performance.now(),
            label
        };
        console.log(`⏱️ PERFORMANCE START: ${label}`);
    }
    
    endPerformanceTrace(label) {
        if (!this.debugMode || !this.performanceTraces?.[label]) return;
        
        const trace = this.performanceTraces[label];
        const duration = performance.now() - trace.startTime;
        
        console.log(`⏱️ PERFORMANCE END: ${label} - ${duration.toFixed(2)}ms`);
        
        if (duration > 16) { // Länger als ein Frame
            console.warn(`🐌 PERFORMANCE WARNING: ${label} dauerte ${duration.toFixed(2)}ms (> 16ms)`);
        }
        
        delete this.performanceTraces[label];
    }
    
    // 🔍 NEUE METHODE: Analysiere Grid-Bubble-GameObject-Status
    analyzeGridBubbleObjects(grid) {
        console.log("🔍 === GRID BUBBLE OBJECTS ANALYSIS ===");
        
        let totalBubbles = 0;
        let bubblesWithGameObjects = 0;
        let bubblesWithPhysics = 0;
        let bubbleDetails = [];
        
        grid.forEachBubble((bubble, row, col) => {
            totalBubbles++;
            const hasGameObject = bubble && bubble.gameObject;
            const hasPhysics = hasGameObject && bubble.gameObject.body;
            
            if (hasGameObject) bubblesWithGameObjects++;
            if (hasPhysics) bubblesWithPhysics++;
            
            bubbleDetails.push({
                position: `(${row}, ${col})`,
                colorId: bubble.colorId,
                hasGameObject: hasGameObject,
                hasPhysics: hasPhysics,
                gameObjectPosition: hasGameObject ? { x: bubble.gameObject.x, y: bubble.gameObject.y } : null,
                bubblePosition: { x: bubble.x, y: bubble.y }
            });
        });
        
        console.log("📊 GRID SUMMARY:");
        console.log(`   Total Bubbles: ${totalBubbles}`);
        console.log(`   With GameObjects: ${bubblesWithGameObjects}`);
        console.log(`   With Physics: ${bubblesWithPhysics}`);
        console.log(`   Missing GameObjects: ${totalBubbles - bubblesWithGameObjects}`);
        
        const allBubbleObjects = grid.getAllBubbleObjects();
        console.log(`   getAllBubbleObjects() returns: ${allBubbleObjects.length} objects`);
        
        if (totalBubbles !== bubblesWithGameObjects) {
            console.warn("⚠️ PROBLEM DETECTED: Some bubbles missing gameObjects!");
            console.log("🔍 MISSING GAMEOBJECTS:");
            bubbleDetails.filter(detail => !detail.hasGameObject).forEach(detail => {
                console.log(`   ${detail.position}: colorId=${detail.colorId}`);
            });
        }
        
        if (allBubbleObjects.length === 0 && totalBubbles > 0) {
            console.error("❌ CRITICAL: Grid has bubbles but getAllBubbleObjects() returns empty array!");
        }
        
        return {
            totalBubbles,
            bubblesWithGameObjects,
            bubblesWithPhysics,
            allBubbleObjectsCount: allBubbleObjects.length,
            details: bubbleDetails
        };
    }
    
    // 🔍 NEUE METHODE: Debug Grid-Kollision Setup
    debugGridCollisionSetup(shootingBubble, grid) {
        console.log("🔍 === GRID COLLISION SETUP DEBUG ===");
        
        if (!shootingBubble || !shootingBubble.gameObject) {
            console.error("❌ No shooting bubble or gameObject for collision setup");
            return false;
        }
        
        console.log("✅ Shooting bubble gameObject:", !!shootingBubble.gameObject);
        console.log("✅ Shooting bubble physics:", !!shootingBubble.gameObject.body);
        
        // Analysiere Grid-Bubbles
        const gridAnalysis = this.analyzeGridBubbleObjects(grid);
        
        // Test collision setup
        const gridBubbles = grid.getAllBubbleObjects();
        console.log("🎯 Collision Setup:");
        console.log(`   Shooting bubble ready: ${!!shootingBubble.gameObject}`);
        console.log(`   Grid bubbles found: ${gridBubbles.length}`);
        console.log(`   Can setup collision: ${gridBubbles.length > 0}`);
        
        if (gridBubbles.length === 0) {
            console.error("❌ COLLISION PROBLEM: No grid bubbles available for collision detection!");
            console.log("🔧 SOLUTION: Ensure all grid bubbles have gameObjects by calling bubble.draw()");
        }
        
        return gridBubbles.length > 0;
    }
}
