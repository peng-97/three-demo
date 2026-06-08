// 定义uniform
const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float uScale;
    uniform vec3 uColor;
    uniform float uTime;
    
    void main() {
      vec3 pos = position * uScale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor, 1.0);
    }
  `,
  uniforms: {
    uColor: { value: new THREE.Vector3(1, 0, 0) },
    uScale: { value: 1.0 },
    uTime: { value: 0 }
  }
})

// 实时更新uniform
mesh.material.uniforms.uColor.value.set(0, 1, 0)
mesh.material.uniforms.uScale.value = 2
mesh.material.uniforms.uTime.value = performance.now()
