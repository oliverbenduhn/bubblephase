// Mobile Bubble Shooter Konfiguration
export const BUBBLE_RADIUS = 15; // Wird dynamisch berechnet

export const BUBBLE_COLORS = {
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    PURPLE: 0x800080,
    ORANGE: 0xffa500,
};

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
