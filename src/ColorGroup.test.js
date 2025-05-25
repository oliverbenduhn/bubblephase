import { TEST_COLOR_MAP } from './test-utils';
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS } from './Bubble';
import { ColorGroup } from './ColorGroup';

// Mock für Phaser.Scene
const mockScene = {
    add: {
        circle: jest.fn().mockImplementation(() => ({
            setStrokeStyle: jest.fn(),
            setPosition: jest.fn(),
            destroy: jest.fn(),
            body: {
              setCircle: jest.fn(),
              setVelocity: jest.fn(),
              reset: jest.fn(),
              setMaxVelocity: jest.fn().mockReturnThis(),
              setDrag: jest.fn().mockReturnThis(),
              setFrictionX: jest.fn(),
              setFrictionY: jest.fn(),
              setCollideWorldBounds: jest.fn(),
              setBounce: jest.fn(),
              setImmovable: jest.fn(),
              maxVelocity: { x: 600, y: 600 },
              drag: { x: 0.98, y: 0.98 }
            }
        })),
    },
    physics: {
        add: {
            existing: jest.fn()
        }
    }
};

describe('ColorGroup', () => {
    let grid;
    let colorGroup;
    
    beforeEach(() => {
        grid = new Grid(mockScene, 8, 8); // 8x8 Grid für Tests
        colorGroup = new ColorGroup(grid);
    });

    describe('findConnectedBubbles', () => {
        test('findet keine Bubbles bei leerer Position', () => {
            const connected = colorGroup.findConnectedBubbles(0, 0);
            expect(connected).toHaveLength(0);
        });

        test('findet eine einzelne Bubble', () => {
            grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            const connected = colorGroup.findConnectedBubbles(0, 0);
            
            expect(connected).toHaveLength(1);
            expect(connected[0]).toEqual({ row: 0, col: 0 });
        });

        test('findet drei verbundene gleichfarbige Bubbles', () => {
            grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            const connected = colorGroup.findConnectedBubbles(0, 1);
            
            expect(connected).toHaveLength(3);
            expect(connected).toContainEqual({ row: 0, col: 0 });
            expect(connected).toContainEqual({ row: 0, col: 1 });
            expect(connected).toContainEqual({ row: 0, col: 2 });
        });

        test('ignoriert Bubbles anderer Farben', () => {
            grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            
            const connected = colorGroup.findConnectedBubbles(1, 1);
            
            expect(connected).toHaveLength(1);
            expect(connected[0]).toEqual({ row: 1, col: 1 });
        });

        test('findet hexagonal verbundene Bubbles', () => {
            // In einem hexagonalen Gitter sind die Nachbarn anders angeordnet
            // Hier testen wir eine "Blume" aus 7 Bubbles
            const centerRow = 2;
            const centerCol = 2;
            
            // Zentrale Bubble
            grid.addBubble(centerRow, centerCol, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            // Die 6 Nachbarn für eine gerade Reihe
            const neighborOffsets = [
                { r: 0, c: -1 }, { r: 0, c: 1 },   // Links, Rechts
                { r: -1, c: 0 }, { r: -1, c: 1 },  // Oben-Links, Oben-Rechts
                { r: 1, c: 0 }, { r: 1, c: 1 }     // Unten-Links, Unten-Rechts
            ];
            
            // Füge die Nachbarn hinzu
            neighborOffsets.forEach(offset => {
                grid.addBubble(
                    centerRow + offset.r, 
                    centerCol + offset.c, 
                    new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED)
                );
            });
            
            const connected = colorGroup.findConnectedBubbles(centerRow, centerCol);
            
            // Die zentrale Bubble plus 6 Nachbarn
            expect(connected).toHaveLength(7);
            
            // Überprüfe die zentrale Position
            expect(connected).toContainEqual({ row: centerRow, col: centerCol });
            
            // Überprüfe alle Nachbarpositionen
            neighborOffsets.forEach(offset => {
                expect(connected).toContainEqual({ 
                    row: centerRow + offset.r, 
                    col: centerCol + offset.c 
                });
            });
        });

        test('komplexe Gruppenerkennung mit Verzweigungen', () => {
            // Erstelle eine T-förmige Gruppe
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            
            const connected = colorGroup.findConnectedBubbles(1, 1);
            
            expect(connected).toHaveLength(5);
            expect(connected).toContainEqual({ row: 0, col: 1 });
            expect(connected).toContainEqual({ row: 1, col: 0 });
            expect(connected).toContainEqual({ row: 1, col: 1 });
            expect(connected).toContainEqual({ row: 1, col: 2 });
            expect(connected).toContainEqual({ row: 2, col: 1 });
        });

        test('Randfall: Gruppe am Spielfeldrand', () => {
            // Erstelle eine Gruppe am rechten Rand
            grid.addBubble(0, 7, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            grid.addBubble(1, 7, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            grid.addBubble(2, 7, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            
            const connected = colorGroup.findConnectedBubbles(1, 7);
            
            expect(connected).toHaveLength(3);
            expect(connected).toContainEqual({ row: 0, col: 7 });
            expect(connected).toContainEqual({ row: 1, col: 7 });
            expect(connected).toContainEqual({ row: 2, col: 7 });
        });
    });

    describe('findAndRemoveGroup', () => {
        test('entfernt keine Gruppe unter Mindestgröße', () => {
            grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            const removed = colorGroup.findAndRemoveGroup(0, 0, 3);
            
            expect(removed).toHaveLength(0);
            expect(grid.getBubble(0, 0)).not.toBeNull();
            expect(grid.getBubble(0, 1)).not.toBeNull();
        });

        test('entfernt Gruppe mit Mindestgröße', () => {
            grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            const removed = colorGroup.findAndRemoveGroup(0, 1, 3);
            
            expect(removed).toHaveLength(3);
            expect(grid.getBubble(0, 0)).toBeNull();
            expect(grid.getBubble(0, 1)).toBeNull();
            expect(grid.getBubble(0, 2)).toBeNull();
        });

        test('entfernt L-förmige Gruppe', () => {
            grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            
            const removed = colorGroup.findAndRemoveGroup(1, 1, 3);
            
            expect(removed).toHaveLength(3);
            expect(grid.getBubble(1, 1)).toBeNull();
            expect(grid.getBubble(1, 2)).toBeNull();
            expect(grid.getBubble(2, 1)).toBeNull();
        });

        test('entfernt freischwebende Bubbles nach dem Entfernen einer Gruppe', () => {
            // Erstelle eine Gruppe von drei roten Bubbles, die andere Bubbles stützen
            grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            // Füge Bubbles hinzu, die von den roten Bubbles gestützt werden
            grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.GREEN));
            
            const removed = colorGroup.findAndRemoveGroup(0, 1, 3);
            
            // Sollte sowohl die drei roten Bubbles als auch die zwei gestützten Bubbles entfernen
            expect(removed.length).toBe(5);
            
            // Überprüfe, ob alle Bubbles entfernt wurden
            expect(grid.getBubble(0, 0)).toBeNull();
            expect(grid.getBubble(0, 1)).toBeNull();
            expect(grid.getBubble(0, 2)).toBeNull();
            expect(grid.getBubble(1, 0)).toBeNull();
            expect(grid.getBubble(1, 1)).toBeNull();
        });

        test('entfernt große zusammenhängende Gruppe', () => {
            // Erstelle eine große X-förmige Gruppe
            const positions = [
                [1, 1], [1, 3],
                [2, 2],
                [3, 1], [3, 3]
            ];
            positions.forEach(([row, col]) => {
                grid.addBubble(row, col, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.PURPLE));
            });
            
            const removed = colorGroup.findAndRemoveGroup(2, 2, 3);
            
            expect(removed).toHaveLength(5);
            positions.forEach(([row, col]) => {
                expect(grid.getBubble(row, col)).toBeNull();
            });
        });

        test('behandelt freischwebende Blasen mit zyklischer Verbindung korrekt', () => {
            // Erstelle einen Ring aus Bubbles, der nach dem Entfernen einer Gruppe freischwebt
            grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED)); // Anker zur Decke
            grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.RED));
            
            // Blauer Ring
            grid.addBubble(2, 0, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(2, 2, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            grid.addBubble(3, 1, new Bubble(mockScene, 0, 0, 10, TEST_COLOR_MAP.BLUE));
            
            const removed = colorGroup.findAndRemoveGroup(0, 1, 2); // Entferne die roten Bubbles
            
            // Sollte die 2 roten und alle 4 blauen Bubbles entfernen
            expect(removed).toHaveLength(6);
            
            // Überprüfe, ob alle Bubbles entfernt wurden
            expect(grid.getBubble(0, 1)).toBeNull();
            expect(grid.getBubble(1, 1)).toBeNull();
            expect(grid.getBubble(2, 0)).toBeNull();
            expect(grid.getBubble(2, 1)).toBeNull();
            expect(grid.getBubble(2, 2)).toBeNull();
            expect(grid.getBubble(3, 1)).toBeNull();
        });
    });
});
