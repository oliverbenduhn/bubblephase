/**
 * Tests für ViewportHeightManager
 */

import viewportHeightManager from './viewportHeight';

describe('ViewportHeightManager', () => {
  let originalInnerHeight;
  let originalUserAgent;
  let mockCSS;

  beforeEach(() => {
    // Mock window properties
    originalInnerHeight = window.innerHeight;
    originalUserAgent = navigator.userAgent;
    
    // Mock CSS.supports
    mockCSS = {
      supports: jest.fn()
    };
    global.CSS = mockCSS;

    // Reset the manager
    if (viewportHeightManager.isInitialized) {
      viewportHeightManager.destroy();
    }

    // Mock document.documentElement.style.setProperty
    document.documentElement.style.setProperty = jest.fn();
    
    // Mock console.warn to prevent test output pollution
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent
    });

    viewportHeightManager.destroy();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('updateViewportHeight', () => {
    it('should set CSS custom properties with correct values', () => {
      // Arrange
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      // Act
      viewportHeightManager.updateViewportHeight();

      // Assert
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--vh', '8px');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--viewport-height', '800px');
    });

    it('should not update if height change is less than 10px', () => {
      // Arrange
      Object.defineProperty(window, 'innerHeight', {
        value: 800
      });
      viewportHeightManager.updateViewportHeight();
      jest.clearAllMocks();

      // Change height by less than 10px
      Object.defineProperty(window, 'innerHeight', {
        value: 805
      });

      // Act
      viewportHeightManager.updateViewportHeight();

      // Assert
      expect(document.documentElement.style.setProperty).not.toHaveBeenCalled();
    });

    it('should update if height change is 10px or more', () => {
      // Arrange
      Object.defineProperty(window, 'innerHeight', {
        value: 800
      });
      viewportHeightManager.updateViewportHeight();
      jest.clearAllMocks();

      // Change height by 10px or more
      Object.defineProperty(window, 'innerHeight', {
        value: 810
      });

      // Act
      viewportHeightManager.updateViewportHeight();

      // Assert
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--vh', '8.1px');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--viewport-height', '810px');
    });
  });

  describe('supportsModernViewportUnits', () => {
    it('should return true when CSS.supports indicates dvh support', () => {
      mockCSS.supports.mockImplementation((property, value) => {
        return value === '100dvh';
      });

      expect(viewportHeightManager.supportsModernViewportUnits()).toBe(true);
    });

    it('should return true when CSS.supports indicates svh support', () => {
      mockCSS.supports.mockImplementation((property, value) => {
        return value === '100svh';
      });

      expect(viewportHeightManager.supportsModernViewportUnits()).toBe(true);
    });

    it('should return false when CSS.supports indicates no modern viewport unit support', () => {
      mockCSS.supports.mockReturnValue(false);

      expect(viewportHeightManager.supportsModernViewportUnits()).toBe(false);
    });

    it('should return false when CSS.supports is not available', () => {
      global.CSS = undefined;

      expect(viewportHeightManager.supportsModernViewportUnits()).toBe(false);
    });
  });

  describe('isIOSSafari', () => {
    it('should return true for iOS Safari user agent', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      });

      expect(viewportHeightManager.isIOSSafari()).toBe(true);
      
      // Restore
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: originalUserAgent
      });
    });

    it('should return false for Chrome on iOS', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/94.0.4606.76 Mobile/15E148 Safari/604.1'
      });

      expect(viewportHeightManager.isIOSSafari()).toBe(false);
      
      // Restore
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: originalUserAgent
      });
    });

    it('should return false for desktop Safari', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
      });

      expect(viewportHeightManager.isIOSSafari()).toBe(false);
      
      // Restore
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: originalUserAgent
      });
    });
  });

  describe('initialization and cleanup', () => {
    it('should initialize only once', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      viewportHeightManager.init();
      viewportHeightManager.init(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('ViewportHeightManager already initialized');
      consoleSpy.mockRestore();
    });

    it('should add event listeners on init', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      viewportHeightManager.init();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true });

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      viewportHeightManager.init();
      viewportHeightManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('resize handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce resize events', () => {
      const updateSpy = jest.spyOn(viewportHeightManager, 'updateViewportHeight');

      viewportHeightManager.init();

      // Trigger multiple resize events
      viewportHeightManager.handleResize();
      viewportHeightManager.handleResize();
      viewportHeightManager.handleResize();

      // Should not have called update yet (debounced)
      expect(updateSpy).toHaveBeenCalledTimes(1); // Only from init

      // Fast-forward time
      jest.advanceTimersByTime(100);

      // Should have called update once more after debounce
      expect(updateSpy).toHaveBeenCalledTimes(2);

      updateSpy.mockRestore();
    });

    it('should handle orientation change with delay', () => {
      const updateSpy = jest.spyOn(viewportHeightManager, 'updateViewportHeight');

      viewportHeightManager.init();
      updateSpy.mockClear(); // Clear the init call

      viewportHeightManager.handleOrientationChange();

      // Should not have called update immediately
      expect(updateSpy).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(300);

      // Should have called update after delay
      expect(updateSpy).toHaveBeenCalledTimes(1);

      updateSpy.mockRestore();
    });
  });
});
