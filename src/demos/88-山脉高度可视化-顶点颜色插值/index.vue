<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">振幅:</span>
      <input type="range" v-model="amplitude" min="0" max="10" step="0.1" class="control-range">
      <span class="panel-value">{{ amplitude.toFixed(1) }}</span>
      <span class="panel-label">频率:</span>
      <input type="range" v-model="frequency" min="0.05" max="0.6" step="0.01" class="control-range">
      <span class="panel-value">{{ frequency.toFixed(2) }}</span>
      <span class="panel-label">雪线:</span>
      <input type="range" v-model="snowLine" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ snowLine.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="playing">
        <span>动态</span>
      </label>
      <span class="panel-label">高度:</span>
      <span class="panel-value">{{ minH.toFixed(1) }}~{{ maxH.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const amplitude = ref(6)
const frequency = ref(0.18)
const snowLine = ref(0.78)
const wireframe = ref(false)
const playing = ref(true)
const minH = ref(0)
const maxH = ref(0)

let scene, camera, renderer, animationId, controls
let terrain, terrainGeometry, terrainMaterial, clock
const deepColor = new THREE.Color('#0b1026')
const grassColor = new THREE.Color('#2ecc71')
const rockColor = new THREE.Color('#8d6e63')
const snowColor = new THREE.Color('#f5f6fa')

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function heightFn(x, z, t) {
  const f = frequency.value
  const a = amplitude.value
  const h1 = Math.sin((x * f + t * 0.8) * 1.2) * 0.55 + Math.cos((z * f - t * 0.65) * 1.05) * 0.45
  const h2 = Math.sin((x * f * 2.1 + t * 1.2) * 1.1 + z * f * 1.7) * 0.25
  const h3 = Math.cos((z * f * 3.3 - t * 1.6) * 1.05 + x * f * 1.2) * 0.18
  return (h1 + h2 + h3) * a
}

function colorFromHeight(h, hMin, hMax) {
  const t = THREE.MathUtils.clamp((h - hMin) / Math.max(0.0001, hMax - hMin), 0, 1)
  const snow = snowLine.value

  if (t < 0.25) return deepColor.clone().lerp(grassColor, t / 0.25)
  if (t < snow) return grassColor.clone().lerp(rockColor, (t - 0.25) / Math.max(0.0001, snow - 0.25))
  return rockColor.clone().lerp(snowColor, (t - snow) / Math.max(0.0001, 1 - snow))
}

function updateTerrain(time) {
  const pos = terrainGeometry.attributes.position
  let hMin = Infinity
  let hMax = -Infinity

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = heightFn(x, z, time)
    pos.setY(i, h)
    if (h < hMin) hMin = h
    if (h > hMax) hMax = h
  }

  minH.value = hMin
  maxH.value = hMax

  const colors = terrainGeometry.attributes.color
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i)
    const c = colorFromHeight(h, hMin, hMax)
    colors.setXYZ(i, c.r, c.g, c.b)
  }

  pos.needsUpdate = true
  colors.needsUpdate = true
  terrainGeometry.computeVertexNormals()
  terrainGeometry.attributes.normal.needsUpdate = true
  terrainMaterial.wireframe = wireframe.value
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  terrainGeometry?.dispose?.()
  terrainMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)
  scene.fog = new THREE.Fog(0x05051a, 18, 60)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 14, 24)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 15)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(40, 40, 0x222244, 0x111122)
  gridHelper.position.y = -0.1
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  controls.maxDistance = 80

  terrainGeometry = new THREE.PlaneGeometry(40, 40, 220, 220)
  terrainGeometry.rotateX(-Math.PI / 2)
  const colorAttr = new Float32Array(terrainGeometry.attributes.position.count * 3)
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3))

  terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    wireframe: wireframe.value
  })
  terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  scene.add(terrain)

  clock = new THREE.Clock()
  updateTerrain(0)
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const t = clock.getElapsedTime()
  if (playing.value) {
    updateTerrain(t)
  } else {
    updateTerrain(t - delta)
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([amplitude, frequency, snowLine, wireframe], () => updateTerrain(clock?.getElapsedTime?.() ?? 0))
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
.panel-value { color: white; font-weight: 700; min-width: 86px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
