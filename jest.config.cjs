module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', 'jest-canvas-mock'], // Hinzugefügt
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    'phaser3spectorjs': 'identity-obj-proxy', // Hinzugefügt
    // Hinzufügen eines Mocks für SVG-Dateien
    '\\.(svg)$': '<rootDir>/__mocks__/svgMock.js' 
  }
};
