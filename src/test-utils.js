// Test utility to map old BUBBLE_COLORS to new logical color IDs
import { BUBBLE_COLOR_IDS } from './config';

// Mapping von alten Farb-Konstanten zu neuen logischen IDs
export const TEST_COLOR_MAP = {
    RED: BUBBLE_COLOR_IDS.A,
    GREEN: BUBBLE_COLOR_IDS.B,
    BLUE: BUBBLE_COLOR_IDS.C,
    YELLOW: BUBBLE_COLOR_IDS.D,
    PURPLE: BUBBLE_COLOR_IDS.E,
    ORANGE: BUBBLE_COLOR_IDS.F
};

// Helper function für Tests
export const getTestColorId = (oldColorName) => {
    if (oldColorName in TEST_COLOR_MAP) {
        return TEST_COLOR_MAP[oldColorName];
    } else {
        // Optional: Standardwert zurückgeben oder Fehler werfen
        // return DEFAULT_COLOR_ID;
        throw new Error(`Ungültiger Farbname: ${oldColorName}`);
    }
};
