// src/utils/brightness.js
export function calculateBrightness(r, g, b) {
    return (r + g + b) / 3 / 255;
  }  