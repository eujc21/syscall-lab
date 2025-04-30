<template>
  <div class="animation-menu-container">
    <div class="box-container">
      <div class="button-container">
        <button
          v-for="option in animationOptions"
          :key="option.value"
          :class="{ active: modelValue === option.value }"
          @click="handleSelection(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps,defineEmits } from 'vue';
const props=defineProps({
  modelValue: {
    type: String,
    required: true
  },
  animationOptions: {
    type: Array,
    required: true,
    validator: (options) => options.every(opt =>
      typeof opt.label=='string'&&
      typeof opt.value=='string'&&
      Object.keys(opt).length===2
    )
  }
});

// Define the event(s) this component can emit
// 'update:modelValue' is the standard event name for v-model compatibility
const emit=defineEmits(['update:modelValue']);


// Function called when a button is clicked
const handleSelection=(value) => {
  if(props.modelValue!==value) {
    emit('update:modelValue',value);
    console.log(`[AnimationSelectionMenu] Animation changed to: ${value}`);
  }
};
</script>

<style scoped>
.animation-menu-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* Consider setting a min-height or using viewport height */
  min-height: 10vh; /* Example */
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

button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  background-color: #f5f5f5;
  color: #333;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

button:hover {
  background-color: #ededed;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.08);
}

button.active {
  background-color: #4caf50; /* Or your theme color */
  color: white;
  font-weight: bold;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) inset; /* Subtle inset shadow */
}
</style>
