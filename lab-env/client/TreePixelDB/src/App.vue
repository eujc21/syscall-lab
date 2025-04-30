<script setup>
import { ref } from 'vue';
import SolarpunkCanvas from './components/SolarpunkCanvas.vue'
import AnimationSelectionMenu from './components/AnimationSelectionMenu.vue';
import solarpunkImage from './assets/solarpunk.jpg'; // Adjust path if needed

// -- State Management --
const selectedAnimation=ref('shake');
const isWebGLSupported=ref(false);
const animationList=ref([
  { label: 'Shake',value: 'shake' },
  { label: 'Carousel',value: 'carousel' },
  { label: 'No Effect',value: 'none' }
]);
</script>

<template>
  <div class="bg-gray-800 mx-auto max-w-7x1 p-4 app">
    <AnimationSelectionMenu
      v-model="selectedAnimation"
      :animation-options="animationList"
    />
    <SolarpunkCanvas
      :effect-type="selectedAnimation"
      :image-src="solarpunkImage"
      :threshold-percentage="5"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .app {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
