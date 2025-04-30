// utils/animationEffects.js

/**
 * Applies a shake effect to the image data based on white object percentage.
 *
 * @param {ImageData} baseImageData - The base ImageData object.
 * @param {number} frame - The current frame number for animation.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {number} whiteObjectThresholdPercentage - The percentage of white pixels to trigger the effect.
 * @returns {ImageData} The modified ImageData object with shake effect, or original if threshold not met.
 */
export function applyShakeMatrix(
    baseImageData,
    frame,
    width,
    height,
    whiteObjectThresholdPercentage
) {
    const tempImageData = new ImageData(
        new Uint8ClampedArray(baseImageData.data),
        width,
        height
    );
    const src = baseImageData.data;
    const dest = tempImageData.data;

    const totalPixels = width * height;
    const whiteishThreshold = 200;

    // Count white-ish pixels
    let whitePixelCount = 0;
    for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = src[offset];
        const g = src[offset + 1];
        const b = src[offset + 2];
        if ((r || g || b) > whiteishThreshold) {
            whitePixelCount++;
        }
    }

    const whitePercentage = (whitePixelCount / totalPixels) * 100;
    if (whitePercentage < whiteObjectThresholdPercentage) return baseImageData;

    // Define shake matrix (affine transformation)
    const shakeIntensity = 5;

    // Multiply frame by higher frequency
    const frequency = 0.3;
    const tx = Math.round(
        Math.sin(
            frame * frequency + Math.PI / 4
        ) * shakeIntensity
    );
    const ty = Math.round(
        Math.cos(
            frame * frequency + Math.PI / 3
        ) * shakeIntensity
    );


    // Identity + shake offset
    const transform = {
        a: 1, b: 0,
        c: 0, d: 1,
        tx, ty
    };

    const applyTransform = (x, y) => {
        const newX = Math.max(
            0,
            Math.min(
                width - 1,
                transform.a * x + transform.c * y + transform.tx
            )
        );
        const newY = Math.max(
            0,
            Math.min(
                height - 1,
                transform.b * x + transform.d * y + transform.ty
            )
        );
        return { x: newX, y: newY };
    };

    // Transform pixels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = src[i];
            const g = src[i + 1];
            const b = src[i + 2];
            const a = src[i + 3];

            const isWhiteish = (r || g || b) > whiteishThreshold;

            if (isWhiteish) {
                const { x: nx, y: ny } = applyTransform(x, y);
                const j = (ny * width + nx) * 4;

                // Apply transformed pixel
                dest[j] = r;
                dest[j + 1] = g;
                dest[j + 2] = b;
                dest[j + 3] = a;

                // Fill original with bluish hue
                dest[i] = 100;
                dest[i + 1] = 150;
                dest[i + 2] = 255;
                dest[i + 3] = a;
            } else {
                dest[i] = r;
                dest[i + 1] = g;
                dest[i + 2] = b;
                dest[i + 3] = a;
            }
        }
    }

    return tempImageData;
}


/**
 * Applies a carousel rotation effect to the image data based on white object percentage.
 *
 * @param {ImageData} baseImageData - The base ImageData object.
 * @param {number} frame - The current frame number for animation.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {number} whiteObjectThresholdPercentage - The percentage of white pixels to trigger the effect.
 * @returns {ImageData} The modified ImageData object with carousel rotation, or original if threshold not met.
 */
export function applyCarouselRotation(baseImageData, frame, width, height, whiteObjectThresholdPercentage) {
    const tempImageData = new ImageData(new Uint8ClampedArray(baseImageData.data), width, height);
    const src = baseImageData.data;
    const dest = tempImageData.data;
    const rowWidthBytes = width * 4;

    // --- Carousel Rotation Logic ---
    const rotationSpeed = 0.5;
    const rotationAngleDegrees = frame * rotationSpeed;
    const rotationAngleRadians = (rotationAngleDegrees * Math.PI) / 180;
    const maxShift = width;
    const offset = Math.floor((rotationAngleDegrees / 360) * maxShift);
    // -----------------------------

    const whiteishThreshold = 200; // Threshold for "white-ish" pixels for rotation

    // --- Calculate percentage of white-ish pixels for rotation condition ---
    let whitePixelCount = 0;
    const totalPixels = width * height;

    const pixelCount = width * height;
    for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4;
        const r = src[offset];
        const g = src[offset + 1];
        const b = src[offset + 2];

        if (r > whiteishThreshold && g > whiteishThreshold && b > whiteishThreshold) {
            whitePixelCount++;
        }
    }

    const whitePixelPercentage = (whitePixelCount / totalPixels) * 100;
    let shouldApplyRotation = whitePixelPercentage >= whiteObjectThresholdPercentage;

    if (shouldApplyRotation) {
        // Second pass: Process pixels and apply shifts ONLY to white-ish pixels for rotation
        for (let y = 0; y < height; y++) {
            const rowStart = y * rowWidthBytes;
            for (let x = 0; x < width; x++) {
                const i = rowStart + x * 4;
                const r = src[i];
                const g = src[i + 1];
                const b = src[i + 2];
                const a = src[i + 3];

                const isWhiteish = r > whiteishThreshold && g > whiteishThreshold && b > whiteishThreshold;

                if (isWhiteish) {
                    // Shift white-ish pixels for rotation
                    const targetX = (x + offset + width) % width;
                    const j = rowStart + targetX * 4;
                    dest[j] = r;
                    dest[j + 1] = g;
                    dest[j + 2] = b;
                    dest[j + 3] = a;

                    // Fill original white position with a default blue color
                    dest[i] = 100; // R for blue-ish fill
                    dest[i + 1] = 150; // G for blue-ish fill
                    dest[i + 2] = 255; // B for blue-ish fill
                    dest[i + 3] = a; // Keep original alpha

                } else {
                    // Non-white pixels are copied directly (remain static for rotation part)
                    dest[i] = r;
                    dest[i + 1] = g;
                    dest[i + 2] = b;
                    dest[i + 3] = a;
                }
            }
        }
        return tempImageData; // Return modified ImageData with rotation
    } else {
        return baseImageData; // Return original ImageData if rotation not applied
    }
}

