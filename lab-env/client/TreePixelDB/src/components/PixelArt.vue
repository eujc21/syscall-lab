<template>
  <div class="container">
    <div class="box-container">
      <div
        v-html="svgContent"
        class="pixel-art"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref,computed } from 'vue';

const props=defineProps({
  pixelArray: {
    type: Array,
    required: true,
    default: () => []
  },
  scale: {
    type: Number,
    default: 20
  }
});

// Render the pixel array to an SVG:w
const renderPixelArrayToSVG=(pixelArray,scale=20) => {
  const svgHeight=pixelArray.length;
  const svgWidth=pixelArray.reduce((max,row) => Math.max(max,row.length),0);

  const renderRect=(x,y) => {
    if(y>=svgHeight) return ""; // base case
    const row=pixelArray[y]||[];
    const color=row[x]||"transparent";
    const rect=`<rect x="${x*scale}" y="${y*scale}" width="${scale}" height="${scale}" fill="${color}" />`;

    if(x+1>=svgWidth) {
      return rect+renderRect(0,y+1); // go to next row
    }
    return rect+renderRect(x+1,y); // continue in row
  };

  const svgString=
    `<svg width="${svgWidth*scale}" height="${svgHeight*scale}" xmlns="http://www.w3.org/2000/svg">`+
    renderRect(0,0)+
    `</svg>`;

  return svgString;
};

const svgContent=computed(() => renderPixelArrayToSVG(props.pixelArray));
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
}

.box-container {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 90vw;
  height: 100%;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pixel-art {
  display: block;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pixel-art svg {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
</style> 
