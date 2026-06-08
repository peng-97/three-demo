// 帧缓冲区
const rt = new THREE.WebGLRenderTarget(width, height)

// 渲染到目标
renderer.setRenderTarget(rt)
renderer.render(scene, camera)

// 后处理
const material = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture } },
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() { gl_FragColor = texture2D(tDiffuse, vUv); }
  `
})

// 渲染到屏幕
renderer.setRenderTarget(null)
renderer.render(effectScene, orthoCamera)
