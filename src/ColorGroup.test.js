import { Collision } from './Collision';
import { Grid } from './Grid';
import { Bubble, BUBBLE_COLORS } from './Bubble';

// Mock für Phaser.Scene
const mockScene = {
    add: {
        circle: () => ({
            setFillStyle: () => {},
            setStrokeStyle: () => {},
            setPosition: () => {},
            destroy: () => {}
        })
    }
};

describe('Color Group Detection', () => {
    let grid;
    
    beforeEach(() => {
        grid = new Grid(mockScene, 8, 8, 0, 0); // 8x8 Grid für Tests
    });

    test('findet keine Gruppe bei einzelner Bubble', () => {
        // Eine einzelne rote Bubble
        grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        
        const { size, positions } = Collision.findColorGroup(grid, 0, 0, 3);
        
        expect(size).toBe(1);
        expect(positions).toHaveLength(1);
    });

    test('findet Gruppe von drei gleichfarbigen Bubbles', () => {
        // Drei rote Bubbles in einer horizontalen Reihe
        grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        grid.addBubble(0, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        
        const { size, positions } = Collision.findColorGroup(grid, 0, 1, 3);
        
        expect(size).toBe(3);
        expect(positions).toHaveLength(3);
        expect(positions).toContainEqual({ row: 0, col: 0 });
        expect(positions).toContainEqual({ row: 0, col: 1 });
        expect(positions).toContainEqual({ row: 0, col: 2 });
    });

    test('ignoriert unterschiedliche Farben', () => {
        // Eine rote Bubble umgeben von blauen
        grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
        grid.addBubble(1, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
        grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
        grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.BLUE));
        
        const { size, positions } = Collision.findColorGroup(grid, 1, 1, 3);
        
        expect(size).toBe(1);
        expect(positions).toHaveLength(1);
        expect(positions).toContainEqual({ row: 1, col: 1 });
    });

    test('findet komplexe Gruppen in verschiedenen Richtungen', () => {
        // Eine L-förmige Gruppe von grünen Bubbles
        grid.addBubble(1, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
        grid.addBubble(1, 2, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
        grid.addBubble(1, 3, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
        grid.addBubble(2, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
        grid.addBubble(3, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.GREEN));
        
        const { size, positions } = Collision.findColorGroup(grid, 1, 1, 3);
        
        expect(size).toBe(5);
        expect(positions).toHaveLength(5);
        expect(positions).toContainEqual({ row: 1, col: 1 });
        expect(positions).toContainEqual({ row: 1, col: 2 });
        expect(positions).toContainEqual({ row: 1, col: 3 });
        expect(positions).toContainEqual({ row: 2, col: 1 });
        expect(positions).toContainEqual({ row: 3, col: 1 });
    });

    test('berücksichtigt die Mindestgruppengröße', () => {
        // Zwei rote Bubbles (unter der Mindestgröße von 3)
        grid.addBubble(0, 0, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        grid.addBubble(0, 1, new Bubble(mockScene, 0, 0, 10, BUBBLE_COLORS.RED));
        
        const { size, positions } = Collision.findColorGroup(grid, 0, 0, 3);
        
        expect(size).toBe(2);
        expect(positions).toHaveLength(2);
    });
});
