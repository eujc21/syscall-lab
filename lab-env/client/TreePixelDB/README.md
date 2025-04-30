# Project: Living Canvas Experience (Solarpunk Edition)

## Vision

This project aims to transcend the static nature of traditional web pages by creating a dynamic, living front-end experience using Vue.js and the HTML5 Canvas, potentially enhanced with WebGL for advanced effects. Inspired by a Solarpunk aesthetic, we envision an interactive landscape composed of layers defined by shape, color, gradient, and texture. These elements aren't just displayed; they possess a life of their own, animated with frequencies and visual rhythms that respond to the user and the flow of information.

The goal is to move beyond boring interfaces, infusing meaning into every interaction – the scroll, the click, the hover. We want to let the "electrons talk," creating a palpable sense of energy and responsiveness. Ultimately, this project strives to weave together visuals, audio cues (`audioUtils.js`), and interactions (`animationEffects.js`, `colorControls.js`) into a cohesive "symphony of reality" – an engaging and memorable user experience.

## Core Concepts & Features

*   **Layered Landscape:** Define visual layers using a flexible data structure specifying:
    *   Shape & Geometry (Rectangles, Circles, Paths, Polygons)
    *   Color & Complex Gradients (manipulated via utilities like `bluening.js`, `brightness.js`)
    *   Texture Mapping (supported by `imageUtils.js` and potentially WebGL shaders)
    *   Drawing Order (Z-index)
*   **Procedural Animation:** Give layers "life" through:
    *   A core `requestAnimationFrame` loop for smooth rendering.
    *   Defined animation types (managed in `animationEffects.js`).
    *   Parameters like `frequency`, `amplitude`, and `phase` to control the animation's character.
    *   Specific visual effects like `applySkyEffect.js`.
*   **Meaningful Interaction:** Make user actions part of the experience:
    *   **Scroll-Driven Dynamics:** Animate or alter the landscape based on scroll position.
    *   **Mouse Responsiveness:** Implement hover and click effects on canvas elements.
*   **The "Vibe":** Focus on the overall sensory feel:
    *   **Dynamic Color Palettes:** Use carefully curated colors and gradients that shift and blend, controlled by `colorControls.js`.
    *   **Audio Integration:** Utilize the Web Audio API via `audioUtils.js` for interaction feedback or ambient soundscapes.
    *   **Performance & Advanced Effects:** Leverage **WebGL** (`src/webgl/`) and **GLSL shaders** (`src/webgl/shaders/`) for optimized rendering and complex visual effects (e.g., `applyBlueControlsWebGL.js`).
*   **Vue.js Integration:** Leverage Vue.js for:
    *   Component-based structure (core logic likely in `SolarpunkCanvas.vue`).
    *   Managing the state and definition of the landscape layers.
    *   Handling user input events and orchestrating updates.

## Tech Stack

*   **Framework:** Vue.js (v3 recommended)
*   **Rendering:**
    *   HTML5 Canvas API (2D Context)
    *   **WebGL** (via custom utilities in `src/webgl/utils/`)
*   **Shading Language:** **GLSL** (OpenGL Shading Language)
*   **Build Tool:** Vite
*   **Language:** JavaScript (ES6+), HTML5, CSS3 (potentially SCSS/SASS)
*   **Utilities:** Custom helpers for animation, color control, audio, images, and WebGL setup.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

1.  **Start the server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local address provided (usually `http://localhost:5173`).

### Building for Production

```bash
npm run build
```
This will create an optimized production build in the `dist` directory.

## Project Structure (Highlights)

```
├── public/
├── src/
│   ├── assets/             # Static assets
|   |-- composables/        # State Management
|   |-- |-- SolarpunkCanvas.js # Animation State handler
│   ├── components/
│   │   ├── icons/          # SVG Icon components
│   │   ├── PixelArt.vue    # Example specific component
│   │   ├── SolarpunkCanvas.vue # PRIMARY component for the living canvas
│   ├── utils/              # Core JavaScript helpers
│   │   ├── animationEffects.js
│   │   ├── applySkyEffect.js
│   │   ├── audioUtils.js
│   │   ├── colorControls.js
│   │   ├── imageUtils.js
│   │   └── ... (bluening, brightness, whitening etc.)
│   ├── webgl/              # WebGL specific logic and shaders
│   │   ├── shaders/        # GLSL Shader files
│   │   │   ├── blueControlFragment.glsl
│   │   │   └── vertexShader.glsl
│   │   ├── utils/          # WebGL helper functions (context, shaders, buffers)
│   │   │   ├── compileShader.js
│   │   │   ├── createGLContext.js
│   │   │   └── ...
│   │   ├── applyBlueControlsWebGL.js # Example WebGL effect implementation
│   │   └── README.md       # WebGL specific documentation
│   ├── App.vue             # Main application component
│   └── main.js             # Vue app initialization
├── .gitignore
├── package.json
├── README.md               # This file
└── vite.config.js
```

## Roadmap & Future Development

*   [ ] Refine WebGL integration for more complex shader effects and performance gains.
*   [ ] Develop sophisticated texture mapping techniques.
*   [ ] Implement advanced animation blending and state transitions.
*   [ ] Expand interactive elements and their connection to displayed information.
*   [ ] Conduct thorough performance profiling across devices.
*   [ ] Investigate accessibility solutions for canvas/WebGL content.



