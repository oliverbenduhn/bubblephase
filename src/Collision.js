import { BUBBLE_RADIUS } from './Bubble';

export class Collision {
  /**
   * Überprüft, ob zwei Bubbles miteinander kollidieren
   * @param {Object} bubble1 - Erste Bubble mit x und y Koordinaten
   * @param {Object} bubble2 - Zweite Bubble mit x und y Koordinaten
   * @param {number} threshold - Minimaler Abstand für Kollision (normalerweise 2 * BUBBLE_RADIUS)
   * @returns {boolean} - true wenn Kollision erkannt wurde
   */
  static checkBubbleCollision(bubble1, bubble2, threshold = BUBBLE_RADIUS * 2.0) { // Standard-Kollisionsschwellwert
    const dx = bubble1.x - bubble2.x;
    const dy = bubble1.y - bubble2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < threshold;
  }

  /**
   * Findet die nächste freie Gitterzelle, in die eine Bubble "einrasten" sollte
   * @param {Object} grid - Grid-Objekt
   * @param {Object} movingBubble - Die sich bewegende Bubble
   * @returns {Object|null} - {row, col} der nächsten freien Zelle oder null wenn keine passende gefunden wurde
   */
  static findNearestEmptyCell(grid, movingBubble) {
    // Exakte pixelbasierte Position der bewegten Bubble
    const x = movingBubble.x;
    const y = movingBubble.y;
    
    // Bestimme die ungefähre Gitterposition
    const approxGridPos = grid.pixelToGrid(x, y);

    console.log(`Bubble Position: (${x}, ${y}), Grid Position: (${approxGridPos.row}, ${approxGridPos.col})`);
    
    // Prüfe zuerst, ob die ungefähre Position gültig und frei ist
    if (grid.isValidGridPosition(approxGridPos.row, approxGridPos.col) && 
        !grid.getBubble(approxGridPos.row, approxGridPos.col)) {
      
      // Berechne die Pixel-Koordinaten und überprüfe den Abstand
      const cellPos = grid.gridToPixel(approxGridPos.row, approxGridPos.col);
      const dx = x - cellPos.x;
      const dy = y - cellPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Wenn die ungefähre Position nahe genug ist, verwende sie
      if (distance < BUBBLE_RADIUS * 2) {
        console.log(`Using approximated position: (${approxGridPos.row}, ${approxGridPos.col}) - distance: ${distance.toFixed(2)}`);
        return approxGridPos;
      }
    }
    
    // Suche nach vorhandenen Bubbles in der Nähe, um die "Kollisionsregion" zu bestimmen
    let closestBubble = null;
    let minBubbleDistance = Number.MAX_VALUE;

    grid.forEachBubble((gridBubble, row, col) => {
      const dx = x - gridBubble.x;
      const dy = y - gridBubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Wir suchen nach der nächsten Bubble zur Kollision
      if (distance < minBubbleDistance && distance <= BUBBLE_RADIUS * 2.2) {
        minBubbleDistance = distance;
        closestBubble = { bubble: gridBubble, row, col };
      }
    });
    
    // Wenn keine nahe Bubble gefunden wurde, versuchen wir eine alternative Strategie
    if (!closestBubble) {
      // Versuche, eine beliebige leere Zelle in der Nähe der ungefähren Position zu finden
      const searchRadius = 1; // Suche in einem kleinen Radius
      
      for (let r = -searchRadius; r <= searchRadius; r++) {
        for (let c = -searchRadius; c <= searchRadius; c++) {
          const newRow = approxGridPos.row + r;
          const newCol = approxGridPos.col + c;
          
          if (grid.isValidGridPosition(newRow, newCol) && !grid.getBubble(newRow, newCol)) {
            const cellPos = grid.gridToPixel(newRow, newCol);
            const dx = x - cellPos.x;
            const dy = y - cellPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < BUBBLE_RADIUS * 2.5) {
              console.log(`Found alternative position: (${newRow}, ${newCol}) - distance: ${distance.toFixed(2)}`);
              return { row: newRow, col: newCol };
            }
          }
        }
      }
      
      // Wenn immer noch nichts gefunden wurde, verwenden wir die ungefähre Position als Fallback
      if (grid.isValidGridPosition(approxGridPos.row, approxGridPos.col) && 
          !grid.getBubble(approxGridPos.row, approxGridPos.col)) {
        console.log(`Fallback to approximated position: (${approxGridPos.row}, ${approxGridPos.col})`);
        return approxGridPos;
      }
      
      console.log("No valid position found");
      return null;
    }
    
