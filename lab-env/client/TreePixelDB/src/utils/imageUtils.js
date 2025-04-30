// utils/imageUtils.js
export function applySkyEffect(baseImageData, frame, width, height, whiteObjectThresholdPercentage) {
    const tempImageData = new ImageData(new Uint8ClampedArray(baseImageData.data), width, height);
    const src = baseImageData.data;
    const dest = tempImageData.data;
    const rowWidthBytes = width * 4;

    // --- Carousel Rotation Logic (same as before) ---
    const rotationSpeed = 0.5;
    const rotationAngleDegrees = frame * rotationSpeed;
    const rotationAngleRadians = (rotationAngleDegrees * Math.PI) / 180;
    const maxShift = width;
    const offset = Math.floor((rotationAngleDegrees / 360) * maxShift);
    // -----------------------------

    const whiteThreshold = 200; // Threshold for "white-ish" pixels (adjust as needed)

    // Calculate average blue sky color (once, outside the pixel loops, as it's now static)
    let avgBlueR = 100; // Default blue sky color if no blueish pixels found (adjust RGB values)
    let avgBlueG = 150;
    let avgBlueB = 255;

    // --- Calculate percentage of white-ish pixels ---
    let whitePixelCount = 0;
    const totalPixels = width * height;

    // First pass: Count white-ish pixels
    for (let y = 0; y < height; y++) {
        const rowStart = y * rowWidthBytes;
        for (let x = 0; x < width; x++) {
            const i = rowStart + x * 4;
            const r = src[i];
            const g = src[i + 1];
            const b = src[i + 2];

            const isWhiteish = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;

            if (isWhiteish) {
                whitePixelCount++;
            }
        }
    }

    const whitePixelPercentage = (whitePixelCount / totalPixels) * 100;

    // --- Apply shift logic based on white object percentage ---
    if (whitePixelPercentage >= whiteObjectThresholdPercentage) {
        // Second pass: Process pixels and apply shifts ONLY to white-ish pixels if large white object is present
        for (let y = 0; y < height; y++) {
            const rowStart = y * rowWidthBytes;
            for (let x = 0; x < width; x++) {
                const i = rowStart + x * 4;
                const r = src[i];
                const g = src[i + 1];
                const b = src[i + 2];
                const a = src[i + 3];

                const isWhiteish = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;

                if (isWhiteish) {
                    // Shift white-ish pixels
                    const targetX = (x + offset + width) % width;
                    const j = rowStart + targetX * 4;
                    dest[j] = r;
                    dest[j + 1] = g;
                    dest[j + 2] = b;
                    dest[j + 3] = a;

                    // Fill original white position with the STATIC blue sky color
                    dest[i] = avgBlueR;
                    dest[i + 1] = avgBlueG;
                    dest[i + 2] = avgBlueB;
                    dest[i + 3] = a; // Keep original alpha

                } else {
                    // Non-white pixels are copied directly (remain static)
                    dest[i] = r;
                    dest[i + 1] = g;
                    dest[i + 2] = b;
                    dest[i + 3] = a;
                }
            }
        }
    } else {
        // If white object is not large enough, return original image data without effect
        return baseImageData; // Return the original ImageData directly to avoid unnecessary copy if no effect is applied.
    }

    return tempImageData;
}