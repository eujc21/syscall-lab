---

```markdown
# 🖼️ WebGL Image Processing Modules

This directory contains a modular WebGL pipeline for applying real-time visual effects to images. The structure is designed for **reusability**, **clarity**, and **performance**, enabling easy expansion to other visual filters beyond the provided `blueControls` effect.

---

## 📁 Directory Structure

```
webgl/
├── applyBlueControlsWebGL.js       # Entry point for applying blue threshold-based filtering
├── shaders/
│   ├── vertexShader.glsl           # Reusable vertex shader (transforms screen quad)
│   └── blueControlFragment.glsl    # Fragment shader for blue channel manipulation
└── utils/
    ├── compileShader.js            # Compiles GLSL shaders with error checking
    ├── createGLContext.js          # Creates a headless WebGL context on an in-memory canvas
    ├── createProgram.js            # Links compiled shaders into a program
    ├── setupTexture.js             # Creates and binds a texture from ImageData
    └── setupVertexBuffer.js        # Prepares the vertex buffer for drawing a fullscreen quad
```

---

## 🔧 Why Modular?

WebGL code can get messy fast. This layout ensures:

- ✅ **Separation of Concerns** – each utility handles one job.
- 🔄 **Reusability** – shaders and GL helpers can be reused across different filters.
- 🚀 **Extensibility** – new filters can be added with minimal duplication.
- 🧪 **Testability** – core logic (e.g., texture setup, shader compilation) can be unit-tested.

---

## 📦 How Each Part Works

### `applyBlueControlsWebGL.js`
- High-level API to apply a **blue threshold and enhancement effect**.
- Uses the WebGL helpers to handle GL setup, shader binding, and pixel output.

### `shaders/`
- `vertexShader.glsl`: Draws a full-screen triangle strip. Same for most 2D effects.
- `blueControlFragment.glsl`: Calculates brightness and shifts blue levels if under threshold.

You can **swap fragment shaders** to change the effect — ideal for grayscale, inversion, sepia, etc.

### `utils/`
- `createGLContext`: Instantiates a WebGL canvas for headless rendering.
- `compileShader`: Takes a shader string and compiles it.
- `createProgram`: Links vertex and fragment shaders into a program.
- `setupTexture`: Uploads image data to a WebGL texture.
- `setupVertexBuffer`: Sets up the vertex data to cover the full screen.

---

## 🚀 Example Usage

```js
import { applyBlueControlsWebGL } from './webgl/applyBlueControlsWebGL.js';

// Assume you have a <canvas> with 2D image context
const ctx = document.querySelector('canvas').getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Apply blue filter
const filtered = applyBlueControlsWebGL(imageData, 0.8, 0.25);

// Put the result back
ctx.putImageData(filtered, 0, 0);
```

---

## 🛠️ Extending the System

To add a new effect:
1. Create a new `shaders/yourEffectFragment.glsl`
2. Copy `applyBlueControlsWebGL.js` to `applyYourEffectWebGL.js`
3. Modify the new fragment shader and update uniforms
4. (Optional) Extract shared logic into reusable helpers

---

## 🧪 Testing

To test individual parts:
- Write unit tests for utilities like `compileShader` and `setupTexture`.
- Use test image buffers and assert that output `ImageData` has expected pixel values.

---

## 💡 Tips

- You can inline the GLSL shaders or use Vite/webpack loaders (`?raw`) for loading `.glsl` as strings.
- Optimize further by caching shader programs if reusing effects.

---

## 🧠 Inspiration

This modular layout is inspired by GPU compute pipelines in game engines, but simplified for 2D image effects in the browser.

---

```

Would you like a quick template shell script to generate new effects based on this structure?