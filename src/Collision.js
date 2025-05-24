import { BUBBLE_RADIUS } from './config';

export class Collision {
  /**
   * Überprüft, ob zwei Bubbles miteinander kollidieren
   * @param {Object} bubble1 - Erste Bubble mit x und y Koordinaten
   * @param {Object} bubble2 - Zweite Bubble mit x und y Koordinaten
   * @param {number} threshold - Minimaler Abstand für Kollision (normalerweise 2 * BUBBLE_RADIUS)
   * @returns {boolean} - true wenn Kollision erkannt wurde
   */
  static checkBubbleCollision(bubble1, bubble2, threshold = BUBBLE_RADIUS * 2) {
    const dx = bubble1.x - bubble2.x;
    const dy = bubble1.y - bubble2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= threshold;
  }

  /**
   * Findet die nächste freie Gitterzelle, in die eine Bubble "einrasten" sollte
   * @param {Object} grid - Grid-Objekt
   * @param {Object} movingBubble - Die sich bewegende Bubble
   * @returns {Object|null} - {row, col} der nächsten freien Zelle oder null wenn keine passende gefunden wurde
   */
  static findNearestEmptyCell(grid, movingBubble) {
    const x = movingBubble.x;
    const y = movingBubble.y;
    
    console.log(`🎯 Finding nearest cell for bubble at (${x}, ${y})`);
    
    // Bestimme die ungefähre Gitterposition
    const approxGridPos = grid.pixelToGrid(x, y);
    console.log(`📍 Approximate grid position: (${approxGridPos.row}, ${approxGridPos.col})`);
    
    // Strategie 1: Prüfe zuerst, ob die ungefähre Position gültig und frei ist
    if (grid.isValidGridPosition(approxGridPos.row, approxGridPos.col) && 
        !grid.getBubble(approxGridPos.row, approxGridPos.col)) {
      console.log(`✅ Found valid empty cell at approximate position: (${approxGridPos.row}, ${approxGridPos.col})`);
      return approxGridPos;
    }
    
    // Strategie 2: Suche in der Nähe der ungefähren Position nach freien Zellen
    const searchRadius = 2;
    let bestCell = null;
    let minDistance = Number.MAX_VALUE;
    
    for (let r = -searchRadius; r <= searchRadius; r++) {
      for (let c = -searchRadius; c <= searchRadius; c++) {
        const testRow = approxGridPos.row + r;
        const testCol = approxGridPos.col + c;
        
        if (grid.isValidGridPosition(testRow, testCol) && !grid.getBubble(testRow, testCol)) {
          const cellPos = grid.gridToPixel(testRow, testCol);
          const dx = x - cellPos.x;
          const dy = y - cellPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            bestCell = { row: testRow, col: testCol };
          }
        }
      }
    }
    
    if (bestCell) {
      console.log(`✅ Found nearby empty cell at: (${bestCell.row}, ${bestCell.col}) - distance: ${minDistance.toFixed(2)}`);
      return bestCell;
    }
    
    // Strategie 3: Suche nach Kollision mit vorhandenen Bubbles und finde Nachbarzelle
    let closestBubble = null;
    let minBubbleDistance = Number.MAX_VALUE;

    grid.forEachBubble((gridBubble, row, col) => {
      const dx = x - gridBubble.x;
      const dy = y - gridBubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Kollisionsschwelle für Bubbles
      if (distance < minBubbleDistance && distance <= BUBBLE_RADIUS * 2.5) {
        minBubbleDistance = distance;
        closestBubble = { bubble: gridBubble, row, col };
      }
    });
    
    if (!closestBubble) {
      console.log("❌ No collision with existing bubbles detected");
      return null;
    }
    
    console.log(`🎯 Found collision with bubble at grid (${closestBubble.row}, ${closestBubble.col})`);
    
    // Finde die beste Nachbarzelle für die Kollisions-Bubble
    // Finde die beste Nachbarzelle für die Kollisions-Bubble
    const neighbors = grid.getNeighbors(closestBubble.row, closestBubble.col);
    let bestNeighbor = null;
    let minNeighborDistance = Number.MAX_VALUE;
    
