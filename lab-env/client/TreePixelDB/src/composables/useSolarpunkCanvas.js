// src/composables/useSolarpunkCanvas.js
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { applySkyEffect } from '../utils/applySkyEffect'; // Ensure path is correct
import { detectWebGL } from '../utils/detectWebGL'; // Ensure path is correct

// --- Configuration for the spread effect ---
const SPREAD_RADIUS = 30; // How far from the cursor to SAMPLE pixels (pixels)
const SCATTER_RADIUS = 45; // How far from the cursor to DRAW the scattered pixels (pixels)
const PIXELS_PER_FRAME =2000; // How many pixels to scatter each frame while hovering
const PIXEL_SIZE = 1; // Size of the scattered pixels (1 for single pixel, >1 for blocky)


export function useSolarpunkCanvas(
    canvasRef,      // Ref<HTMLCanvasElement | null>
    imageSrcRef,    // Ref<string>
    effectTypeRef,  // Ref<string>
    thresholdRef,    // Ref<number>
) {
    // --- Reactive State ---
    // Keep the isHovering object structure
    const isHovering = ref({ io: false, x: 0, y: 0 });
    const isImageLoaded = ref(false);
    const currentFrame = ref(0);
    const isInitialized = ref(false);

    // --- Internal State ---
    let ctx = null;
    let baseImageData = null; // Holds the ORIGINAL unmodified image pixels
    let animationFrameId = null;
    let image = null;
    let canvasElement = null;

    // --- Pixel Scattering Function ---
    const drawPixelSpread = () => {
        if (!ctx || !baseImageData || !isHovering.value.io || !canvasElement) {
            return; // Only run when hovering and everything is ready
        }

        const mouseX = isHovering.value.x;
        const mouseY = isHovering.value.y;
        const data = baseImageData.data;
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;

        // Draw multiple scattered pixels per frame for a denser effect
        for (let i = 0; i < PIXELS_PER_FRAME; i++) {
            // 1. Pick a random source pixel near the cursor (within SPREAD_RADIUS)
            const angleSource = Math.random() * Math.PI * 2;
            const radiusSource = Math.random() * SPREAD_RADIUS;
            const sx = Math.floor(mouseX + Math.cos(angleSource) * radiusSource);
            const sy = Math.floor(mouseY + Math.sin(angleSource) * radiusSource);

            // Ensure source pixel is within canvas bounds
            if (sx < 0 || sx >= canvasWidth || sy < 0 || sy >= canvasHeight) {
                continue; // Skip if source is out of bounds
            }

            // 2. Get the color of the source pixel from baseImageData
            const sourceIndex = (sy * canvasWidth + sx) * 4;
            const r = data[sourceIndex];
            const g = data[sourceIndex + 1];
            const b = data[sourceIndex + 2];
            const a = data[sourceIndex + 3]; // Alpha

            // Skip fully transparent pixels from source
            if (a === 0) {
                continue;
            }

            // 3. Pick a random destination position near the cursor (within SCATTER_RADIUS)
            const angleDest = Math.random() * Math.PI * 2;
            const radiusDest = Math.random() * SCATTER_RADIUS;
            const dx = Math.floor(mouseX + Math.cos(angleDest) * radiusDest);
            const dy = Math.floor(mouseY + Math.sin(angleDest) * radiusDest);

            // Ensure destination is within canvas bounds (optional, could allow scattering off edge)
            if (dx < 0 || dx >= canvasWidth || dy < 0 || dy >= canvasHeight) {
                continue; // Skip if destination is out of bounds
            }


            // 4. Draw the sampled pixel at the destination
            // Use the original alpha, potentially slightly reduced for effect
            // ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255 * 0.8})`; // Example: slightly transparent
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.fillRect(dx, dy, PIXEL_SIZE, PIXEL_SIZE); // Draw the pixel (or small square)
        }
    };

    // --- Animation Loop ---
    const animate = () => {
        // Guard: Ensure everything is ready before drawing
        if (!ctx || !baseImageData || !canvasElement || !isImageLoaded.value || !isInitialized.value) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        const currentEffectType = effectTypeRef.value;
        const currentThreshold = thresholdRef.value;
        // Don't clear the canvas here if the effect *replaces* the base image each frame
        // ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Usually needed unless effect fully redraws

        let imageDataToDraw = baseImageData; // Start with the original

        try {
            // Apply the main background effect *first* (if any)
            if (currentEffectType !== 'none' && typeof applySkyEffect === 'function') {
                console.log("[Composable] Applying sky effect..."); // Less verbose logging
                // Important: applySkyEffect should ideally work non-destructively
                // or we need a copy of baseImageData if it modifies its input.
                // Assuming applySkyEffect returns new ImageData or modifies a copy.
                const tempImageData = applySkyEffect(
                    baseImageData, // Provide original data
                    currentFrame.value,
                    canvasElement.width,
                    canvasElement.height,
                    currentEffectType,
                    currentThreshold,
                );
                // Use the effect result if valid, otherwise fallback to base
                if (tempImageData) {
                    imageDataToDraw = tempImageData;
                }
            }

            // Draw the base image or the result of the sky effect
            ctx.putImageData(imageDataToDraw, 0, 0);

            // --- Add the Pixel Spread Effect on top ---
            if (isHovering.value.io) {
                drawPixelSpread();
            }
            // --- --- ---

        } catch (error) {
            console.error("[Composable] Error during animation frame:", error);
            // Fallback drawing on error: draw original image
            if (baseImageData) ctx.putImageData(baseImageData, 0, 0);
            // Decide if you want to stop on error or just log and continue
            // stopAnimation();
        }

        currentFrame.value++;
        animationFrameId = requestAnimationFrame(animate); // Continue the loop
    };

    // --- Animation Control ---
    const stopAnimation = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };

    const startAnimation = () => {
        stopAnimation();
        currentFrame.value = 0;
        if (isInitialized.value && isImageLoaded.value) {
            console.log("[Composable] Starting animation loop.");
            animate();
        } else {
            console.warn(`[Composable] Start animation skipped. Initialized: ${isInitialized.value}, Image Loaded: ${isImageLoaded.value}`);
        }
    };

    // --- Event Handlers ---
    // Correctly calculate coordinates relative to the canvas
    const updateHoverCoordinates = (event) => {
        if (!canvasElement) return { x: 0, y: 0};
        const rect = canvasElement.getBoundingClientRect();
        // Use Math.floor to ensure integer coordinates if needed by effects
        const x = Math.floor(event.clientX - rect.left);
        const y = Math.floor(event.clientY - rect.top);
        // Clamp coordinates to be within the canvas boundaries
        const clampedX = Math.max(0, Math.min(x, canvasElement.width - 1));
        const clampedY = Math.max(0, Math.min(y, canvasElement.height - 1));
        return { x: clampedX, y: clampedY };
    };

    const handleMouseEnter = (event) => {
        const { x, y } = updateHoverCoordinates(event);
        isHovering.value = { io: true, x, y }; // Update state in one go
        console.log(`Mouse Enter: (${x}, ${y})`);
    };

    const handleMouseLeave = (event) => {
        // Position might be less relevant on leave, but update anyway
        const { x, y } = updateHoverCoordinates(event);
        isHovering.value = { io: false, x, y }; // Update state in one go
        console.log(`Mouse Leave: (${x}, ${y})`);
        // No need to manually redraw here, the animation loop handles the state change
    };

    const handleMouseMove = (event) => {
        // Only update coordinates, io state is already true
        const { x, y } = updateHoverCoordinates(event);
        if (isHovering.value.io) { // Only update if already hovering
            isHovering.value.x = x;
            isHovering.value.y = y;
        } else {
            // If somehow mousemove fires before mouseenter (rare edge case)
            isHovering.value = { io: true, x, y };
        }
        // No need to manually redraw, animation loop handles it
    };

    // --- Image Loading Function ---
    const loadImage = (src) => {
        // ... (loadImage function remains largely the same)
        // Ensure it calls startAnimation() in image.onload AFTER baseImageData is captured
        // ...

        console.log(`[Composable] Loading image: ${src}`);
        isImageLoaded.value = false;
        stopAnimation(); // Stop while loading new image

        if (!ctx || !canvasElement) {
            console.warn("[Composable] loadImage called before canvas context/element ready.");
            return; // Need context to clear/draw loading text
        }

        // Clear canvas and show loading state
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.fillStyle = '#ccc';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading image...', canvasElement.width / 2, canvasElement.height / 2);


        image = new Image();
        // image.crossOrigin = "Anonymous"; // Essential if image is from another domain

        image.onload = () => {
            if (!ctx || !canvasElement) {
                console.warn("[Composable] Canvas context or element disappeared during image load.");
                return;
            }
            console.log("[Composable] Image loaded successfully.");

            // Resize canvas to match image
            if(canvasElement.width !== image.naturalWidth || canvasElement.height !== image.naturalHeight) {
                canvasElement.width = image.naturalWidth; // Use naturalWidth/Height for original size
                canvasElement.height = image.naturalHeight;
                console.log(`[Composable] Canvas resized to ${canvasElement.width}x${canvasElement.height}`);
            }

            ctx.drawImage(image, 0, 0);

            try {
                baseImageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); // Capture pixels
                isImageLoaded.value = true;
                console.log("[Composable] Base image data captured.");
                startAnimation(); // Start animation AFTER loading and capturing
            } catch (e) {
                console.error("[Composable] Error getting ImageData (CORS issue?):", e);
                isImageLoaded.value = false;
                // Draw error on canvas
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText('Error processing image data (CORS?)', canvasElement.width / 2, canvasElement.height / 2 + 20);
                // Potentially try to show the image anyway if possible?
                // ctx.drawImage(image, 0, 0);
            }
        };

        image.onerror = (err) => {
            console.error("[Composable] Failed to load image:", src, err);
            isImageLoaded.value = false;
            if(ctx && canvasElement) { // Check element too
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText(`Error loading: ${src.split('/').pop()}`, canvasElement.width / 2, canvasElement.height / 2);
            }
        };

        image.src = src;
    };

    // --- Initialization Function ---
    const initializeCanvas = async () => {
        // ... (initialization code remains largely the same)
        // Make SURE event listeners are added correctly here:
        // ...
        if (!canvasRef.value) {
            // ... error handling ...
            return;
        }
        console.log("[Composable] Starting initialization...");
        canvasElement = canvasRef.value;
        // --- Try to get context with alpha enabled ---
        // This might be needed if your scattered pixels have alpha,
        // or if the base image has transparency you want to preserve.
        // However, it can have performance implications. Test without it first.
        // ctx = canvasElement.getContext('2d', { alpha: true });
        ctx = canvasElement.getContext('2d'); // Default: alpha: false

        if (!ctx) {
            console.error("[Composable] Failed to get 2D context.");
            return;
        }
        console.log("[Composable] Canvas context obtained.");

        // --- Setup ALL mouse interaction listeners ONCE ---
        canvasElement.addEventListener('mouseenter', handleMouseEnter);
        canvasElement.addEventListener('mouseleave', handleMouseLeave);
        canvasElement.addEventListener('mousemove', handleMouseMove); // Add mousemove listener here!
        console.log("[Composable] Event listeners added (mouseenter, mouseleave, mousemove).");

        isInitialized.value = true;
        console.log("[Composable] Core initialization complete.");

        // ... (rest of the initialization, loading initial image) ...
        if (imageSrcRef.value) {
            console.log("[Composable] Initial image source found, loading image.");
            loadImage(imageSrcRef.value);
        } else {
            // ... (placeholder text) ...
        }
    };

    // --- Cleanup Function ---
    const cleanup = () => {
        console.log("[Composable] Cleaning up...");
        stopAnimation();
        if (canvasElement) {
            // --- Remove ALL listeners ---
            canvasElement.removeEventListener('mouseenter', handleMouseEnter);
            canvasElement.removeEventListener('mouseleave', handleMouseLeave);
            canvasElement.removeEventListener('mousemove', handleMouseMove); // Remove mousemove listener!
        }
        // ... (resetting other state variables) ...
        ctx = null;
        baseImageData = null;
        image = null;
        canvasElement = null;
        isImageLoaded.value = false;
        // Reset hover state completely
        isHovering.value = { io: false, x: 0, y: 0 };
        currentFrame.value = 0;
        isInitialized.value = false;
    };

    // --- Lifecycle Hooks ---
    onMounted(() => {
        console.log("[Composable] Component Mounted. Triggering initialization.");
        // const {supported} = detectWebGL(); // Keep if needed elsewhere
        // console.log("[Composable] WebGL support detected:", supported);
        initializeCanvas();
    });

    onUnmounted(() => {
        console.log("[Composable] Component Unmounted. Cleaning up.");
        cleanup();
    });

    // --- Watchers ---
    // ... (watchers remain the same, make sure loadImage is called correctly) ...


    // --- Return Values ---
    return {
        isHovering, // The component might want to know the state/position
        isImageLoaded,
        currentFrame,
        isInitialized,
    };
}
