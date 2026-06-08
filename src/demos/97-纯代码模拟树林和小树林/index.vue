<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模式:</span>
      <select v-model="mode" class="control-select">
        <option value="forest">大树林</option>
        <option value="grove">小树林</option>
      </select>
      <span class="panel-label">数量:</span>
      <input type="range" v-model="treeCount" min="100" max="6000" step="100" class="control-range">
      <span class="panel-value">{{ treeCount }}</span>
      <span class="panel-label">簇数:</span>
      <input type="range" v-model="clusterCount" min="1" max="30" step="1" class="control-range">
      <span class="panel-value">{{ clusterCount }}</span>
      <span class="panel-label">范围:</span>
      <input type="range" v-model="areaSize" min="20" max="200" step="5" class="control-range">
      <span class="panel-value">{{ areaSize }}</span>
      <span class="panel-label">种子:</span>
      <input type="range" v-model="seed" min="1" max="99999" step="1" class="control-range">
      <span class="panel-value">{{ seed }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wind">
        <span>风</span>
      </label>
      <button @click="rebuild" class="control-btn">重生成</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const mode = ref('forest')
const treeCount = ref(1800)
const clusterCount = ref(12)
const areaSize = ref(120)
const seed = ref(20260)
const wind = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let ground, trunkMesh, leafMesh
let trunkGeometry, trunkMaterial, leafGeometry, leafMaterial, groundGeometry, groundMaterial
let phases = []
let bases = []
const dummy = new THREE.Object3D()

function rngFactory(s) {
  let x = (s >>> 0) || 1
  return () => {
    x = (1664525 * x + 1013904223) >>> 0
    return x / 0xffffffff
  }
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  scene?.remove(ground)
  scene?.remove(trunkMesh)
  scene?.remove(leafMesh)
  disposeObject(ground)
  disposeObject(trunkMesh)
  disposeObject(leafMesh)
  groundGeometry?.dispose?.()
  groundMaterial?.dispose?.()
  trunkGeometry?.dispose?.()
  trunkMaterial?.dispose?.()
  leafGeometry?.dispose?.()
  leafMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)
  scene.fog = new THREE.Fog(0x05051a, 25, 220)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(0, 38, 86)
  camera.lookAt(0, 10, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 45, 20)
  scene.add(directionalLight)

  groundGeometry = new THREE.PlaneGeometry(300, 300, 1, 1)
  groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 1, metalness: 0 })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0
  scene.add(ground)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 10, 0)
  controls.maxDistance = 260

  trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, 1, 8, 1)
  trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9, metalness: 0 })
  leafGeometry = new THREE.ConeGeometry(0.7, 1.6, 10, 1)
  leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.75, metalness: 0.05 })

  clock = new THREE.Clock()
  rebuild()
  window.addEventListener('resize', onResize)
}

function rebuild() {
  const rand = rngFactory(seed.value)

  if (trunkMesh) {
    scene.remove(trunkMesh)
    disposeObject(trunkMesh)
    trunkMesh = null
  }
  if (leafMesh) {
    scene.remove(leafMesh)
    disposeObject(leafMesh)
    leafMesh = null
  }

  const n = treeCount.value
  const clusters = Math.max(1, clusterCount.value)
  const size = areaSize.value

  const centers = []
  for (let i = 0; i < clusters; i++) {
    centers.push(new THREE.Vector2((rand() - 0.5) * size, (rand() - 0.5) * size))
  }

  trunkMesh = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, n)
  leafMesh = new THREE.InstancedMesh(leafGeometry, leafMaterial, n)
  trunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  leafMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  phases = new Float32Array(n)
  bases = new Array(n)

  const tmpPos = new THREE.Vector3()
  const tmpRot = new THREE.Euler()
  const tmpScale = new THREE.Vector3()
  const q = new THREE.Quaternion()

  for (let i = 0; i < n; i++) {
    const c = centers[Math.floor(rand() * centers.length)]
    const spread = mode.value === 'grove' ? size * 0.12 : size * 0.22
    const dx = (rand() - 0.5) * spread + (rand() - 0.5) * spread
    const dz = (rand() - 0.5) * spread + (rand() - 0.5) * spread
    const x = c.x + dx
    const z = c.y + dz

    const trunkH = mode.value === 'grove' ? 2.2 + rand() * 2.2 : 2.8 + rand() * 5.2
    const leafH = mode.value === 'grove' ? 2.2 + rand() * 2.2 : 3.2 + rand() * 6.2
    const leafR = mode.value === 'grove' ? 1.0 + rand() * 0.6 : 1.3 + rand() * 1.0

    tmpPos.set(x, trunkH * 0.5, z)
    tmpRot.set(0, rand() * Math.PI * 2, 0)
    tmpScale.set(0.9 + rand() * 0.35, trunkH, 0.9 + rand() * 0.35)
    q.setFromEuler(tmpRot)
    dummy.position.copy(tmpPos)
    dummy.quaternion.copy(q)
    dummy.scale.copy(tmpScale)
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)

    tmpPos.set(x, trunkH + leafH * 0.55, z)
    tmpRot.set(0, rand() * Math.PI * 2, 0)
    tmpScale.set(leafR, leafH, leafR)
    q.setFromEuler(tmpRot)
    dummy.position.copy(tmpPos)
    dummy.quaternion.copy(q)
    dummy.scale.copy(tmpScale)
    dummy.updateMatrix()
    leafMesh.setMatrixAt(i, dummy.matrix)

    phases[i] = rand() * Math.PI * 2
    bases[i] = { x, z, trunkH, leafH, leafR }
  }

  trunkMesh.instanceMatrix.needsUpdate = true
  leafMesh.instanceMatrix.needsUpdate = true

  scene.add(trunkMesh)
  scene.add(leafMesh)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const t = clock.getElapsedTime()

  if (wind.value && leafMesh) {
    const n = treeCount.value
    const q = new THREE.Quaternion()
    for (let i = 0; i < n; i++) {
      const b = bases[i]
      const sway = Math.sin(t * 1.6 + phases[i]) * 0.12 + Math.sin(t * 0.7 + phases[i] * 2.0) * 0.06
      const yaw = Math.sin(t * 0.9 + phases[i] * 0.7) * 0.08
      dummy.position.set(b.x, b.trunkH + b.leafH * 0.55, b.z)
      dummy.scale.set(b.leafR, b.leafH, b.leafR)
      q.setFromEuler(new THREE.Euler(sway, yaw, 0))
      dummy.quaternion.copy(q)
      dummy.updateMatrix()
      leafMesh.setMatrixAt(i, dummy.matrix)
    }
    leafMesh.instanceMatrix.needsUpdate = true
  }

  controls.update()
  renderer.render(scene, camera)
}

watch([mode, treeCount, clusterCount, areaSize, seed], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 56px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
