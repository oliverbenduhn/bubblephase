import { Bubble } from './Bubble';
import { BUBBLE_COLOR_IDS, switchToTheme, getColorValue } from './config';

describe('Color System Integration', () => {
    test('Unterschiedliche Bubbles behalten ihre Identitäten über Theme-Wechsel', () => {
        const mockScene = {}; // Mock für Szene, falls benötigt
        const bubbleA = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.A);
        const bubbleB = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.B);
        const bubbleC = new Bubble(mockScene, 0, 0, 20, BUBBLE_COLOR_IDS.C);

        expect(bubbleC.color).toBe(0x0000ff); // Blau

        // Alle haben unterschiedliche Farb-IDs
        expect(bubbleA.colorId).not.toBe(bubbleB.colorId);
        expect(bubbleB.colorId).not.toBe(bubbleC.colorId);
        expect(bubbleA.colorId).not.toBe(bubbleC.colorId);

        // Wechsle Theme
        switchToTheme(1); // Pastell

        // Aktualisiere die visuellen Farben der Bubbles nach Theme-Wechsel
        bubbleA.updateVisualColor();
        bubbleB.updateVisualColor();
        bubbleC.updateVisualColor();

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

        const mockScene = {};
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
