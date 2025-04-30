/**
 * Applies white intensity and threshold controls to image data.
 *
 * @param {ImageData} imageData - The ImageData object to modify.
 * @param {number} [whiteIntensity=1.0] - The intensity of the whitening effect (0.0 to 1.0).
 * @param {number} [whiteThreshold=0.5] - The brightness threshold above which whitening is applied (0.0 to 1.0).
 * @returns {ImageData} The modified ImageData object.
 */
export function applyWhiteControls(imageData, whiteIntensity = 1.0, whiteThreshold = 0.5) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness
        const brightness = (r + g + b) / 3 / 255;

        if (brightness > whiteThreshold) {
            // Calculate how much to whiten based on brightness
            const whitenAmount = (brightness - whiteThreshold) / (1 - whiteThreshold);

            // Apply whitening effect
            data[i] = Math.min(255, r + (255 - r) * whitenAmount * whiteIntensity);
            data[i + 1] = Math.min(255, g + (255 - g) * whitenAmount * whiteIntensity);
            data[i + 2] = Math.min(255, b + (255 - b) * whitenAmount * whiteIntensity);
        }
    }

    return imageData;
}

/**
 * Applies blue intensity and threshold controls to image data.
 *
 * @param {ImageData} imageData - The ImageData object to modify.
 * @param {number} [blueIntensity=1.0] - The intensity of the blue tint effect (0.0 to 1.0).
 * @param {number} [blueThreshold=0.3] - The brightness threshold below which blue tint is applied (0.0 to 1.0).
 * @returns {ImageData} The modified ImageData object.
 */
export function applyBlueControls(imageData, blueIntensity = 1.0, blueThreshold = 0.3) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness
        const brightness = (r + g + b) / 3 / 255;

        if (brightness < blueThreshold) {
            // Calculate how much to blue based on darkness
            const blueAmount = (blueThreshold - brightness) / blueThreshold;

            // Apply blue tint
            data[i] = Math.max(0, r - r * blueAmount * blueIntensity);
            data[i + 1] = Math.max(0, g - g * blueAmount * blueIntensity);
            data[i + 2] = Math.min(255, b + (255 - b) * blueAmount * blueIntensity);
        }
    }

    return imageData;
}

// utils/colorControlsWebGL.js

/**
 * Applies blue intensity and threshold controls to image data using WebGL.
 *
 * @param {ImageData} imageData - The ImageData object to modify.
 * @param {number} [blueIntensity=1.0] - The intensity of the blue tint effect (0.0 to 1.0).
 * @param {number} [blueThreshold=0.3] - The brightness threshold below which blue tint is applied (0.0 to 1.0).
 * @returns {ImageData} The modified ImageData object.
 */
export function applyBlueControlsWebGL(imageData, blueIntensity = 1.0, blueThreshold = 0.3) {
    const width = imageData.width;
    const height = imageData.height;

    // 1. WebGL Context Setup
    const canvas = document.createElement('canvas'); // Offscreen canvas
    canvas.width = width;
    canvas.height = height;
    let gl = canvas.getContext('webgl2'); // Request WebGL 2.0 context
    if (!gl) {
        console.error("WebGL 2.0 context not supported, falling back to WebGL 1.0");
        const glFallback = canvas.getContext('webgl');
        if (!glFallback) {
            console.error("WebGL context could not be initialized.");
            return imageData; // Return original ImageData if WebGL fails
        }
        gl = glFallback; // Use WebGL 1.0 if 2.0 fails
    }

    // 2. Create Texture from ImageData
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 3. Vertex Shader Source
    const vertexShaderSource = `#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_position * 0.5 + 0.5; // Convert from clip space (-1 to 1) to texture space (0 to 1)
        }
    `;

    // 4. Fragment Shader Source (Blue Controls Logic in GLSL)
    const fragmentShaderSource = `#version 300 es
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_blueIntensity;
        uniform float u_blueThreshold;
        in vec2 v_texCoord;
        out vec4 fragColor;
        void main() {
            vec4 color = texture(u_texture, v_texCoord);
            float r = color.r;
            float g = color.g;
            float b = color.b;

            // Calculate brightness (same as JS version, but in GLSL)
            float brightness = (r + g + b) / 3.0;

            if (brightness < u_blueThreshold) {
                // Calculate how much to blue based on darkness
                float blueAmount = (u_blueThreshold - brightness) / u_blueThreshold;

                // Apply blue tint (same logic as JS, but in GLSL)
                color.r = max(0.0, r - r * blueAmount * u_blueIntensity);
                color.g = max(0.0, g - g * blueAmount * u_blueIntensity);
                color.b = min(1.0, b + (1.0 - b) * blueAmount * u_blueIntensity); // Note: clamp to 1.0 in shader, as colors are normalized

            }
            fragColor = color;
        }
    `;

    // 5. Create Shader Program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return imageData; // Return original ImageData on shader error
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return imageData; // Return original ImageData on shader error
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return imageData; // Return original ImageData on program error
    }

    gl.deleteShader(vertexShader); // Clean up shaders after linking
    gl.deleteShader(fragmentShader);

    // 6. Set up Vertex Buffer and Attributes
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const vertices = [-1, 1, -1, -1, 1, 1, 1, -1]; // Full screen quad vertices
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 7. Set Uniforms
    gl.useProgram(program);
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(textureLocation, 0); // Texture unit 0

    const blueIntensityLocation = gl.getUniformLocation(program, 'u_blueIntensity');
    gl.uniform1f(blueIntensityLocation, blueIntensity);

    const blueThresholdLocation = gl.getUniformLocation(program, 'u_blueThreshold');
    gl.uniform1f(blueThresholdLocation, blueThreshold);

    // 8. Render to Canvas
    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 9. Read Pixels back to ImageData
    const pixels = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    gl.deleteTexture(texture); // Clean up texture
    gl.deleteProgram(program); // Clean up program
    gl.deleteBuffer(vertexBuffer); // Clean up vertex buffer

    return new ImageData(pixels, width, height);
}
