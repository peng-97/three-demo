<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">混合:</span>
      <select v-model="blendMode" class="control-select">
        <option value="normal">Normal</option>
        <option value="add">Add</option>
        <option value="multiply">Multiply</option>
        <option value="screen">Screen</option>
        <option value="subtract">Subtract</option>
      </select>
      <span class="panel-label">权重:</span>
      <input type="range" v-model="mixFactor" min="0" max="1" step="0.01" class="control-range" :disabled="autoMix">
      <span class="panel-value">{{ mixFactor.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="autoMix">
        <span>自动</span>
      </label>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="mixSpeed" min="0" max="5" step="0.1" class="control-range" :disabled="!autoMix">
      <span class="panel-value">{{ mixSpeed.toFixed(1) }}</span>
      <button @click="toggleWireframe" class="control-btn">线框</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const blendMode = ref('normal')
const mixFactor = ref(0.5)
const autoMix = ref(true)
const mixSpeed = ref(1.2)

let scene, camera, renderer, mesh, animationId, controls
let shaderMaterial, clock
let texA, texB

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createTextureA() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const size = 64
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1a2e' : '#667eea'
      ctx.fillRect(x * size, y * size, size, size)
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 88px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('A', 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.5, 1.5)
  texture.anisotropy = 8
  return texture
}

function createTextureB() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 512, 512)
  grad.addColorStop(0, '#ff4d6d')
  grad.addColorStop(0.6, '#ffd166')
  grad.addColorStop(1, '#4ecdc4')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 10 + Math.random() * 60
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.font = 'bold 88px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('B', 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.2, 1.2)
  texture.anisotropy = 8
  return texture
}

function applyBlendMode() {
  if (!shaderMaterial) return
  const m = blendMode.value
  shaderMaterial.uniforms.uMode.value =
    m === 'add' ? 1 : m === 'multiply' ? 2 : m === 'screen' ? 3 : m === 'subtract' ? 4 : 0
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  mesh?.geometry?.dispose?.()
  mesh?.material?.dispose?.()
  texA?.dispose?.()
  texB?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 1.5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1.5, 0)

  texA = createTextureA()
  texB = createTextureB()

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: texA },
      tB: { value: texB },
      uMix: { value: mixFactor.value },
      uMode: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tA;
      uniform sampler2D tB;
      uniform float uMix;
      uniform float uMode;
      varying vec2 vUv;

      vec3 blendAdd(vec3 a, vec3 b) { return min(a + b, vec3(1.0)); }
      vec3 blendMultiply(vec3 a, vec3 b) { return a * b; }
      vec3 blendScreen(vec3 a, vec3 b) { return vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b); }
      vec3 blendSubtract(vec3 a, vec3 b) { return max(a - b, vec3(0.0)); }

      void main() {
        vec3 a = texture2D(tA, vUv).rgb;
        vec3 b = texture2D(tB, vUv).rgb;
        vec3 blended = b;

        if (uMode > 0.5 && uMode < 1.5) blended = blendAdd(a, b);
        else if (uMode > 1.5 && uMode < 2.5) blended = blendMultiply(a, b);
        else if (uMode > 2.5 && uMode < 3.5) blended = blendScreen(a, b);
        else if (uMode > 3.5) blended = blendSubtract(a, b);

        vec3 color = mix(a, blended, uMix);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  })
  applyBlendMode()

  const geometry = new THREE.BoxGeometry(3, 3, 3)
  mesh = new THREE.Mesh(geometry, shaderMaterial)
  mesh.position.y = 1.5
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function toggleWireframe() {
  mesh.material.wireframe = !mesh.material.wireframe
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const t = clock.getElapsedTime()
  mesh.rotation.y += delta * 0.4
  mesh.rotation.x += delta * 0.18

  if (autoMix.value) {
    shaderMaterial.uniforms.uMix.value = 0.5 + Math.sin(t * mixSpeed.value) * 0.5
  } else {
    shaderMaterial.uniforms.uMix.value = mixFactor.value
  }

  controls.update()
  renderer.render(scene, camera)
}

watch(blendMode, applyBlendMode)
watch(mixFactor, () => {
  if (!autoMix.value && shaderMaterial) shaderMaterial.uniforms.uMix.value = mixFactor.value
})
</script>

<style scoped>
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.demo-container {
  flex: 1;
}
.control-panel {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}
.control-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
