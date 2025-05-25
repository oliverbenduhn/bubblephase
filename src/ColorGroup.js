import { Bubble } from './Bubble'; // Annahme: Bubble-Klasse existiert

export class ColorGroup {
  constructor(grid) {
    this.grid = grid;
  }

  /**
   * Findet alle zusammenhängenden Bubbles derselben Farbe, beginnend bei einer Start-Bubble.
   * @param {number} startRow - Die Reihe der Start-Bubble.
   * @param {number} startCol - Die Spalte der Start-Bubble.
   * @returns {Array<{row: number, col: number}>} - Eine Liste von Positionen der verbundenen Bubbles.
   */
  findConnectedBubbles(startRow, startCol) {
    // Prüfe auf ungültige Eingaben
    if (startRow == null || startCol == null || 
        typeof startRow !== 'number' || typeof startCol !== 'number' ||
        !isFinite(startRow) || !isFinite(startCol)) {
      console.warn('[ColorGroup] findConnectedBubbles: Invalid start position provided');
      return [];
    }
    
    const startBubble = this.grid.getBubble(startRow, startCol);
    if (!startBubble) {
      return [];
    }

    const colorIdToMatch = startBubble.colorId; // Verwende die logische Farb-ID statt der numerischen Farbe
    // console.log entfernt für bessere Performance in Tests
    
    const q = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow}-${startCol}`]);
    const connectedGroup = [{ row: startRow, col: startCol }];
    let qIndex = 0; // Index für schnelleres Queue-Management

    // Vorbereitung des neighbor-cache für häufig verwendete Nachbarn
    const neighborCache = new Map();

    while (qIndex < q.length) {
      const current = q[qIndex++];
      const neighbors = neighborCache.get(`${current.row}-${current.col}`) || 
                       this.grid.getNeighbors(current.row, current.col);
      
      if (!neighborCache.has(`${current.row}-${current.col}`)) {
        neighborCache.set(`${current.row}-${current.col}`, neighbors);
      }

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row}-${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          visited.add(neighborKey);
          const bubble = this.grid.getBubble(neighbor.row, neighbor.col);
          if (bubble && bubble.colorId === colorIdToMatch) { // Vergleiche colorId statt color
            connectedGroup.push({ row: neighbor.row, col: neighbor.col });
            q.push(neighbor);
          }
        }
      }
    }
    return connectedGroup;
  }

  /**
   * Findet eine Gruppe zusammenhängender Bubbles und entfernt sie, wenn sie groß genug ist.
   * @param {number} startRow - Die Reihe der Start-Bubble.
   * @param {number} startCol - Die Spalte der Start-Bubble.
   * @param {number} minGroupSize - Die minimale Größe einer Gruppe, damit sie entfernt wird (Standard ist 3).
   * @returns {Array<{row: number, col: number}>} - Eine Liste der Positionen der entfernten Bubbles, oder eine leere Liste, wenn keine Gruppe entfernt wurde.
   */
  findAndRemoveGroup(startRow, startCol, minGroupSize = 3) {
    const connectedGroup = this.findConnectedBubbles(startRow, startCol);
    const removedBubbles = [];

    if (connectedGroup.length >= minGroupSize) {
      // Entferne zuerst die zusammenhängenden Bubbles gleicher Farbe
      this.grid.removeBubbles(connectedGroup);
      removedBubbles.push(...connectedGroup);

      // Entferne freischwebende Bubbles nach dem Entfernen der Gruppe
      const floatingBubbles = this.grid.removeFloatingBubbles();
      removedBubbles.push(...floatingBubbles);
    }
    return removedBubbles;
  }

  /**
   * Überprüft, ob eine Gruppe von Bubbles entfernbar ist (mindestens 3 Bubbles)
   * @param {Array<{row: number, col: number}>} connectedGroup - Die zu überprüfende Gruppe
   * @returns {boolean} - true wenn die Gruppe entfernbar ist
   */
  checkRemovableBubbles(connectedGroup) {
    return connectedGroup && connectedGroup.length >= 3;
  }

  /**
   * Findet alle hängenden (floating) Bubbles, die nicht mit dem oberen Rand verbunden sind
   * @returns {Array<{row: number, col: number}>} - Liste der hängenden Bubble-Positionen
   */
  findHangingBubbles() {
    const visited = new Set();
    const connected = new Set();
    
    // Starte von der obersten Reihe und markiere alle verbundenen Bubbles
    for (let col = 0; col < this.grid.cols; col++) {
      if (this.grid.getBubble(0, col) && !visited.has(`0-${col}`)) {
        this._markConnectedBubbles(0, col, visited, connected);
      }
    }
    
    // Finde alle Bubbles, die nicht markiert wurden (hängend)
    const hangingBubbles = [];
    this.grid.forEachBubble((bubble, row, col) => {
      if (!connected.has(`${row}-${col}`)) {
        hangingBubbles.push({ row, col });
      }
    });
    
    return hangingBubbles;
  }

  /**
   * Private Hilfsmethode: Markiert alle mit einer Position verbundenen Bubbles
   * @param {number} row - Startposition Reihe
   * @param {number} col - Startposition Spalte
   * @param {Set} visited - Set der besuchten Positionen
   * @param {Set} connected - Set der verbundenen Positionen
   * @private
   */
  _markConnectedBubbles(row, col, visited, connected) {
    const key = `${row}-${col}`;
    if (visited.has(key) || !this.grid.getBubble(row, col)) {
      return;
    }
    
    visited.add(key);
    connected.add(key);
    
    const neighbors = this.grid.getNeighbors(row, col);
    for (const neighbor of neighbors) {
      this._markConnectedBubbles(neighbor.row, neighbor.col, visited, connected);
    }
  }
}
