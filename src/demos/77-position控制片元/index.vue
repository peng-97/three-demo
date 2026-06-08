<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模式:</span>
      <select v-model="mode" class="control-select">
        <option value="height">高度渐变</option>
        <option value="radial">径向渐变</option>
        <option value="stripes">条纹流动</option>
      </select>
      <span class="panel-label">频率:</span>
      <input type="range" v-model="freq" min="0.5" max="10" step="0.1" class="control-range">
      <span class="panel-value">{{ freq.toFixed(1) }}</span>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="5" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">配色:</span>
      <select v-model="palette" class="control-select">
        <option value="cool">冷色</option>
        <option value="warm">暖色</option>
        <option value="neon">霓虹</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const mode = ref('height')
const freq = ref(3)
const speed = ref(1.2)
const palette = ref('cool')
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, shaderMaterial, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function getPaletteColors() {
  if (palette.value === 'warm') return ['#ff4d6d', '#ffd166']
  if (palette.value === 'neon') return ['#00ffff', '#6c5ce7']
  return ['#4ecdc4', '#667eea']
}

function applyUniforms() {
  if (!shaderMaterial) return
  const [a, b] = getPaletteColors()
  shaderMaterial.uniforms.uMode.value = mode.value === 'height' ? 0 : mode.value === 'radial' ? 1 : 2
  shaderMaterial.uniforms.uFreq.value = freq.value
  shaderMaterial.uniforms.uSpeed.value = speed.value
  shaderMaterial.uniforms.uColorA.value.set(a)
  shaderMaterial.uniforms.uColorB.value.set(b)
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
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 4, 10)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const geometry = new THREE.TorusKnotGeometry(1.4, 0.5, 220, 28)
  geometry.computeBoundingBox()
  const minY = geometry.boundingBox.min.y
  const maxY = geometry.boundingBox.max.y

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMode: { value: 0 },
      uFreq: { value: freq.value },
      uSpeed: { value: speed.value },
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uMinY: { value: minY },
      uMaxY: { value: maxY }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      void main() {
        vPosition = position;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMode;
      uniform float uFreq;
      uniform float uSpeed;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uMinY;
      uniform float uMaxY;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }

      void main() {
        float m = uMode;
        float h = saturate((vPosition.y - uMinY) / max(0.0001, (uMaxY - uMinY)));
        float r = length(vPosition.xz) / 3.0;
        float stripes = 0.5 + 0.5 * sin((vWorldPosition.y + uTime * uSpeed) * uFreq);

        float t = h;
        if (m > 0.5 && m < 1.5) t = saturate(r);
        if (m >= 1.5) t = stripes;

        vec3 color = mix(uColorA, uColorB, t);
        float edge = 0.75 + 0.25 * sin((vWorldPosition.x + vWorldPosition.z) * 2.0 + uTime);
        gl_FragColor = vec4(color * edge, 1.0);
      }
    `
  })
  applyUniforms()

  mesh = new THREE.Mesh(geometry, shaderMaterial)
  mesh.position.y = 2
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  shaderMaterial.uniforms.uTime.value = clock.getElapsedTime()

  if (spinning.value) {
    mesh.rotation.y += delta * 0.6
    mesh.rotation.x += delta * 0.25
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([mode, freq, speed, palette], applyUniforms)
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
.panel-value { color: white; font-weight: 700; min-width: 50px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
