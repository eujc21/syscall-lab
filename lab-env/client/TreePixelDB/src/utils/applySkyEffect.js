// utils/applySkyEffect.js

import { applyWhiteControls } from './colorControls';
import { applyBlueControlsWebGL } from '../webgl/applyBlueControlsWebGL';
import { applyCarouselRotation, applyShakeMatrix } from './animationEffects';

/**
 * Applies a sky effect to the image data, including color controls and animation.
 *
 * @param {ImageData} baseImageData - The base ImageData object.
 * @param {number} frame - The current frame number for animation.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {object} [options={}] - Options for the sky effect.
 * @param {number} [options.whiteIntensity=1.0] - Intensity of the white control.
 * @param {number} [options.whiteThreshold=0.5] - Threshold for the white control.
 * @param {number} [options.blueIntensity=1.0] - Intensity of the blue control.
 * @param {number} [options.blueThreshold=0.1] - Threshold for the blue control.
 * @param {number} [options.whiteObjectThresholdPercentage=5] - Percentage of white pixels to trigger animation.
 * @param {string} [options.animationType='shake'] - Type of animation ('shake', 'carousel', 'none').
 * @returns {ImageData} The final modified ImageData object.
 */
export function applySkyEffect(
    baseImageData,
    frame,
    width,
    height,
    animationType,
    threshold,
    options = {}
) {

    const {
        whiteIntensity = 1.0,
        whiteThreshold = 0.5,
        blueIntensity = 1.0,
        blueThreshold = 0.1,
        whiteObjectThresholdPercentage = 5, // Default percentage for white object detection
    } = options;
    // Ensure the baseImageData is vali
    // Create a working ImageData for modifications - start with a copy of baseImageData
    let workingImageData = new ImageData(
        new Uint8ClampedArray(baseImageData.data),
        width,
        height
    );


    // Apply Animation Logic based on animationType
    if (animationType === 'carousel') {
        workingImageData = applyCarouselRotation(
            workingImageData,
            frame,
            width,
            height,
            whiteObjectThresholdPercentage
        );
    } else if (animationType === 'shake') {
        workingImageData = applyShakeMatrix(
            workingImageData,
            frame,
            width,
            height,
            whiteObjectThresholdPercentage
        );
    } else if (animationType === 'none' || !animationType) {
        // Do nothing for no animation or default to no animation if type is not recognized
    }
    // --- You can add more animation types here (e.g., 'shake', 'zoom', etc.) ---


    // Apply Color Controls (White and Blue intensification) - always applied, regardless of animation
    let colorControlledImageData = applyWhiteControls(
        workingImageData,
        whiteIntensity,
        whiteThreshold
    ); // Apply to the potentially animated image
    colorControlledImageData = applyBlueControlsWebGL(
        colorControlledImageData,
        blueIntensity,
        blueThreshold
    ); // Apply to the result of white controls

    return colorControlledImageData; // Return the final ImageData with animation (if applicable) and color effects
}
