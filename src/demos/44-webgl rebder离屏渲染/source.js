// 创建RenderTarget
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat
})

// 离屏渲染到纹理
renderer.setRenderTarget(renderTarget)
renderer.render(scene, camera)

// 后处理效果
const effectMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: renderTarget.texture } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(gray, gray, gray, 1.0);
    }
  `
})
