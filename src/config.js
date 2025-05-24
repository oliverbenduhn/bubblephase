export const BUBBLE_RADIUS = 15;

export const BUBBLE_COLOR_IDS = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5
};

const COLOR_THEMES = {
  default: {
    colors: [
      0xff0000, // Rot
      0x00ff00, // Grün
      0x0000ff, // Blau
      0xffff00, // Gelb
      0x800080, // Lila
      0xffa500  // Orange
    ]
  },
  pastel: {
    colors: [
      0xffb6c1, // Hellrosa
      0x98fb98, // Hellgrün
      0xadd8e6, // Hellblau
      0xffffe0, // Hellgelb
      0xd8bfd8, // Thistle
      0xffdab9  // Pfirsich
    ]
  },
  ocean: {
    colors: [
      0xff7f50, // Koralle
      0x20b2aa, // Lichtseeblau
      0x87ceeb, // Himmelblau (angepasst)
      0x778899, // Lichtschiefergrau
      0xb0c4de, // Lichtstahlblau
      0xffffe0  // Hellgelb
    ]
  }
};

const themeKeys = Object.keys(COLOR_THEMES);
let currentThemeIndex = 0;

let _currentBubbleColors = COLOR_THEMES[themeKeys[currentThemeIndex]].colors;

export function getRandomColorId() {
  const colorIds = getAvailableColorIds();
  return colorIds[Math.floor(Math.random() * colorIds.length)];
}

export function getAvailableColorIds() {
  return Object.values(BUBBLE_COLOR_IDS);
}

export function getCurrentBubbleColors() {
  return _currentBubbleColors;
}

export function getColorValue(colorId) {
  return _currentBubbleColors[colorId];
}

// Funktion zum Wechseln zu einem spezifischen Theme (für Tests)
export function switchToTheme(themeIndex) {
  if (
    typeof themeIndex === 'number' &&
    Number.isInteger(themeIndex) &&
    themeIndex >= 0 &&
    themeIndex < themeKeys.length
  ) {
    currentThemeIndex = themeIndex;
    const themeKey = themeKeys[themeIndex];
    const theme = COLOR_THEMES[themeKey];
    _currentBubbleColors = theme.colors;
    return theme;
  }
  return null;
}

// Funktion zum Wechseln des Farbthemas
export function switchColorTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themeKeys.length;
  const newThemeKey = themeKeys[currentThemeIndex];
  const newTheme = COLOR_THEMES[newThemeKey];
  _currentBubbleColors = newTheme.colors;
  return newTheme;
}
