// Ensure BUBBLE_RADIUS and BUBBLE_COLORS are correctly imported from config.js
import { BUBBLE_RADIUS, BUBBLE_COLORS, CURRENT_BUBBLE_COLORS, getRandomColorId } from './config';
import { Bubble } from './Bubble';

export class Grid {
  constructor(scene, rows, cols, xOffset = 0, yOffset = 0, bubbleRadius = BUBBLE_RADIUS) {
    this.scene = scene;
    this.rows = rows;
    this.cols = cols;
    this.xOffset = xOffset; // Horizontal offset for the entire grid
    this.yOffset = yOffset; // Vertical offset for the entire grid
    this.bubbleRadius = bubbleRadius; // Radius of a bubble
    this.grid = [];
    this.cellWidth = this.bubbleRadius * 2; // Width of a bubble cell
    // Exact vertical distance for a hexagonal grid (distance between centers of bubbles in adjacent rows)
    this.cellHeight = this.bubbleRadius * Math.sqrt(3);

    // Initialize the grid with empty slots (null)
    for (let r = 0; r < rows; r++) {
      this.grid[r] = new Array(cols).fill(null);
    }
  }

  // Converts grid coordinates (row, col) to pixel coordinates (x, y)
  gridToPixel(row, col) {
    // The x-position depends on the column and whether the row is even or odd.
    // In odd rows, bubbles are shifted half a cell width to the right for hexagonal packing.
    const isOddRow = row % 2 !== 0;
    const x = this.xOffset + col * this.cellWidth + (isOddRow ? this.cellWidth / 2 : 0) + this.bubbleRadius;
    
    // The y-position is calculated from the row index and the height of a hexagonal cell.
    // We add BUBBLE_RADIUS to center the bubble's origin (which is usually its center).
    const y = this.yOffset + row * this.cellHeight + this.bubbleRadius;
    
    return { x, y };
  }

