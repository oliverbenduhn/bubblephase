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
    const startBubble = this.grid.getBubble(startRow, startCol);
    if (!startBubble) {
      return [];
    }

    const colorIdToMatch = startBubble.colorId; // Verwende die logische Farb-ID statt der numerischen Farbe
    console.log(`🔍 Finding connected bubbles with colorId: ${colorIdToMatch}`);
    
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
}
