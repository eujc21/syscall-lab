import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { applySkyEffect } from '../utils/applySkyEffect';

export function useCanvasImageInteraction(
  canvasRef, imageUrl, options = {}) {
  const {
    effectType = 'shake',
    thresholdPercentage = 5,
    hoverEffect = 'freeze',
    maxFrames = 60 // <<< Add option for cycle length, default to 60
  } = options;

  const isLoaded = ref(false);
  const isHovering = ref(false);
  const ctx = shallowRef(null);
  const baseImageData = shallowRef(null);
  const img = shallowRef(null);

  let frame = 0; // This can still increase indefinitely
  let animationFrameId = null;

  const animate = () => {
    if (!ctx.value || !baseImageData.value || !img.value) {
      // console.warn('Animation skipped: Canvas context or image data not ready.');
      requestAnimationFrame(animate); // Still request next frame to eventually start
      return;
    }

    const width = img.value.width;
    const height = img.value.height;

    if (isHovering.value) {
      // --- Hover Logic ---
      if (hoverEffect === 'freeze') {
        ctx.value.putImageData(baseImageData.value, 0, 0);
      } else if (hoverEffect === 'none') {
        // Do nothing, leave the last drawn frame
      }
      // No frame increment needed visually during hover pause
    } else {
      // --- Regular Animation Logic ---

      // Calculate the effective frame within the cycle
      const effectiveFrame = frame % maxFrames; // <<< Use modulo

      const tempImageData = applySkyEffect(
        baseImageData.value,
        effectiveFrame, // <<< Pass the effective frame
        width,
        height,
        effectType,
        thresholdPercentage
      );

      if (tempImageData) {
        ctx.value.putImageData(tempImageData, 0, 0);
      } else {
        ctx.value.putImageData(baseImageData.value, 0, 0);
      }
      frame++; // Increment the master frame counter only when animating
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  // ... (setupCanvas remains the same) ...

  const handleMouseEnter = () => {
    isHovering.value = true;
  };

  const handleMouseLeave = () => {
    isHovering.value = false;
  };

 const setupCanvas = () => {
    if (!canvasRef.value) {
      console.error('Canvas element not found.');
      return;
    }
    const canvasElement = canvasRef.value;
    const context = canvasElement.getContext('2d');
    if (!context) {
      console.error('Failed to get 2D context');
      return;
    }
    ctx.value = context;

    const image = new Image();
    img.value = image; // Store image ref

    image.onload = () => {
      canvasElement.width = image.width;
      canvasElement.height = image.height;
      ctx.value.drawImage(image, 0, 0);
      try {
        baseImageData.value = ctx.value.getImageData(0, 0, image.width, image.height);
        isLoaded.value = true;
        console.log('Image loaded and baseImageData captured.');

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        // Start animation loop
        animate(); // <<<<< Start animation here

        // Add event listeners *after* setup is complete
        canvasElement.addEventListener('mouseenter', handleMouseEnter);
        canvasElement.addEventListener('mouseleave', handleMouseLeave);

      } catch (e) {
          console.error("Failed to get image data:", e);
      }
    };

    image.onerror = (err) => {
      console.error('Failed to load image:', imageUrl, err);
      isLoaded.value = false;
    };

    image.src = imageUrl;
  };


  const cleanup = () => {
    console.log('Cleaning up canvas interaction');
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (canvasRef.value) {
      canvasRef.value.removeEventListener('mouseenter', handleMouseEnter);
      canvasRef.value.removeEventListener('mouseleave', handleMouseLeave);
    }
  };

  onMounted(setupCanvas);
  onUnmounted(cleanup);

  return {
    isLoaded,
    isHovering,
  };
}
