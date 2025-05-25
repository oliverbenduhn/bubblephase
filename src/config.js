// Mobile Bubble Shooter Konfiguration
export const BUBBLE_RADIUS = 15; // Wird dynamisch berechnet

// Logische Bubble-Farb-Identifikatoren (bleiben konstant über alle Themen)
export const BUBBLE_COLOR_IDS = {
    A: 'COLOR_A',
    B: 'COLOR_B', 
    C: 'COLOR_C',
    D: 'COLOR_D',
    E: 'COLOR_E',
    F: 'COLOR_F',
    G: 'COLOR_G'
};

// Standard Bubble Farben (für Rückwärtskompatibilität)
export const BUBBLE_COLORS = {
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    PURPLE: 0x800080,
    ORANGE: 0xffa500,
};

// Verschiedene Farbthemen für die Kugeln
export const COLOR_THEMES = {
    STANDARD: {
        name: "Standard",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xff0000,    // Rot
            [BUBBLE_COLOR_IDS.B]: 0x00ff00,    // Grün
            [BUBBLE_COLOR_IDS.C]: 0x0000ff,    // Blau
            [BUBBLE_COLOR_IDS.D]: 0xffff00,    // Gelb
            [BUBBLE_COLOR_IDS.E]: 0x800080,    // Lila
            [BUBBLE_COLOR_IDS.F]: 0xffa500,    // Orange
            [BUBBLE_COLOR_IDS.G]: 0xff69b4,    // Pink
        },
        background: {
            from: 0x0066cc,     // Blau
            to: 0x4B0082,       // Deep Purple
            cssGradient: 'linear-gradient(135deg, #0066cc 0%, #4B0082 100%)'
        }
    },
    PASTEL: {
        name: "Pastelltöne",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xffb6c1,    // Hellrosa
            [BUBBLE_COLOR_IDS.B]: 0x98fb98,    // Mintgrün
            [BUBBLE_COLOR_IDS.C]: 0x87ceeb,    // Himmelblau
            [BUBBLE_COLOR_IDS.D]: 0xfffacd,    // Cremeweiß
            [BUBBLE_COLOR_IDS.E]: 0xe6e6fa,    // Lavendel
            [BUBBLE_COLOR_IDS.F]: 0xffcba4,    // Pfirsich
            [BUBBLE_COLOR_IDS.G]: 0xf0e68c,    // Khaki
        },
        background: {
            from: 0xf5f7fa,     // Helles Weiß
            to: 0xc3cfe2,       // Sanftes Blau
            cssGradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
    },
    OCEAN: {
        name: "Ocean/Aqua",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xff7f50,    // Koralle
            [BUBBLE_COLOR_IDS.B]: 0x2e8b57,    // Seeschaum-Grün
            [BUBBLE_COLOR_IDS.C]: 0x000080,    // Marineblau
            [BUBBLE_COLOR_IDS.D]: 0x7fffd4,    // Aquamarin
            [BUBBLE_COLOR_IDS.E]: 0x40e0d0,    // Türkis
            [BUBBLE_COLOR_IDS.F]: 0xf8f8ff,    // Perlweiß
            [BUBBLE_COLOR_IDS.G]: 0x4682b4,    // Stahlblau
        },
        background: {
            from: 0x667db6,     // Helles Blau
            to: 0x0052d4,       // Tiefes Blau
            cssGradient: 'linear-gradient(135deg, #667db6 0%, #0082c8 35%, #0052d4 100%)'
        }
    },
    NEON: {
        name: "Neon/Glow",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xff1493,    // Pink
            [BUBBLE_COLOR_IDS.B]: 0x39ff14,    // Neongrün
            [BUBBLE_COLOR_IDS.C]: 0x0080ff,    // Elektroblau
            [BUBBLE_COLOR_IDS.D]: 0x00ffff,    // Cyan
            [BUBBLE_COLOR_IDS.E]: 0xff00ff,    // Magenta
            [BUBBLE_COLOR_IDS.F]: 0xff4500,    // Hellorange
            [BUBBLE_COLOR_IDS.G]: 0xffd700,    // Gold
        },
        background: {
            from: 0x1a1a2e,     // Dunkelblau
            to: 0x0f3460,       // Violett-Blau
            cssGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        }
    },
    GEMSTONE: {
        name: "Edelsteine",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xe0115f,    // Rubin
            [BUBBLE_COLOR_IDS.B]: 0x50c878,    // Smaragd
            [BUBBLE_COLOR_IDS.C]: 0x0f52ba,    // Saphir
            [BUBBLE_COLOR_IDS.D]: 0xffc87c,    // Topas
            [BUBBLE_COLOR_IDS.E]: 0x9966cc,    // Amethyst
            [BUBBLE_COLOR_IDS.F]: 0xb9f2ff,    // Diamant
            [BUBBLE_COLOR_IDS.G]: 0xc0c0c0,    // Silber
        },
        background: {
            from: 0x2c1810,     // Dunkelbraun
            to: 0x8b4513,       // Mittelbraun
            cssGradient: 'linear-gradient(135deg, #2c1810 0%, #5c3317 50%, #8b4513 100%)'
        }
    },
    AUTUMN: {
        name: "Herbstlich",
        colors: {
            [BUBBLE_COLOR_IDS.A]: 0xb7410e,    // Rostrot
            [BUBBLE_COLOR_IDS.B]: 0x228b22,    // Waldgrün
            [BUBBLE_COLOR_IDS.C]: 0x954535,    // Kastanienbraun
            [BUBBLE_COLOR_IDS.D]: 0xffd700,    // Goldgelb
            [BUBBLE_COLOR_IDS.E]: 0xffbf00,    // Bernstein
            [BUBBLE_COLOR_IDS.F]: 0xfffdd0,    // Cremeweiß
            [BUBBLE_COLOR_IDS.G]: 0xdc143c,    // Karminrot
        },
        background: {
            from: 0xff9a9e,     // Lachsrosa
            to: 0xfecfef,       // Helles Rosa
            cssGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
        }
    }
};

