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
    
    console.log(`[findNearestEmptyCell] Input: bubble at (${x}, ${y})`);
    
    const approxGridPos = grid.pixelToGrid(x, y);
    console.log(`[findNearestEmptyCell] Approx grid position from grid.pixelToGrid: (${approxGridPos.row}, ${approxGridPos.col})`);
    
    // Strategie 1: Prüfe zuerst, ob die ungefähre Position gültig und frei ist
    const isApproxValid = grid.isValidGridPosition(approxGridPos.row, approxGridPos.col);
    const isApproxEmpty = isApproxValid && !grid.getBubble(approxGridPos.row, approxGridPos.col);
    console.log(`[findNearestEmptyCell] Strategy 1: approxPos (${approxGridPos.row},${approxGridPos.col}) is valid: ${isApproxValid}, is empty: ${isApproxEmpty}`);

    if (isApproxValid && isApproxEmpty) {
      console.log(`[findNearestEmptyCell] Strategy 1 SUCCESS: Returning approximate position: (${approxGridPos.row}, ${approxGridPos.col})`);
      return approxGridPos;
    }
    console.log('[findNearestEmptyCell] Strategy 1 FAILED or cell occupied.');

    // Strategie 2: Suche in der Nähe der ungefähren Position nach freien Zellen
    const searchRadius = 2;
    let bestCell = null;
    let minDistance = Number.MAX_VALUE;
    console.log(`[findNearestEmptyCell] Strategy 2: Searching in radius ${searchRadius} around (${approxGridPos.row}, ${approxGridPos.col})`);

    for (let rOffset = -searchRadius; rOffset <= searchRadius; rOffset++) {
      for (let cOffset = -searchRadius; cOffset <= searchRadius; cOffset++) {
        const testRow = approxGridPos.row + rOffset;
        const testCol = approxGridPos.col + cOffset;
        
        if (grid.isValidGridPosition(testRow, testCol) && !grid.getBubble(testRow, testCol)) {
          const cellPos = grid.gridToPixel(testRow, testCol);
          const dx = x - cellPos.x;
          const dy = y - cellPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          // console.log(`[findNearestEmptyCell] Strategy 2: Testing empty cell (${testRow},${testCol}). Dist: ${distance.toFixed(2)}`);
          if (distance < minDistance) {
            minDistance = distance;
            bestCell = { row: testRow, col: testCol };
            // console.log(`[findNearestEmptyCell] Strategy 2: New bestCell: (${bestCell.row},${bestCell.col}), dist: ${minDistance.toFixed(2)}`);
          }
        }
      }
    }
    
    if (bestCell) {
      console.log(`[findNearestEmptyCell] Strategy 2 SUCCESS: Returning bestCell: (${bestCell.row}, ${bestCell.col}) - distance: ${minDistance.toFixed(2)}`);
      return bestCell;
    }
    console.log('[findNearestEmptyCell] Strategy 2 FAILED to find any empty cell in radius.');

    // Strategie 3: Suche nach Kollision mit vorhandenen Bubbles und finde Nachbarzelle
    console.log('[findNearestEmptyCell] Strategy 3: Looking for closest bubble to snap to.');
    let closestBubbleInfo = null;
    let minBubbleDistance = Number.MAX_VALUE;

    grid.forEachBubble((gridBubble, row, col) => {
      // Use the center of the grid cell for accurate distance, not potentially stale bubble object coordinates
      const cellCenter = grid.gridToPixel(row, col);
      const dx = x - cellCenter.x;
      const dy = y - cellCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if this bubble is close enough to be considered for snapping
      if (distance < minBubbleDistance && distance <= BUBBLE_RADIUS * 2.5) { // Consider only bubbles within a certain range
        minBubbleDistance = distance;
        closestBubbleInfo = { row, col };
      }
    });
    
    if (!closestBubbleInfo) {
      console.log("[findNearestEmptyCell] Strategy 3 FAILED: No nearby bubble found to snap against.");
      return null;
    }
    
    console.log(`[findNearestEmptyCell] Strategy 3: Found closest existing bubble at grid (${closestBubbleInfo.row}, ${closestBubbleInfo.col}) to snap against.`);
    
    const neighbors = grid.getNeighbors(closestBubbleInfo.row, closestBubbleInfo.col);
    let bestNeighborCell = null;
    let minNeighborDistance = Number.MAX_VALUE;
    console.log(`[findNearestEmptyCell] Strategy 3: Checking ${neighbors.length} neighbors of (${closestBubbleInfo.row},${closestBubbleInfo.col})`);

    for (const neighbor of neighbors) {
      if (!grid.getBubble(neighbor.row, neighbor.col)) {
        const neighborPos = grid.gridToPixel(neighbor.row, neighbor.col);
        const dx = x - neighborPos.x;
        const dy = y - neighborPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // console.log(`[findNearestEmptyCell] Strategy 3: Testing empty neighbor (${neighbor.row},${neighbor.col}). Dist to movingBubble: ${distance.toFixed(2)}`);
        if (distance < minNeighborDistance) {
          minNeighborDistance = distance;
          bestNeighborCell = neighbor;
          // console.log(`[findNearestEmptyCell] Strategy 3: New best neighbor: (${bestNeighborCell.row},${bestNeighborCell.col}), dist: ${minNeighborDistance.toFixed(2)}`);
        }
      }
    }
    
    if (bestNeighborCell) {
      console.log(`[findNearestEmptyCell] Strategy 3 SUCCESS: Returning best neighbor: (${bestNeighborCell.row}, ${bestNeighborCell.col}) - distance to movingBubble: ${minNeighborDistance.toFixed(2)}`);
      return bestNeighborCell;
    }
    
    console.log("[findNearestEmptyCell] Strategy 3 FAILED: No valid empty neighbor found.");
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
