#version 300 es
precision mediump float;
uniform sampler2D u_texture;
uniform float u_blueIntensity;
uniform float u_blueThreshold;
in vec2 v_texCoord;
out vec4 fragColor;
void main() {
  vec4 color = texture(u_texture, v_texCoord);
  float brightness = (color.r + color.g + color.b) / 3.0;
  if (brightness < u_blueThreshold) {
    float blueAmount = (u_blueThreshold - brightness) / u_blueThreshold;
    color.r = max(0.0, color.r - color.r * blueAmount * u_blueIntensity);
    color.g = max(0.0, color.g - color.g * blueAmount * u_blueIntensity);
    color.b = min(1.0, color.b + (1.0 - color.b) * blueAmount * u_blueIntensity);
  }
  fragColor = color;
}
