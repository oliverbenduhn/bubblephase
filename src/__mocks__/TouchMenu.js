// Mock für MobileOptimization für PhaserGame Tests
jest.mock('./TouchMenu', () => ({
  TouchMenu: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
    createMainMenu: jest.fn(),
    createPauseMenu: jest.fn().mockReturnValue({
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn()
    }),
    resize: jest.fn(),
    container: {
      add: jest.fn(),
      setVisible: jest.fn()
    },
    buttons: [{
      text: { setText: jest.fn() }
    }],
    destroy: jest.fn()
  }))
}));
