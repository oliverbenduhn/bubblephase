// Ensure BUBBLE_RADIUS and BUBBLE_COLORS are correctly imported from Bubble.js
import { BUBBLE_RADIUS, BUBBLE_COLORS, Bubble } from './Bubble';

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

  // Checks if a given grid position (row, col) is valid within the grid's bounds
  isValidGridPosition(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  // Initializes the top rows of the grid with random bubbles
  initializeWithBubbles(numRowsToFill = 3) {
    const availableColors = Object.values(BUBBLE_COLORS);
    for (let r = 0; r < Math.min(numRowsToFill, this.rows); r++) {
      for (let c = 0; c < this.cols; c++) {
        // For odd rows, skip the last column if it would extend beyond the hexagonal pattern
        if (r % 2 !== 0 && c === this.cols - 1) continue;
        
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        // Create a new bubble instance without initial position, as addBubble will set it
        const bubble = new Bubble(this.scene, 0, 0, BUBBLE_RADIUS, randomColor);
        this.addBubble(r, c, bubble);
      }
    }
  }

  // Iterates over all bubbles in the grid and executes a callback function for each
  forEachBubble(callback) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          callback(this.grid[r][c], r, c);
        }
      }
    }
  }

  // Findet die unterste Reihe, die mindestens eine Bubble enthält
  getLowestFilledRow() {
    for (let r = this.rows - 1; r >= 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          return r;
        }
      }
    }
    return 0; // Wenn keine Bubbles gefunden wurden, gib 0 zurück
  }

  // Checks if a specific row is empty (contains no bubbles)
  isRowEmpty(row) {
    if (row < 0 || row >= this.rows) return true; // Invalid row is considered empty
    for (let c = 0; c < this.cols; c++) {
      if (this.grid[row][c]) return false; // Found a bubble, row is not empty
    }
    return true; // No bubbles found, row is empty
  }
}