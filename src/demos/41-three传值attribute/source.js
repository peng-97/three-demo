// 创建自定义attribute
const geometry = new THREE.SphereGeometry(3, 64, 64)
const count = geometry.attributes.position.count
const colors = new Float32Array(count * 3)

for (let i = 0; i < count; i++) {
  colors[i * 3] = Math.random()
  colors[i * 3 + 1] = Math.random()
  colors[i * 3 + 2] = Math.random()
}

geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

// ShaderMaterial使用attribute
const material = new THREE.ShaderMaterial({
  vertexShader: `
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  vertexColors: true
})
