// src/App.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders PhaserGame component (basic check)', () => {
    render(<App />);
    // Dieser Test prüft vorerst nur, ob die App-Komponente ohne Fehler rendert.
    // Eine spezifischere Prüfung (z.B. ob das Phaser-Canvas-Element tatsächlich im DOM ist)
    // könnte später hinzugefügt werden, ist aber für den ersten Test der Jest-Einrichtung nicht zwingend.
    expect(true).toBe(true); // Bestätigt, dass der Test ausgeführt wurde.
  });

  test('trivial true is true test', () => {
    expect(true).toBe(true);
  });
});