// Aktuelle Farben (wird zur Laufzeit gesetzt)
export let CURRENT_BUBBLE_COLORS = COLOR_THEMES.STANDARD.colors;

// Aktuelles Theme und Index für den Wechsel
let currentThemeIndex = 0;
const themeKeys = Object.keys(COLOR_THEMES);

// Hilfsfunktion: Konvertiert Farb-ID zu aktuellem Farbwert
export function getColorValue(colorId) {
    return CURRENT_BUBBLE_COLORS[colorId] || CURRENT_BUBBLE_COLORS[BUBBLE_COLOR_IDS.A];
}

// Hilfsfunktion: Gibt alle verfügbaren Farb-IDs zurück
export function getAvailableColorIds() {
    return Object.values(BUBBLE_COLOR_IDS);
}

// Hilfsfunktion: Wählt eine zufällige Farb-ID aus
export function getRandomColorId() {
    const colorIds = getAvailableColorIds();
    return colorIds[Math.floor(Math.random() * colorIds.length)];
}

// Funktion zum Wechseln zu einem spezifischen Theme (für Tests)
export function switchToTheme(themeIndex) {
    if (themeIndex >= 0 && themeIndex < themeKeys.length) {
        currentThemeIndex = themeIndex;
        const themeKey = themeKeys[themeIndex];
        const theme = COLOR_THEMES[themeKey];
        CURRENT_BUBBLE_COLORS = theme.colors;
        return theme;
    }
    return null;
}

// Funktion zum Wechseln des Farbthemas
export function switchColorTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themeKeys.length;
    const newThemeKey = themeKeys[currentThemeIndex];
    const newTheme = COLOR_THEMES[newThemeKey];
    
    // Aktualisiere die aktuellen Farben
    CURRENT_BUBBLE_COLORS = newTheme.colors;
    
    return {
        themeName: newTheme.name,
        colors: newTheme.colors,
        themeKey: newThemeKey
    };
}

// Funktion zum Abrufen des aktuellen Themes
export function getCurrentTheme() {
    const currentThemeKey = themeKeys[currentThemeIndex];
    return {
        themeName: COLOR_THEMES[currentThemeKey].name,
        colors: CURRENT_BUBBLE_COLORS,
        themeKey: currentThemeKey
    };
}

// Mobile-optimierte Spielkonfiguration
export const MOBILE_CONFIG = {
    MIN_GROUP_SIZE: 3,
    MAX_ANGLE: 75, // Maximaler Schusswinkel (in Grad)
    INITIAL_ROWS: 5,
    GAME_OVER_LINE_OFFSET: 120,
    SHOOT_POWER: 700,
    UI_SCALE: 0.8,
    TEXT_SIZE: 16
};