    for (const neighbor of neighbors) {
      if (!grid.getBubble(neighbor.row, neighbor.col)) {
        const neighborPos = grid.gridToPixel(neighbor.row, neighbor.col);
        const dx = x - neighborPos.x;
        const dy = y - neighborPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minNeighborDistance) {
          minNeighborDistance = distance;
          bestNeighbor = neighbor;
        }
      }
    }
    
    if (bestNeighbor) {
      console.log(`✅ Found neighbor cell at: (${bestNeighbor.row}, ${bestNeighbor.col}) - distance: ${minNeighborDistance.toFixed(2)}`);
      return bestNeighbor;
    }
    
    console.log("❌ No valid neighbor position found");
    return null;
  }

  /**
   * Überprüft, ob die bewegte Bubble mit irgendeiner Bubble im Grid kollidiert
   * @param {Object} movingBubble - Die sich bewegende Bubble
   * @param {Object} grid - Grid-Objekt mit Methode forEachBubble
   * @returns {Object|null} - Die erste kollidierende Bubble oder null, wenn keine Kollision
   */
  static checkGridCollision(movingBubble, grid) {
    let collidingBubble = null;
    
    grid.forEachBubble((gridBubble, row, col) => {
      if (collidingBubble) return; // Wenn bereits eine Kollision gefunden wurde, nicht weiter suchen
      
      if (Collision.checkBubbleCollision(movingBubble, gridBubble)) {
        collidingBubble = gridBubble;
      }
    });
    
    return collidingBubble;
  }

  /**
   * Findet zusammenhängende Gruppen von Bubbles der gleichen Farbe
   * @param {Grid} grid - Das Spielfeld-Grid
   * @param {number} startRow - Startreihe für die Suche
   * @param {number} startCol - Startspalte für die Suche
   * @param {number} minGroupSize - Mindestgröße für eine gültige Gruppe
   * @returns {Object} Ein Objekt mit der Gruppengröße und den Positionen der Bubbles
   */
  static findColorGroup(grid, startRow, startCol, minGroupSize) {
    const startBubble = grid.getBubble(startRow, startCol);
    if (!startBubble) {
      return { size: 0, positions: [] };
    }

    const targetColor = startBubble.color;
    const visited = new Set();
    const positions = [];

    const dfs = (row, col) => {
      const posKey = `${row},${col}`;
      
      if (!grid.isValidGridPosition(row, col) || visited.has(posKey)) {
        return;
      }

      const bubble = grid.getBubble(row, col);
      if (!bubble || bubble.color !== targetColor) {
        return;
      }

      visited.add(posKey);
      positions.push({ row, col });

      const neighbors = [];
      
      if (row % 2 === 0) {
        // Gerade Reihen
        neighbors.push(
          [row - 1, col - 1], [row - 1, col],
          [row, col + 1], [row + 1, col],
          [row + 1, col - 1], [row, col - 1]
        );
      } else {
        // Ungerade Reihen
        neighbors.push(
          [row - 1, col], [row - 1, col + 1],
          [row, col + 1], [row + 1, col + 1],
          [row + 1, col], [row, col - 1]
        );
      }

      for (const [nextRow, nextCol] of neighbors) {
        dfs(nextRow, nextCol);
      }
    };

    dfs(startRow, startCol);

    return {
      size: positions.length,
      positions: positions
    };
  }

  /**
   * Identifiziert Bubbles, die nicht mit der Decke verbunden sind (freischwebende Bubbles)
   * @param {Object} grid - Das Grid-Objekt
   * @returns {Array} - Array mit Positionen der freischwebenden Bubbles
   */
  static findFloatingBubbles(grid) {
    const visited = new Set();
    const floatingBubbles = [];

    const markConnectedBubbles = (row, col) => {
      const key = `${row},${col}`;
      if (visited.has(key)) return;
      
      if (!grid.isValidGridPosition(row, col) || !grid.getBubble(row, col)) return;
      
      visited.add(key);

      let directions;
      if (row % 2 === 0) {
        directions = [
          { row: -1, col: -1 }, { row: -1, col: 0 },
          { row: 0, col: -1 },  { row: 0, col: 1 },
          { row: 1, col: -1 },  { row: 1, col: 0 }
        ];
      } else {
        directions = [
          { row: -1, col: 0 }, { row: -1, col: 1 },
          { row: 0, col: -1 }, { row: 0, col: 1 },
          { row: 1, col: 0 },  { row: 1, col: 1 }
        ];
      }

      for (const dir of directions) {
        markConnectedBubbles(row + dir.row, col + dir.col);
      }
    };

    for (let c = 0; c < grid.cols; c++) {
      if (grid.getBubble(0, c)) {
        markConnectedBubbles(0, c);
      }
    }

    grid.forEachBubble((bubble, row, col) => {
      const key = `${row},${col}`;
      if (!visited.has(key)) {
        floatingBubbles.push({ row, col });
      }
    });

    return floatingBubbles;
  }
}
