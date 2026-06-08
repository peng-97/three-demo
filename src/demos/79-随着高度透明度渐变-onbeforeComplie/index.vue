<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="changeShape" class="control-btn">切换形状</button>
      <span class="panel-label">渐变:</span>
      <select v-model="space" class="control-select">
        <option value="local">模型坐标</option>
        <option value="world">世界坐标</option>
      </select>
      <span class="panel-label">起点Y:</span>
      <input type="range" v-model="fadeStart" min="-3" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ fadeStart.toFixed(1) }}</span>
      <span class="panel-label">终点Y:</span>
      <input type="range" v-model="fadeEnd" min="-3" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ fadeEnd.toFixed(1) }}</span>
      <span class="panel-label">底部α:</span>
      <input type="range" v-model="minAlpha" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ minAlpha.toFixed(2) }}</span>
      <span class="panel-label">顶部α:</span>
      <input type="range" v-model="maxAlpha" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ maxAlpha.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="invert">
        <span>反向</span>
      </label>
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
const space = ref('world')
const fadeStart = ref(-1.0)
const fadeEnd = ref(2.5)
const minAlpha = ref(0.05)
const maxAlpha = ref(0.95)
const invert = ref(false)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, currentShapeIndex = 0, currentColorIndex = 0
let material, clock

const shapes = [
  () => new THREE.BoxGeometry(2, 2, 2, 1, 1, 1),
  () => new THREE.SphereGeometry(1.3, 48, 48),
  () => new THREE.ConeGeometry(1.2, 2.8, 48, 1),
  () => new THREE.TorusGeometry(1.3, 0.45, 24, 160),
  () => new THREE.TorusKnotGeometry(1.1, 0.35, 180, 24)
]

const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function applyUniforms() {
  if (!material?.userData?.shader) return
  const shader = material.userData.shader
  shader.uniforms.uFadeStart.value = Math.min(fadeStart.value, fadeEnd.value - 0.001)
  shader.uniforms.uFadeEnd.value = fadeEnd.value
  shader.uniforms.uMinAlpha.value = minAlpha.value
  shader.uniforms.uMaxAlpha.value = maxAlpha.value
  shader.uniforms.uInvert.value = invert.value ? 1 : 0
  shader.uniforms.uUseWorld.value = space.value === 'world' ? 1 : 0
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
  material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 3.5, 10)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const geometry = shapes[currentShapeIndex]()
  material = new THREE.MeshStandardMaterial({ 
    color: colors[currentColorIndex],
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    depthWrite: false
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFadeStart = { value: fadeStart.value }
    shader.uniforms.uFadeEnd = { value: fadeEnd.value }
    shader.uniforms.uMinAlpha = { value: minAlpha.value }
    shader.uniforms.uMaxAlpha = { value: maxAlpha.value }
    shader.uniforms.uInvert = { value: invert.value ? 1 : 0 }
    shader.uniforms.uUseWorld = { value: space.value === 'world' ? 1 : 0 }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying float vFadeY;
      varying float vWorldY;
      `
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vFadeY = position.y;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldY = wp.y;
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying float vFadeY;
      varying float vWorldY;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      uniform float uMinAlpha;
      uniform float uMaxAlpha;
      uniform float uInvert;
      uniform float uUseWorld;
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `
      vec4 diffuseColor = vec4( diffuse, opacity );
      float y = mix(vFadeY, vWorldY, step(0.5, uUseWorld));
      float a = smoothstep(uFadeStart, uFadeEnd, y);
      a = mix(a, 1.0 - a, step(0.5, uInvert));
      float alpha = mix(uMinAlpha, uMaxAlpha, a);
      diffuseColor.a *= alpha;
      `
    )

    material.userData.shader = shader
    applyUniforms()
  }

  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 2
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function changeShape() {
  currentShapeIndex = (currentShapeIndex + 1) % shapes.length
  const newGeometry = shapes[currentShapeIndex]()
  mesh.geometry.dispose()
  mesh.geometry = newGeometry
  mesh.geometry.computeBoundingBox()
}

function changeColor() {
  currentColorIndex = (currentColorIndex + 1) % colors.length
  material.color.setHex(colors[currentColorIndex])
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  applyUniforms()

  if (spinning.value) {
    mesh.rotation.y += delta * 0.6
    mesh.rotation.x += delta * 0.25
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([space, fadeStart, fadeEnd, minAlpha, maxAlpha, invert], applyUniforms)
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