    // Bestimme mögliche Nachbarzellen basierend auf der Reihe des nächsten Bubbles
    // Für ein hexagonales Gitter gibt es unterschiedliche Richtungen für gerade und ungerade Reihen
    let directions;
    
    if (closestBubble.row % 2 === 0) {
      // Gerade Reihe
      directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 },  // Oben links, Oben
        { row: 0, col: -1 },  { row: 0, col: 1 },   // Links, Rechts
        { row: 1, col: -1 },  { row: 1, col: 0 }    // Unten links, Unten
      ];
    } else {
      // Ungerade Reihe
      directions = [
        { row: -1, col: 0 }, { row: -1, col: 1 },  // Oben, Oben rechts
        { row: 0, col: -1 }, { row: 0, col: 1 },   // Links, Rechts
        { row: 1, col: 0 },  { row: 1, col: 1 }    // Unten, Unten rechts
      ];
    }
    
    // Bestimme die allgemeine Richtung der bewegten Bubble relativ zur nächsten Bubble im Grid
    const xDir = x - closestBubble.bubble.x;
    const yDir = y - closestBubble.bubble.y;
    
    // Normalisiere die Richtungsvektoren, um eine konsistentere Sortierung zu erreichen
    const dirMagnitude = Math.sqrt(xDir * xDir + yDir * yDir);
    const normXDir = xDir / dirMagnitude;
    const normYDir = yDir / dirMagnitude;
    
    // Sortiere die Richtungen nach Relevanz (am nächsten zur tatsächlichen Bewegungsrichtung)
    directions.sort((a, b) => {
      // Berechne normalisierte Vektoren für die Richtungen
      const aMagnitude = Math.sqrt(a.col * a.col + a.row * a.row);
      const bMagnitude = Math.sqrt(b.col * b.col + b.row * b.row);
      
      const aNormCol = a.col / aMagnitude;
      const aNormRow = a.row / aMagnitude;
      const bNormCol = b.col / bMagnitude;
      const bNormRow = b.row / bMagnitude;
      
      // Berechne den Dot-Product für eine bessere Richtungsbewertung
      const dotA = aNormCol * normXDir + aNormRow * normYDir;
      const dotB = bNormCol * normXDir + bNormRow * normYDir;
      
      return dotB - dotA; // Höhere Punktzahl bedeutet, dass die Richtung besser zur Bewegungsrichtung passt
    });
    
    // Durchlaufe die sortierten Richtungen und versuche, eine leere Zelle zu finden
    for (const dir of directions) {
      const newRow = closestBubble.row + dir.row;
      const newCol = closestBubble.col + dir.col;
      
      if (grid.isValidGridPosition(newRow, newCol) && !grid.getBubble(newRow, newCol)) {
        // Wir haben eine gültige leere Zelle gefunden
        console.log(`Found empty cell at (${newRow}, ${newCol}) - checking proximity`);
        
        // Berechne die Pixel-Koordinaten und überprüfe den Abstand
        const cellPos = grid.gridToPixel(newRow, newCol);
        const dx = x - cellPos.x;
        const dy = y - cellPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Nur Zellen akzeptieren, die nicht zu weit entfernt sind
        if (distance < BUBBLE_RADIUS * 2.2) { // Erhöht von 2.0 auf 2.2
          console.log(`Selected cell at (${newRow}, ${newCol}) - distance: ${distance.toFixed(2)}`);
          return { row: newRow, col: newCol };
        }
      }
    }
    
    // Fallback: Wenn keine passende Zelle gefunden wurde, verwende die ungefähre Position
    if (grid.isValidGridPosition(approxGridPos.row, approxGridPos.col) && 
        !grid.getBubble(approxGridPos.row, approxGridPos.col)) {
      console.log(`Fallback to approximated position: (${approxGridPos.row}, ${approxGridPos.col})`);
      return approxGridPos;
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
      
      if (this.checkBubbleCollision(movingBubble, gridBubble)) {
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
    const visited = new Set(); // Speichert besuchte Positionen als "row,col" Strings
    const positions = []; // Speichert die gefundenen Positionen als Objekte

    // Hilfsfunktion für die Tiefensuche
    const dfs = (row, col) => {
      const posKey = `${row},${col}`;
      
      // Prüfe Grenzen und ob die Position bereits besucht wurde
      if (!grid.isValidGridPosition(row, col) || visited.has(posKey)) {
        return;
      }

      const bubble = grid.getBubble(row, col);
      if (!bubble || bubble.color !== targetColor) {
        return;
      }

      // Markiere als besucht und füge zur Gruppe hinzu
      visited.add(posKey);
      positions.push({ row, col });

      // Definiere die Nachbarpositionen basierend auf der Reihennummer
      const neighbors = [];
      
      if (row % 2 === 0) {
        // Gerade Reihen
        neighbors.push(
          [row - 1, col - 1], // Oben links
          [row - 1, col],     // Oben rechts
          [row, col + 1],     // Rechts
          [row + 1, col],     // Unten rechts
          [row + 1, col - 1], // Unten links
          [row, col - 1]      // Links
        );
      } else {
        // Ungerade Reihen
        neighbors.push(
          [row - 1, col],     // Oben links
          [row - 1, col + 1], // Oben rechts
          [row, col + 1],     // Rechts
          [row + 1, col + 1], // Unten rechts
          [row + 1, col],     // Unten links
          [row, col - 1]      // Links
        );
      }

      // Prüfe alle Nachbarpositionen
      for (const [nextRow, nextCol] of neighbors) {
        dfs(nextRow, nextCol);
      }
    };

    // Starte die Suche von der Startposition
    dfs(startRow, startCol);

    // Gib immer die tatsächliche Größe und alle gefundenen Positionen zurück
    // Die Mindestgruppengröße wird in der Spiellogik verwendet
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
    // Set zum Speichern besuchter Zellen
    const visited = new Set();
    // Array für alle freischwebenden Bubbles
    const floatingBubbles = [];

    // Markiere alle Bubbles, die mit der Decke verbunden sind
    const markConnectedBubbles = (row, col) => {
      const key = `${row},${col}`;
      if (visited.has(key)) return;
      
      if (!grid.isValidGridPosition(row, col) || !grid.getBubble(row, col)) return;
      
      // Markiere als besucht
      visited.add(key);

      // Bestimme Nachbarrichtungen basierend auf gerader/ungerader Zeile
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

      // Prüfe rekursiv alle Nachbarn
      for (const dir of directions) {
        markConnectedBubbles(row + dir.row, col + dir.col);
      }
    };

    // Starte mit allen Bubbles in der obersten Zeile (Zeile 0)
    for (let c = 0; c < grid.cols; c++) {
      if (grid.getBubble(0, c)) {
        markConnectedBubbles(0, c);
      }
    }

    // Finde alle nicht besuchten Bubbles (= freischwebend)
    grid.forEachBubble((bubble, row, col) => {
      const key = `${row},${col}`;
      if (!visited.has(key)) {
        floatingBubbles.push({ row, col });
      }
    });

    return floatingBubbles;
  }
}