  // Converts pixel coordinates (x, y) to grid coordinates (row, col)
  pixelToGrid(x, y) {
    let closestRow = -1;
    let closestCol = -1;
    let minDistSq = Number.MAX_VALUE;

    // Iterate through all possible grid cells to find the closest one
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Calculate the center point of this grid cell
        const cellCenter = this.gridToPixel(r, c);
        const dx = x - cellCenter.x;
        const dy = y - cellCenter.y;
        const distSq = dx * dx + dy * dy; // Squared distance to avoid sqrt for performance

        // If this cell is closer than the current closest, remember it
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestRow = r;
          closestCol = c;
        }
      }
    }
    return { row: closestRow, col: closestCol };
  }

  // Adds a bubble instance to a specific grid position
  addBubble(row, col, bubbleInstance) {
    if (this.isValidGridPosition(row, col)) {
      this.grid[row][col] = bubbleInstance;
      const { x, y } = this.gridToPixel(row, col);
      bubbleInstance.setPosition(x, y); // Set the bubble's visual position
      
      // Stelle sicher, dass das Phaser-Grafikobjekt gezeichnet ist und Physik aktiviert ist
      // In Tests nur zeichnen wenn nötig (Performance-Optimierung)
      if (!bubbleInstance.gameObject && this.scene && typeof this.scene.add !== 'undefined') {
        bubbleInstance.draw();
        // console.log entfernt für bessere Performance in Tests
      }
      
      return true;
    }
    return false;
  }

  // Retrieves a bubble from a specific grid position
  getBubble(row, col) {
    if (this.isValidGridPosition(row, col)) {
      return this.grid[row][col];
    }
    return null;
  }

  // Removes a bubble from a specific grid position
  removeBubble(row, col) {
    if (this.isValidGridPosition(row, col) && this.grid[row][col]) {
      const bubble = this.grid[row][col];
      this.grid[row][col] = null; // Remove from the data structure
      return bubble; 
    }
    return null;
  }

  // Removes multiple bubbles from the grid based on a list of positions
  removeBubbles(positions) {
    positions.forEach(pos => {
      if (this.isValidGridPosition(pos.row, pos.col)) {
        const bubble = this.grid[pos.row][pos.col];
        if (bubble) {
          bubble.destroy(); // Visually destroy the bubble (e.g., Phaser.GameObjects.Sprite.destroy)
          this.grid[pos.row][pos.col] = null; // Remove from the data structure
        }
      }
    });
  }

  // Checks if a grid position is valid
  isValidGridPosition(row, col) {
    // Prüfe auf null/undefined und nicht-numerische Werte
    if (row == null || col == null || 
        typeof row !== 'number' || typeof col !== 'number' ||
        !isFinite(row) || !isFinite(col)) {
      return false;
    }
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  // Gets all valid neighbors of a given cell
  getNeighbors(row, col) {
    const neighbors = [];
    const isOddRow = row % 2 !== 0;

    // Define potential neighbor offsets based on hexagonal grid structure
    // For even rows: (0,-1), (0,1), (-1,0), (-1,1), (1,0), (1,1)
    // For odd rows:  (0,-1), (0,1), (-1,-1), (-1,0), (1,-1), (1,0)
    const neighborOffsets = isOddRow ? [
      { r: 0, c: -1 }, { r: 0, c: 1 },  // Left, Right
      { r: -1, c: -1 }, { r: -1, c: 0 }, // Top-Left, Top-Right
      { r: 1, c: -1 }, { r: 1, c: 0 }   // Bottom-Left, Bottom-Right
    ] : [
      { r: 0, c: -1 }, { r: 0, c: 1 },  // Left, Right
      { r: -1, c: 0 }, { r: -1, c: 1 }, // Top-Left, Top-Right
      { r: 1, c: 0 }, { r: 1, c: 1 }   // Bottom-Left, Bottom-Right
    ];
    
    for (const offset of neighborOffsets) {
      const neighborRow = row + offset.r;
      const neighborCol = col + offset.c;

      if (this.isValidGridPosition(neighborRow, neighborCol)) {
        neighbors.push({ row: neighborRow, col: neighborCol });
      }
    }
    return neighbors;
  }

  // Finds the row and column of a given Bubble instance or Phaser GameObject in the grid
  findCellByBubble(bubbleInput) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const bubble = this.grid[r][c];
        if (bubble && (bubble === bubbleInput || bubble.gameObject === bubbleInput)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  // Führt eine Callback-Funktion für jede Bubble im Gitter aus
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

  // Gibt alle Bubble-GameObjects zurück (für Kollisionserkennung)
  getAllBubbleObjects() {
    const bubbleObjects = [];
    this.forEachBubble((bubble) => {
      if (bubble && bubble.gameObject) {
        bubbleObjects.push(bubble.gameObject);
      }
    });
    return bubbleObjects;
  }

  // Initialisiert das Gitter mit einer bestimmten Anzahl von Reihen mit Bubbles
  initializeWithBubbles(numRowsToFill) {
    for (let r = 0; r < Math.min(numRowsToFill, this.rows); r++) {
      const colsInThisRow = this.cols - (r % 2 === 0 ? 0 : 1); // Kleine Anpassung für Hex-Optik
      for (let c = 0; c < colsInThisRow; c++) {
        const randomColorId = getRandomColorId(); // Verwende logische Farb-ID
        const { x, y } = this.gridToPixel(r, c);
        const bubble = new Bubble(this.scene, x, y, this.bubbleRadius, randomColorId);
        bubble.setPosition(x, y); // Explizit die Position setzen
        bubble.draw(); // Zeichne die Bubble in der Szene
        this.grid[r][c] = bubble;
      }
    }
  }

  /**
   * Findet alle Bubbles, die mit der obersten Reihe verbunden sind
   * @returns {Set<string>} Set von "row-col" Strings für verbundene Bubbles
   */
  findConnectedToTop() {
    const connected = new Set();
    const stack = [];

    // Starte mit allen Bubbles in der obersten Reihe
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[0][col]) {
        stack.push({ row: 0, col });
        connected.add(`0-${col}`);
      }
    }

    // Tiefensuche, um alle verbundenen Bubbles zu finden
    while (stack.length > 0) {
      const current = stack.pop();
      const neighbors = this.getNeighbors(current.row, current.col);

      for (const neighbor of neighbors) {
        const key = `${neighbor.row}-${neighbor.col}`;
        if (!connected.has(key) && this.grid[neighbor.row][neighbor.col]) {
          connected.add(key);
          stack.push(neighbor);
        }
      }
    }

    return connected;
  }

  /**
   * Findet und entfernt alle Bubbles, die nicht mit der obersten Reihe verbunden sind
   * @returns {Array<{row: number, col: number}>} Array der Positionen der entfernten Bubbles
   */
  removeFloatingBubbles() {
    const connectedToTop = this.findConnectedToTop();
    const floatingBubbles = [];

    // Finde alle Bubbles, die nicht mit der obersten Reihe verbunden sind
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const key = `${row}-${col}`;
        if (this.grid[row][col] && !connectedToTop.has(key)) {
          floatingBubbles.push({ row, col });
        }
      }
    }

    // Entferne die freischwebenden Bubbles
    if (floatingBubbles.length > 0) {
      this.removeBubbles(floatingBubbles);
    }

    return floatingBubbles;
  }

  /**
   * Serialisiert den aktuellen Zustand des Grids in ein einfaches Datenformat.
   * @returns {Array<Array<Object|null>>} Ein Array, das den Zustand des Grids darstellt.
   */
  serialize() {
    const serializedGrid = [];
    for (let r = 0; r < this.rows; r++) {
      serializedGrid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const bubble = this.grid[r][c];
        if (bubble) {
          // Speichere die logische Farb-ID statt des tatsächlichen Farbwerts
          serializedGrid[r][c] = { colorId: bubble.colorId };
        } else {
          serializedGrid[r][c] = null;
        }
      }
    }
    return serializedGrid;
  }

  /**
   * Lädt einen Spielstand und rekonstruiert das Grid.
   * @param {Array<Array<Object|null>>} serializedGrid Der serialisierte Grid-Zustand.
   */
  deserialize(serializedGrid) {
    // Zuerst alle vorhandenen Bubbles zerstören
    this.forEachBubble((bubble) => {
      if (bubble && bubble.gameObject) {
        bubble.destroy();
      }
    });

    // Grid leeren
    for (let r = 0; r < this.rows; r++) {
      this.grid[r].fill(null);
    }

    // Grid aus den serialisierten Daten neu aufbauen
    for (let r = 0; r < serializedGrid.length; r++) {
      for (let c = 0; c < serializedGrid[r].length; c++) {
        const bubbleData = serializedGrid[r][c];
        if (bubbleData) {
          const { x, y } = this.gridToPixel(r, c);
          // Verwende die logische Farb-ID statt des direkten Farbwerts
          const bubble = new Bubble(this.scene, x, y, this.bubbleRadius, bubbleData.colorId);
          bubble.setPosition(x, y);
          bubble.draw();
          this.grid[r][c] = bubble;
        }
      }
    }
  }

  /**
   * Findet die nächste freie Gitterzelle basierend auf der Position einer Bubble
   * @param {Object} bubble - Die Bubble mit x und y Koordinaten
   * @returns {Object|null} - Ein Objekt mit row und col der nächsten freien Zelle oder null, wenn keine gefunden wurde
   */
  findNearestFreeCell(bubble) {
    let nearestCell = null;
    let minDistance = Infinity;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === null) { // Nur freie Zellen prüfen
          const cellX = this.xOffset + c * this.cellWidth + (r % 2 === 0 ? 0 : this.bubbleRadius);
          const cellY = this.yOffset + r * this.cellHeight;
          const dx = bubble.x - cellX;
          const dy = bubble.y - cellY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            minDistance = distance;
            nearestCell = { row: r, col: c };
          }
        }
      }
    }

    return nearestCell;
  }

  /**
   * Zählt die Anzahl der Bubbles im Grid
   * @returns {number} Anzahl der Bubbles
   */
  countBubbles() {
    let count = 0;
    this.forEachBubble(() => count++);
    return count;
  }

  /**
   * Überprüft, ob das Grid leer ist
   * @returns {boolean} true wenn keine Bubbles vorhanden sind
   */
  isEmpty() {
    return this.countBubbles() === 0;
  }
}
