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
    // Prüfe auf null oder undefined Eingaben
    if (!bubble1 || !bubble2) {
      console.warn('[checkBubbleCollision] Invalid input: bubble1 or bubble2 is null/undefined');
      return false;
    }

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
    // Prüfe auf null oder undefined Eingaben
    if (!grid || !movingBubble) {
      console.warn('[findNearestEmptyCell] Invalid input: grid or movingBubble is null/undefined');
      return null;
    }
    
    // Prüfe ob movingBubble x und y Eigenschaften hat
    if (typeof movingBubble.x !== 'number' || typeof movingBubble.y !== 'number') {
      console.warn('[findNearestEmptyCell] Invalid movingBubble: missing x or y coordinates');
      return null;
    }
    
    const x = movingBubble.x;
    const y = movingBubble.y;
    
    const approxGridPos = grid.pixelToGrid(x, y);
    
    // Prüfe ob es Bubbles im Grid gibt
    let hasBubblesInGrid = false;
    grid.forEachBubble(() => {
      hasBubblesInGrid = true;
    });
    
    // Strategie 1: Prüfe zuerst, ob die direkte Position gültig und frei ist
    const isApproxValid = grid.isValidGridPosition(approxGridPos.row, approxGridPos.col);
    const isApproxEmpty = isApproxValid && !grid.getBubble(approxGridPos.row, approxGridPos.col);

    if (isApproxValid && isApproxEmpty) {
      if (!hasBubblesInGrid) {
        // Kein Bubble im Grid - jede Position ist in Ordnung
        return approxGridPos;
      } else {
        // Es gibt Bubbles - prüfe ob die Position an bestehende Bubbles angrenzt
        const neighbors = grid.getNeighbors(approxGridPos.row, approxGridPos.col);
        const hasAdjacentBubble = neighbors.some(neighbor => 
          grid.isValidGridPosition(neighbor.row, neighbor.col) && 
          grid.getBubble(neighbor.row, neighbor.col)
        );
        
        if (hasAdjacentBubble) {
          return approxGridPos;
        }
        
        // Die direkte Position hat keine angrenzenden Bubbles
        // Schaue nach sehr nahen Positionen mit angrenzenden Bubbles (nur im kleinen Radius)
        // Aber nur, wenn die direkte Position sehr weit von der Input-Position entfernt ist
        const pixelPos = grid.gridToPixel(approxGridPos.row, approxGridPos.col);
        const distanceToInput = Math.sqrt(Math.pow(x - pixelPos.x, 2) + Math.pow(y - pixelPos.y, 2));
        const reasonableDistanceThreshold = BUBBLE_RADIUS * 0.1; // Sehr streng für Cluster-Priorität (nur ~1.5 Pixel)
        
        if (distanceToInput <= reasonableDistanceThreshold) {
          return approxGridPos;
        }
        
        // Die direkte Position ist nicht nah genug, suche nach besseren angrenzenden Positionen
        let bestNearbyAdjacentCell = null;
        let minNearbyDistance = Number.MAX_VALUE;
        const nearbyRadius = 2; // Nur sehr nahe Positionen prüfen
        
        for (let rOffset = -nearbyRadius; rOffset <= nearbyRadius; rOffset++) {
          for (let cOffset = -nearbyRadius; cOffset <= nearbyRadius; cOffset++) {
            if (rOffset === 0 && cOffset === 0) continue; // Die direkte Position haben wir schon geprüft
            
            const testRow = approxGridPos.row + rOffset;
            const testCol = approxGridPos.col + cOffset;
            
            if (grid.isValidGridPosition(testRow, testCol) && !grid.getBubble(testRow, testCol)) {
              const neighbors = grid.getNeighbors(testRow, testCol);
              const hasAdjacentBubble = neighbors.some(neighbor => 
                grid.isValidGridPosition(neighbor.row, neighbor.col) && 
                grid.getBubble(neighbor.row, neighbor.col)
              );
              
              if (hasAdjacentBubble) {
                const cellPos = grid.gridToPixel(testRow, testCol);
                const dx = x - cellPos.x;
                const dy = y - cellPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minNearbyDistance) {
                  minNearbyDistance = distance;
                  bestNearbyAdjacentCell = { row: testRow, col: testCol };
                }
              }
            }
          }
        }
        
        // Wenn Bubbles im Grid vorhanden sind, priorisiere IMMER angrenzende Zellen
        if (bestNearbyAdjacentCell) {
          return bestNearbyAdjacentCell;
        } else {
          // Fallback zur direkten Position nur wenn keine angrenzenden Zellen gefunden wurden
          return approxGridPos;
        }
      }
    }

    // Strategie 2: Wenn die direkte Position besetzt ist, suche nach freien Nachbarzellen
    if (isApproxValid && !isApproxEmpty) {
      const neighbors = grid.getNeighbors(approxGridPos.row, approxGridPos.col);
      let bestNeighborCell = null;
      let minNeighborDistance = Number.MAX_VALUE;

      for (const neighbor of neighbors) {
        if (grid.isValidGridPosition(neighbor.row, neighbor.col) && !grid.getBubble(neighbor.row, neighbor.col)) {
          const neighborPos = grid.gridToPixel(neighbor.row, neighbor.col);
          const dx = x - neighborPos.x;
          const dy = y - neighborPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minNeighborDistance) {
            minNeighborDistance = distance;
            bestNeighborCell = neighbor;
          }
        }
      }
      
      if (bestNeighborCell) {
        return bestNeighborCell;
      }
    }

    // Strategie 3: Erweiterte Suche nach Kollision mit vorhandenen Bubbles
    let closestBubbleInfo = null;
    let minBubbleDistance = Number.MAX_VALUE;

    grid.forEachBubble((gridBubble, row, col) => {
      const cellCenter = grid.gridToPixel(row, col);
      const dx = x - cellCenter.x;
      const dy = y - cellCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Priorisiere Bubbles, die näher zur bewegten Bubble sind
      if (distance < minBubbleDistance && distance <= BUBBLE_RADIUS * 4) {
        minBubbleDistance = distance;
        closestBubbleInfo = { row, col };
      }
    });
    
    if (closestBubbleInfo) {
      const neighbors = grid.getNeighbors(closestBubbleInfo.row, closestBubbleInfo.col);
      let bestNeighborCell = null;
      let minNeighborDistance = Number.MAX_VALUE;

      for (const neighbor of neighbors) {
        if (grid.isValidGridPosition(neighbor.row, neighbor.col) && !grid.getBubble(neighbor.row, neighbor.col)) {
          const neighborPos = grid.gridToPixel(neighbor.row, neighbor.col);
          const dx = x - neighborPos.x;
          const dy = y - neighborPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minNeighborDistance) {
            minNeighborDistance = distance;
            bestNeighborCell = neighbor;
          }
        }
      }
      
      if (bestNeighborCell) {
        return bestNeighborCell;
      }
    }

    // Strategie 4: Wenn es Bubbles gibt, bevorzuge Zellen die an Bubbles angrenzen (erweiterte Suche)
    if (hasBubblesInGrid) {
      let bestAdjacentCell = null;
      let minAdjacentDistance = Number.MAX_VALUE;
      
      const searchRadius = 4; // Erweiterte Suche
      for (let rOffset = -searchRadius; rOffset <= searchRadius; rOffset++) {
        for (let cOffset = -searchRadius; cOffset <= searchRadius; cOffset++) {
          const testRow = approxGridPos.row + rOffset;
          const testCol = approxGridPos.col + cOffset;
          
          if (grid.isValidGridPosition(testRow, testCol) && !grid.getBubble(testRow, testCol)) {
            // Prüfe ob diese Zelle an bestehende Bubbles angrenzt
            const neighbors = grid.getNeighbors(testRow, testCol);
            const hasAdjacentBubble = neighbors.some(neighbor => 
              grid.isValidGridPosition(neighbor.row, neighbor.col) && 
              grid.getBubble(neighbor.row, neighbor.col)
            );
            
            if (hasAdjacentBubble) {
              const cellPos = grid.gridToPixel(testRow, testCol);
              const dx = x - cellPos.x;
              const dy = y - cellPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < minAdjacentDistance) {
                minAdjacentDistance = distance;
                bestAdjacentCell = { row: testRow, col: testCol };
              }
            }
          }
        }
      }
      
      if (bestAdjacentCell) {
        return bestAdjacentCell;
      }
    }

    // Strategie 5: Fallback - breitere Suche nach freien Zellen
    const searchRadius = 3;
    let bestCell = null;
    let minDistance = Number.MAX_VALUE;

    for (let rOffset = -searchRadius; rOffset <= searchRadius; rOffset++) {
      for (let cOffset = -searchRadius; cOffset <= searchRadius; cOffset++) {
        const testRow = approxGridPos.row + rOffset;
        const testCol = approxGridPos.col + cOffset;
        
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
    
    return bestCell;
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
