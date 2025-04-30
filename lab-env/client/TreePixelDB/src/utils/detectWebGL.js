// This function detects if the browser supports WebGL
// and if the user has enabled it.
// It also checks if the user has a compatible GPU.
// If WebGL is not supported, it returns false.
export function detectWebGL() {
  // Check if WebGL is supported
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    return false;
  }

  // Check for WebGL2 support
  const isWebGL2 = !!canvas.getContext('webgl2');

  // Check for GPU support
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

  return {
    supported: true,
    webglVersion: isWebGL2 ? 'WebGL2' : 'WebGL',
    vendor,
    renderer,
  };
}
