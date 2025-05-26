// Quick Debug Test - Führe im Terminal aus: node quick-debug-test.js
// Simuliert das Grid-System ohne Phaser um das Problem zu isolieren

console.log("🔍 === QUICK DEBUG TEST FÜR GRID-KOLLISION ===");

// Mock der wichtigsten Klassen
class MockBubble {
    constructor(scene, x, y, radius, colorId) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.colorId = colorId;
        this.gameObject = null;
    }
    
    draw() {
        // Simuliere erfolgreiches gameObject erstellen
        this.gameObject = {
            x: this.x,
            y: this.y,
            radius: this.radius,
            body: { exists: true }
        };
        console.log(`✅ Mock gameObject created for bubble at (${this.x}, ${this.y})`);
        return this.gameObject;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

class MockGrid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.bubbleRadius = 20;
        this.cellWidth = this.bubbleRadius * 2;
        this.cellHeight = this.bubbleRadius * Math.sqrt(3);
        this.xOffset = 0;
        this.yOffset = 0;
        
        for (let r = 0; r < rows; r++) {
            this.grid[r] = new Array(cols).fill(null);
        }
    }
    
    gridToPixel(row, col) {
        const isOddRow = row % 2 !== 0;
        const x = this.xOffset + col * this.cellWidth + (isOddRow ? this.cellWidth / 2 : 0) + this.bubbleRadius;
        const y = this.yOffset + row * this.cellHeight + this.bubbleRadius;
        return { x, y };
    }
    
    forEachBubble(callback) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const bubble = this.grid[row][col];
                if (bubble) {
                    callback(bubble, row, col);
                }
            }
        }
    }
    
    getAllBubbleObjects() {
        const bubbleObjects = [];
        this.forEachBubble((bubble) => {
            if (bubble && bubble.gameObject) {
                bubbleObjects.push(bubble.gameObject);
            }
        });
        return bubbleObjects;
    }
    
    initializeWithBubbles(numRowsToFill) {
        console.log(`📝 Initialisiere Grid mit ${numRowsToFill} Reihen...`);
        
        for (let r = 0; r < Math.min(numRowsToFill, this.rows); r++) {
            const colsInThisRow = this.cols - (r % 2 === 0 ? 0 : 1);
            for (let c = 0; c < colsInThisRow; c++) {
                const { x, y } = this.gridToPixel(r, c);
                const bubble = new MockBubble(null, x, y, this.bubbleRadius, Math.floor(Math.random() * 4));
                bubble.setPosition(x, y);
                bubble.draw(); // KRITISCH!
                this.grid[r][c] = bubble;
            }
        }
        
        console.log(`✅ Grid initialisiert mit ${numRowsToFill} Reihen`);
    }
}

// Test ausführen
function runDebugTest() {
    console.log("🚀 Erstelle Mock Grid...");
    const grid = new MockGrid(8, 10);
    
    console.log("📊 Grid-Status vor Initialisierung:");
    console.log(`- Rows: ${grid.rows}, Cols: ${grid.cols}`);
    console.log(`- getAllBubbleObjects(): ${grid.getAllBubbleObjects().length} objects`);
    
    console.log("\n🎯 Initialisiere Grid mit Bubbles...");
    grid.initializeWithBubbles(6);
    
    console.log("\n📊 Grid-Status nach Initialisierung:");
    
    // Zähle Bubbles
    let totalBubbles = 0;
    let bubblesWithGameObjects = 0;
    
    grid.forEachBubble((bubble) => {
        totalBubbles++;
        if (bubble.gameObject) {
            bubblesWithGameObjects++;
        }
    });
    
    console.log(`- Total Bubbles: ${totalBubbles}`);
    console.log(`- Bubbles mit gameObjects: ${bubblesWithGameObjects}`);
    console.log(`- Bubbles ohne gameObjects: ${totalBubbles - bubblesWithGameObjects}`);
    
    const bubbleObjects = grid.getAllBubbleObjects();
    console.log(`- getAllBubbleObjects(): ${bubbleObjects.length} objects`);
    
    if (bubbleObjects.length === 0) {
        console.log("❌ PROBLEM BESTÄTIGT: getAllBubbleObjects() gibt leeres Array zurück!");
        console.log("🔍 Analysiere einzelne Bubbles...");
        
        grid.forEachBubble((bubble, row, col) => {
            console.log(`Bubble[${row}][${col}]: exists=${!!bubble}, gameObject=${!!bubble?.gameObject}`);
        });
    } else if (bubbleObjects.length === totalBubbles) {
        console.log("✅ ALLES OK: Alle Bubbles haben gameObjects");
    } else {
        console.log("⚠️ TEILPROBLEM: Einige Bubbles haben keine gameObjects");
    }
    
    return {
        totalBubbles,
        bubblesWithGameObjects,
        bubbleObjectsLength: bubbleObjects.length
    };
}

// Test ausführen
const result = runDebugTest();

console.log("\n🏁 === TEST ABGESCHLOSSEN ===");
console.log("📊 Ergebnis:", result);

if (result.bubbleObjectsLength === result.totalBubbles && result.totalBubbles > 0) {
    console.log("✅ MOCK TEST ERFOLGREICH - Problem liegt wahrscheinlich im Phaser-Setup");
} else {
    console.log("❌ MOCK TEST ZEIGT PROBLEM - Logik-Fehler im Grid-System");
}
