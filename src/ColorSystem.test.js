// Test file to verify the color system works correctly across theme changes
import { Bubble } from './Bubble';
import { BUBBLE_COLOR_IDS, COLOR_THEMES, switchToTheme, getColorValue } from './config';
import { TEST_COLOR_MAP } from './test-utils';

// Mock für Phaser.Scene
const mockScene = {
    add: {
        circle: jest.fn(() => ({
            setStrokeStyle: jest.fn(),
            setPosition: jest.fn(),
            destroy: jest.fn()
        }))
    }
};

describe('Color System Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset to standard theme
        switchToTheme(0);
    });

    test('Bubble behält logische Farb-ID über Theme-Wechsel bei', () => {
        const bubble = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.A);
        
        // Teste Standard-Theme (Rot)
        expect(bubble.colorId).toBe(BUBBLE_COLOR_IDS.A);
        expect(bubble.color).toBe(0xff0000); // Rot im Standard-Theme
        
        // Wechsle zu Pastell-Theme
        switchToTheme(1);
        expect(bubble.colorId).toBe(BUBBLE_COLOR_IDS.A); // ID bleibt gleich
        expect(bubble.color).toBe(0xffb6c1); // Hellrosa im Pastell-Theme
        
        // Wechsle zu Ocean-Theme
        switchToTheme(2);
        expect(bubble.colorId).toBe(BUBBLE_COLOR_IDS.A); // ID bleibt gleich
        expect(bubble.color).toBe(0xff7f50); // Koralle im Ocean-Theme
    });

    test('Unterschiedliche Bubbles behalten ihre Identitäten über Theme-Wechsel', () => {
        const bubbleA = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.A);
        const bubbleB = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.B);
        const bubbleC = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.C);
        
        // Standard-Theme
        expect(bubbleA.color).toBe(0xff0000); // Rot
        expect(bubbleB.color).toBe(0x00ff00); // Grün  
        expect(bubbleC.color).toBe(0x0000ff); // Blau
        
        // Alle haben unterschiedliche Farb-IDs
        expect(bubbleA.colorId).not.toBe(bubbleB.colorId);
        expect(bubbleB.colorId).not.toBe(bubbleC.colorId);
        expect(bubbleA.colorId).not.toBe(bubbleC.colorId);
        
        // Wechsle Theme
        switchToTheme(1); // Pastell
        
        // Farben ändern sich, aber Identitäten bleiben unterschiedlich
        expect(bubbleA.color).toBe(0xffb6c1); // Hellrosa
        expect(bubbleB.color).toBe(0x98fb98); // Mintgrün
        expect(bubbleC.color).toBe(0x87ceeb); // Himmelblau
        
        // IDs bleiben gleich
        expect(bubbleA.colorId).toBe(BUBBLE_COLOR_IDS.A);
        expect(bubbleB.colorId).toBe(BUBBLE_COLOR_IDS.B);
        expect(bubbleC.colorId).toBe(BUBBLE_COLOR_IDS.C);
    });

    test('getColorValue Funktion arbeitet korrekt', () => {
        // Standard-Theme
        expect(getColorValue(BUBBLE_COLOR_IDS.A)).toBe(0xff0000);
        expect(getColorValue(BUBBLE_COLOR_IDS.B)).toBe(0x00ff00);
        
        // Wechsle Theme
        switchToTheme(1);
        expect(getColorValue(BUBBLE_COLOR_IDS.A)).toBe(0xffb6c1);
        expect(getColorValue(BUBBLE_COLOR_IDS.B)).toBe(0x98fb98);
    });

    test('updateVisualColor Methode funktioniert korrekt', () => {
        const mockGameObject = {
            setFillStyle: jest.fn()
        };
        
        const bubble = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.A);
        bubble.gameObject = mockGameObject;
        
        // Rufe updateVisualColor auf
        bubble.updateVisualColor();
        expect(mockGameObject.setFillStyle).toHaveBeenCalledWith(0xff0000); // Standard Rot
        
        // Wechsle Theme und rufe erneut auf
        switchToTheme(1);
        bubble.updateVisualColor();
        expect(mockGameObject.setFillStyle).toHaveBeenCalledWith(0xffb6c1); // Pastell Rosa
    });
});
