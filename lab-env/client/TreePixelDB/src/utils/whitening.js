// src/utils/whitening.js
import { calculateBrightness } from './brightness.js';

export function whitenPixel(r, g, b, intensity, threshold) {
  const brightness = calculateBrightness(r, g, b);
  if (brightness > threshold) {
    const whitenAmount = (brightness - threshold) / (1 - threshold);
    return [
      Math.min(255, r + (255 - r) * whitenAmount * intensity),
      Math.min(255, g + (255 - g) * whitenAmount * intensity),
      Math.min(255, b + (255 - b) * whitenAmount * intensity)
    ];
  }
  return [r, g, b];
}

export function applyWhiteControls(imageData, whiteIntensity = 1.0, whiteThreshold = 0.5) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const [newR, newG, newB] = whitenPixel(r, g, b, whiteIntensity, whiteThreshold);
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
  return imageData;
}