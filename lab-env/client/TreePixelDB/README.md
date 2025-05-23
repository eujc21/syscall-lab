# Project: Living Canvas Experience (Solarpunk Edition)

## Vision

This project aims to transcend the static nature of traditional web pages by creating a dynamic, living front-end experience using Vue.js and the HTML5 Canvas, potentially enhanced with WebGL for advanced effects. Inspired by a Solarpunk aesthetic, we envision an interactive landscape composed of layers defined by shape, color, gradient, and texture. These elements are not merely displayed; they are animated with frequencies and visual rhythms that respond to user interaction and data flow.

The goal is to move beyond uninspired interfaces, infusing meaning into every scroll, click, and hover, creating a palpable sense of energy and responsiveness. Ultimately, this project strives to weave visuals, audio cues (managed by `audioUtils.js`), and interactions (orchestrated by `animationEffects.js` and `colorControls.js`) into a cohesive "symphony of reality"—an engaging and memorable user experience.

## Core Concepts & Features

*   **Layered Landscape:** Defines visual layers using a flexible data structure specifying:
    *   Shape and Geometry (e.g., Rectangles, Circles, Paths, Polygons)
    *   Color and Complex Gradients (manipulated via utilities like `bluening.js`, `brightness.js`)
    *   Texture Mapping (supported by `imageUtils.js` and potentially WebGL shaders)
    *   Drawing Order (Z-index)
*   **Procedural Animation:** Animates layers through:
    *   A core `requestAnimationFrame` loop for smooth rendering
    *   Defined animation types (managed in `animationEffects.js`)
    *   Parameters like `frequency`, `amplitude`, and `phase` to control animation character
    *   Specific visual effects (e.g., `applySkyEffect.js`)
*   **Meaningful Interaction:** Integrates user actions into the experience:
    *   **Scroll-Driven Dynamics:** Animating or altering the landscape based on scroll position
    *   **Mouse Responsiveness:** Implementing hover and click effects on canvas elements
*   **The "Vibe":** Focuses on the overall sensory feel:
    *   **Dynamic Color Palettes:** Utilizing curated colors and gradients that shift and blend, controlled by `colorControls.js`
    *   **Audio Integration:** Employing the Web Audio API via `audioUtils.js` for interaction feedback or ambient soundscapes
    *   **Performance & Advanced Effects:** Leveraging **WebGL** (from `src/webgl/`) and **GLSL shaders** (from `src/webgl/shaders/`) for optimized rendering and complex visual effects (e.g., `applyBlueControlsWebGL.js`)
*   **Vue.js Integration:** Leverages Vue.js for:
    *   Component-based structure, with core logic likely in `SolarpunkCanvas.vue`
    *   Managing the state and definition of landscape layers
    *   Handling user input events and orchestrating updates

## Tech Stack

*   **Framework:** Vue.js (v3 recommended)
*   **Rendering:**
    *   HTML5 Canvas API (2D Context)
    *   **WebGL** (via custom utilities in `src/webgl/utils/`)
*   **Shading Language:** **GLSL** (OpenGL Shading Language)
*   **Build Tool:** Vite
*   **Languages:** JavaScript (ES6+), HTML5, CSS3 (potentially SCSS/SASS)
*   **Utilities:** Custom JavaScript modules for animation, color control, audio, image manipulation, and WebGL setup.

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
This command creates an optimized production build in the `dist` directory.

## Project Structure (Highlights)

```
├── public/
├── src/
│   ├── assets/                   # Static assets
│   ├── composables/              # State Management (Vue Composables)
│   │   └── useSolarpunkCanvas.js # Animation State handler
│   ├── components/               # Vue components
│   │   ├── AnimationSelectionMenu.vue # UI for selecting animations
│   │   ├── icons/                # SVG Icon components
│   │   ├── PixelArt.vue          # Example specific component
│   │   └── SolarpunkCanvas.vue   # PRIMARY component for the living canvas
│   ├── utils/                    # Core JavaScript helper modules
│   │   ├── animationEffects.js
│   │   ├── applySkyEffect.js
│   │   ├── audioUtils.js
│   │   ├── colorControls.js
│   │   ├── imageUtils.js
│   │   └── ... (bluening, brightness, whitening etc.)
│   ├── webgl/                    # WebGL specific logic and shaders
│   │   ├── shaders/              # GLSL Shader files
│   │   │   ├── blueControlFragment.glsl
│   │   │   └── vertexShader.glsl
│   │   ├── utils/                # WebGL helper functions (context, shaders, buffers)
│   │   │   ├── compileShader.js
│   │   │   ├── createGLContext.js
│   │   │   └── ...
│   │   ├── applyBlueControlsWebGL.js # Example WebGL effect implementation
│   │   └── README.md             # WebGL specific documentation
│   ├── App.vue                   # Main application component
│   └── main.js                   # Vue app initialization
├── .gitignore
├── package.json
├── README.md                     # This file
└── vite.config.js
```

## Roadmap & Future Development

*   [ ] Refine WebGL integration for more complex shader effects and performance gains.
*   [ ] Develop sophisticated texture mapping techniques.
*   [ ] Implement advanced animation blending and state transitions.
*   [ ] Expand interactive elements and their connection to displayed information.
*   [ ] Conduct thorough performance profiling across various devices.
*   [ ] Investigate accessibility solutions for canvas and WebGL content.

## Contributing

We welcome contributions to enhance the Living Canvas Experience! If you'd like to contribute, please follow these general guidelines:

1.  **Fork the repository** on GitHub.
2.  **Create a new branch** for your feature or bug fix:
    *   For features: `git checkout -b feature/your-feature-name`
    *   For bug fixes: `git checkout -b bugfix/issue-identifier`
3.  **Make your changes** and ensure your code follows the project's existing style and conventions.
4.  **Commit your changes** with clear and descriptive commit messages.
5.  **Push your branch** to your fork on GitHub.
6.  **Create a Pull Request** against the `main` branch of the main repository. Please provide a clear description of your changes in the Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```
