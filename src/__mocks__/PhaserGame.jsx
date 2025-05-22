// Mock für PhaserGame
import React from 'react';

// Mock für BootScene
export class BootScene {
  constructor() {
    // Leerer Konstruktor für Tests
  }
}

// Mock für PhaserGame Komponente
export default function PhaserGame() {
  return <div data-testid="phaser-game-mock">Phaser Game Mock</div>;
}
