<template>
  <div class="solarpunk-canvas-container">
    <div class="box-container">
      <h1>Solarpunk Canvas</h1>
      <div class="canvas-container">
        <!-- No need for @mouseenter/@mouseleave here, composable handles it -->
        <canvas ref="canvasRef"></canvas>
        <div
          v-if="!isImageLoaded"
          class="loading-indicator"
        >Loading Image...</div>
      </div>
      <!-- Optional: Display hover state -->
      <p style="text-align: center; margin-top: 1rem; color: #555;">
        Hovering: {{ isHovering.io }} | Frame: {{ currentFrame }} | Coordinates: {{ isHovering ? `(${isHovering.x}, ${isHovering.y})` : 'N/A' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref,defineProps,toRef,watch } from 'vue';
import { useSolarpunkCanvas } from '../composables/useSolarpunkCanvas'; // Adjust path if needed

const props=defineProps({
  effectType: {
    type: String,
    default: 'shake',
    validator: (value) => ['shake','carousel','none'].includes(value)
  },
  imageSrc: {
    type: String,
    required: true
  },
  thresholdPercentage: {
    type: Number,
    default: 5,
    validator: (value) => value>=0&&value<=100
  },
});

const effectTypeRef=toRef(props,'effectType');
const imageSrcRef=toRef(props,'imageSrc');
const thresholdRef=toRef(props,'thresholdPercentage');
const isWebGLSupportedRef=toRef(props,'isWebGLSupported');
const canvasRef=ref(null);

// Use the composable, passing the canvas ref, image source, and options
const { isHovering,isImageLoaded,currentFrame }=useSolarpunkCanvas(
  canvasRef,
  imageSrcRef,
  effectTypeRef,
  thresholdRef,
  isWebGLSupportedRef
);

// No other logic needed here! onMounted, onUnmounted, animation, etc.
// are all handled within the useSolarpunkCanvas composable.
watch(effectTypeRef,(newEffectType) => {
  console.log(`[SolarpunkCanvas] Effect type changed to: ${newEffectType}`);
});

// Watch for image source changes
watch(imageSrcRef,(newImageSrc) => {
  console.log(`[SolarpunkCanvas] Image source changed to: ${newImageSrc}`);
});

</script>

<style scoped>
.solarpunk-canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* Consider setting a min-height or using viewport height */
  min-height: 80vh; /* Example */
  padding: 2rem;
  box-sizing: border-box; /* Include padding in dimensions */
}

.box-container {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Softer shadow */
  /* Let the content define the size, but set max dimensions */
  max-width: 90%;
  max-height: 90vh; /* Ensure it fits viewport */
  display: flex; /* Use flexbox for internal layout */
  flex-direction: column; /* Stack elements vertically */
  overflow: hidden; /* Prevent content spillover */
}

.box-container h1 {
  text-align: center;
  margin-bottom: 1.5rem; /* Increased margin */
  color: #333; /* Darker color for better contrast */
  flex-shrink: 0; /* Prevent title from shrinking */
}

.canvas-container {
  /* Allow container to grow and shrink */
  flex-grow: 1;
  /* Use relative positioning for absolute positioned children like loading indicator */
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Set minimum dimensions if desired */
  min-height: 300px;
  width: 100%;
  overflow: hidden; /* Hide parts of canvas if it overflows */
  background-color: #f0f0f0; /* Light background for contrast */
  border-radius: 8px; /* Rounded corners */
}

canvas {
  /* Ensure canvas scales while maintaining aspect ratio */
  display: block; /* Remove extra space below canvas */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Scale down to fit container */
  /* Add transition for smoother appearance if needed */
  /* transition: opacity 0.3s ease; */
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 10; /* Ensure it's above the canvas area */
}
</style>
