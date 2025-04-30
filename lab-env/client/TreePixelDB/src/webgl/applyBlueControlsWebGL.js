import vertexShaderSource from './shaders/vertexShader.glsl?raw';
import fragmentShaderSource from './shaders/blueControlFragment.glsl?raw';
import { createGLContext } from './utils/createGLContext.js';
import { createProgram } from './utils/createProgram.js';
import { setupTexture } from './utils/setupTexture.js';
import { setupVertexBuffer } from './utils/setupVertexBuffer.js';

/**
 * Applies blue intensity and threshold controls to an image using WebGL.
 *
 * @param {ImageData} imageData - The image data to modify.
 * @param {number} [blueIntensity=1.0] - The intensity of the blue tint effect (0.0 to 1.0).
 * @param {number} [blueThreshold=0.3] - The brightness threshold below which blue tint is applied (0.0 to 1.0).
**/
export function applyBlueControlsWebGL(imageData, blueIntensity = 1.0, blueThreshold = 0.3) {
  const { gl, canvas } = createGLContext(imageData.width, imageData.height);

  setupTexture(gl, imageData);
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  setupVertexBuffer(gl, program);

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_blueIntensity'), blueIntensity);
  gl.uniform1f(gl.getUniformLocation(program, 'u_blueThreshold'), blueThreshold);

  gl.viewport(0, 0, imageData.width, imageData.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const pixels = new Uint8ClampedArray(imageData.width * imageData.height * 4);
  gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  return new ImageData(pixels, imageData.width, imageData.height);
}
