// 完整的着色器程序
const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 5.0 + uTime) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      float color = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
      gl_FragColor = vec4(color, 0.5, 1.0, 1.0);
    }
  `,
  uniforms: {
    uTime: { value: 0 }
  }
})

// 更新uniform
function animate() {
  material.uniforms.uTime.value = performance.now() * 0.001
  renderer.render(scene, camera)
}
