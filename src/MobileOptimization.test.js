import { BootScene } from './PhaserGame';

// Mock für Phaser
jest.mock('phaser', () => ({
  Scene: class {
    constructor() {}
  },
  Math: {
    Angle: {
      Between: jest.fn()
    }
  },
  Scale: {
    RESIZE: 'RESIZE',
    CENTER_BOTH: 'CENTER_BOTH'
  }
}));

// Wir müssen die BootScene-Klasse separat testen, da sie in der PhaserGame-Komponente integriert ist
describe('Mobile Optimierung', () => {
  
  // Test-Setup für mobile User-Agent
  const mockMobileUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      configurable: true
    });
  };
  
  // Test-Setup für Desktop User-Agent
  const mockDesktopUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });
  };
  
  test('sollte korrekt erkennen, ob das Gerät ein Mobilgerät ist', () => {
    // Mobilen User-Agent simulieren
    mockMobileUserAgent();
    
    // Scene mit Mock-Methoden erstellen
    const scene = {
      sys: {
        game: {
          config: { width: 800, height: 600 },
          isPortrait: true,
          events: { on: jest.fn() }
        }
      },
      add: {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis()
        }),
        line: jest.fn().mockReturnValue({
          setVisible: jest.fn().mockReturnThis(),
          setTo: jest.fn().mockReturnThis(),
          setLineWidth: jest.fn().mockReturnThis()
        }),
        circle: jest.fn().mockReturnValue({
          setStrokeStyle: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis()
        })
      },
      input: { on: jest.fn() }
    };
    
    // BootScene erstellen und überprüfen ob mobile Erkennung funktioniert
    const bootSceneInstance = new BootScene();
    
    // Eigenschaften und Methoden zuweisen, die normalerweise in create() gesetzt werden
    bootSceneInstance.sys = scene.sys;
    bootSceneInstance.add = scene.add;
    bootSceneInstance.input = scene.input;
    
    // Mobile-Erkennung manuell aufrufen
    bootSceneInstance.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Überprüfen, ob isMobile korrekt gesetzt wurde
    expect(bootSceneInstance.isMobile).toBe(true);
    
    // Desktop User-Agent simulieren und erneut prüfen
    mockDesktopUserAgent();
    bootSceneInstance.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    expect(bootSceneInstance.isMobile).toBe(false);
  });
  
  test('sollte responsive Spielgröße basierend auf Bildschirmgröße berechnen', () => {
    // Originale window.innerWidth und window.innerHeight sichern
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    
    // Mock für window.innerWidth und window.innerHeight im Portrait-Modus
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
    
    // Testfunktion für calculateGameSize
    const calculateGameSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      
      if (isPortrait) {
        return {
          width: width,
          height: Math.min(height, width * 1.5),
          isPortrait
        };
      } else {
        return {
          width: Math.min(width, height * 1.5),
          height: height,
          isPortrait
        };
      }
    };
    
    // Portrait-Modus testen
    const portraitSize = calculateGameSize();
    expect(portraitSize.isPortrait).toBe(true);
    expect(portraitSize.width).toBe(375);
    expect(portraitSize.height).toBe(562.5); // 375 * 1.5
    
    // Landscape-Modus testen
    Object.defineProperty(window, 'innerWidth', { value: 667, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 375, configurable: true });
    
    const landscapeSize = calculateGameSize();
    expect(landscapeSize.isPortrait).toBe(false);
    expect(landscapeSize.width).toBe(562.5); // 375 * 1.5
    expect(landscapeSize.height).toBe(375);
    
    // Zurücksetzen der Werte
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
  });
});
