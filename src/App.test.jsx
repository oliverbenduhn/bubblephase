// src/App.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock für PhaserGame
jest.mock('./PhaserGame', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="phaser-game-mock">Phaser Game Mock</div>
  };
});

describe('App', () => {
  test('renders PhaserGame component (basic check)', () => {
    const { getByTestId } = render(<App />);
    // Prüft, ob der Mock tatsächlich gerendert wurde
    expect(getByTestId('phaser-game-mock')).toBeInTheDocument();
  });

  test('trivial true is true test', () => {
    expect(true).toBe(true);
  });
});
