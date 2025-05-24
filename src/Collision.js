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
    
    const approxGridPos = grid.pixelToGrid(x, y);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Bubble Position: (${x}, ${y}), Grid Position: (${approxGridPos.row}, ${approxGridPos.col})`);
    }
    
    // Einfache Suche in einem Radius um die Position
    for (let radius = 0; radius <= 2; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const newRow = approxGridPos.row + dr;
          const newCol = approxGridPos.col + dc;
          
          if (grid.isValidGridPosition(newRow, newCol) && !grid.getBubble(newRow, newCol)) {
            console.log(`Found valid position: (${newRow}, ${newCol}) with radius ${radius}`);
            return { row: newRow, col: newCol };
          }
        }
      }
    }
    
    console.log("No valid position found");
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
