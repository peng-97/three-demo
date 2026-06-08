// 网格Shader
uniform float uSize;
varying vec2 vUv;
void main() {
  // Grid
  vec2 grid = abs(fract(vUv * uSize - 0.5) - 0.5) / fwidth(vUv * uSize);
  float line = min(grid.x, grid.y);
  float g = 1.0 - min(line, 1.0);
  
  // Checker
  vec2 c = floor(vUv * uSize * 2.0);
  float checker = mod(c.x + c.y, 2.0);
  
  gl_FragColor = vec4(vec3(g, 0.5 + g * 0.3, 1.0), 1.0);
}
