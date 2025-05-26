/**
 * Mobile-freundliche Viewport-Höhen-Verwaltung
 * 
 * Dieses Modul behebt das Problem mit 100vh auf mobilen Geräten,
 * wo Browser-UI-Elemente die verfügbare Höhe reduzieren.
 */

class ViewportHeightManager {
  constructor() {
    this.lastHeight = null;
    this.debounceTimer = null;
    this.isInitialized = false;
    
    // Bind methods to maintain context
    this.updateViewportHeight = this.updateViewportHeight.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
  }

  /**
   * Aktualisiert die CSS Custom Properties für die Viewport-Höhe
   */
  updateViewportHeight() {
    const vh = window.innerHeight * 0.01;
    const actualHeight = window.innerHeight;
    
    // Verhindere unnötige Updates wenn sich die Höhe nicht signifikant geändert hat
    if (this.lastHeight && Math.abs(actualHeight - this.lastHeight) < 10) {
      return;
    }
    
    this.lastHeight = actualHeight;
    
    // Setze CSS Custom Properties
    const root = document.documentElement;
    root.style.setProperty('--vh', `${vh}px`);
    root.style.setProperty('--viewport-height', `${actualHeight}px`);
    
    // Fallback für ältere Browser ohne moderne viewport units
    if (!this.supportsModernViewportUnits()) {
      root.style.setProperty('--dynamic-viewport-height', `${actualHeight}px`);
      root.style.setProperty('--small-viewport-height', `${actualHeight}px`);
    }
    
    // Debug-Info (nur in Development)
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Viewport height updated: ${actualHeight}px (vh: ${vh}px)`);
    }
  }

  /**
   * Prüft ob der Browser moderne Viewport-Einheiten unterstützt
   */
  supportsModernViewportUnits() {
    // Feature-Detection für dvh/svh
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports('height', '100dvh') || CSS.supports('height', '100svh');
    }
    return false;
  }

  /**
   * Debounced Resize Handler
   */
  handleResize() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updateViewportHeight();
    }, 100); // 100ms Debounce
  }

  /**
   * Orientation Change Handler (wichtig für mobile Geräte)
   */
  handleOrientationChange() {
    // Warte kurz nach Orientierungsänderung für korrekte Dimensionen
    setTimeout(() => {
      this.updateViewportHeight();
    }, 300);
  }

  /**
   * Initialisiert den Viewport Height Manager
   */
  init() {
    if (this.isInitialized) {
      console.warn('ViewportHeightManager already initialized');
      return;
    }

    // Initiale Höhe setzen
    this.updateViewportHeight();

    // Event Listeners hinzufügen
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('orientationchange', this.handleOrientationChange, { passive: true });
    
    // Für iOS Safari: Zusätzlicher Handler für Scroll-Events
    // (Safari verändert die Viewport-Höhe beim Scrollen)
    if (this.isIOSSafari()) {
      let scrollTimer;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(this.updateViewportHeight, 150);
      }, { passive: true });
    }

    // Für Chrome Mobile: Visual Viewport API wenn verfügbar
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleResize, { passive: true });
    }

    this.isInitialized = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('ViewportHeightManager initialized', {
        supportsModernUnits: this.supportsModernViewportUnits(),
        hasVisualViewport: !!window.visualViewport,
        isIOSSafari: this.isIOSSafari()
      });
    }
  }

  /**
   * Erkennt iOS Safari
   */
  isIOSSafari() {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  }

  /**
   * Cleanup für SPA-Umgebungen
   */
  destroy() {
    if (!this.isInitialized) return;

    clearTimeout(this.debounceTimer);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleResize);
    }

    this.isInitialized = false;
  }
}

// Singleton-Instanz
const viewportHeightManager = new ViewportHeightManager();

// Auto-Init für normale Verwendung (nicht in Tests)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Warte bis DOM geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      viewportHeightManager.init();
    });
  } else {
    // DOM ist bereits geladen
    viewportHeightManager.init();
  }
}

export default viewportHeightManager;
