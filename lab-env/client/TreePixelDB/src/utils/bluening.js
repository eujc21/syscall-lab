// src/utils/bluening.js
import { calculateBrightness } from './brightness.js';

export function bluePixel(r, g, b, intensity, threshold) {
  const brightness = calculateBrightness(r, g, b);
  if (brightness < threshold) {
    const blueAmount = (threshold - brightness) / threshold;
    return [
      Math.max(0, r - r * blueAmount * intensity),
      Math.max(0, g - g * blueAmount * intensity),
      Math.min(255, b + (255 - b) * blueAmount * intensity)
    ];
  }
  return [r, g, b];
}

export function applyBlueControls(imageData, blueIntensity = 1.0, blueThreshold = 0.3) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const [newR, newG, newB] = bluePixel(r, g, b, blueIntensity, blueThreshold);
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
  return imageData;
}