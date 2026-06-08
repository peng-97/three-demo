// 后处理流程
const renderTarget = new THREE.WebGLRenderTarget(width, height)
// 1. 渲染原场景
renderer.setRenderTarget(renderTarget)
renderer.render(scene, camera)

// 2. 应用效果
const effectMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: renderTarget.texture } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
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

// 3. 输出
renderer.setRenderTarget(null)
renderer.render(effectScene, effectCamera)
