<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="useMerge">
        <span>合并几何体</span>
      </label>
      <span class="panel-label">数量:</span>
      <input type="range" v-model="count" min="10" max="400" step="10" class="control-range">
      <span class="panel-value">{{ count }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
      <button @click="regenerate" class="control-btn">重生成</button>
      <span class="panel-label">DrawCalls:</span>
      <span class="panel-value">{{ drawCalls }}</span>
      <span class="panel-label">三角形:</span>
      <span class="panel-value">{{ triangles }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const container = ref(null)
const useMerge = ref(true)
const count = ref(150)
const wireframe = ref(false)
const spinning = ref(true)
const drawCalls = ref(1)
const triangles = ref(0)

let scene, camera, renderer, animationId, controls
let mergedMesh, separateGroup, clock
let seed = 12345
let baseGeometry

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function rngFactory(s) {
  let x = s >>> 0
  return () => {
    x = (1664525 * x + 1013904223) >>> 0
    return x / 0xffffffff
  }
}

function disposeObject(obj) {
  if (!obj) return
  obj.traverse?.((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    }
  })
}

function buildItems(n) {
  const rand = rngFactory(seed)
  const items = []
  for (let i = 0; i < n; i++) {
    const px = (rand() - 0.5) * 18
    const py = rand() * 6 + 0.6
    const pz = (rand() - 0.5) * 18
    const sx = 0.35 + rand() * 1.1
    const sy = 0.35 + rand() * 1.1
    const sz = 0.35 + rand() * 1.1
    const rx = rand() * Math.PI
    const ry = rand() * Math.PI
    const rz = rand() * Math.PI

    const color = new THREE.Color().setHSL(rand(), 0.8, 0.6)
    items.push({
      position: new THREE.Vector3(px, py, pz),
      rotation: new THREE.Euler(rx, ry, rz),
      scale: new THREE.Vector3(sx, sy, sz),
      color
    })
  }
  return items
}

function rebuild() {
  if (mergedMesh) {
    scene.remove(mergedMesh)
    mergedMesh.geometry?.dispose?.()
    mergedMesh.material?.dispose?.()
    mergedMesh = null
  }
  if (separateGroup) {
    scene.remove(separateGroup)
    disposeObject(separateGroup)
    separateGroup = null
  }

  const items = buildItems(count.value)

  if (useMerge.value) {
    const geometries = []
    for (const it of items) {
      const g = baseGeometry.clone()
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion().setFromEuler(it.rotation)
      m.compose(it.position, q, it.scale)
      g.applyMatrix4(m)

      const c = it.color
      const colorAttr = new Float32Array(g.attributes.position.count * 3)
      for (let i = 0; i < g.attributes.position.count; i++) {
        const i3 = i * 3
        colorAttr[i3 + 0] = c.r
        colorAttr[i3 + 1] = c.g
        colorAttr[i3 + 2] = c.b
      }
      g.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3))
      geometries.push(g)
    }

    const merged = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    merged.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.55,
      metalness: 0.15,
      wireframe: wireframe.value
    })
    mergedMesh = new THREE.Mesh(merged, mat)
    scene.add(mergedMesh)

    drawCalls.value = 1
    triangles.value = Math.floor(merged.attributes.position.count / 3)
  } else {
    separateGroup = new THREE.Group()
    const geom = baseGeometry
    for (const it of items) {
      const mat = new THREE.MeshStandardMaterial({
        color: it.color,
        roughness: 0.55,
        metalness: 0.15,
        wireframe: wireframe.value
      })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.copy(it.position)
      mesh.rotation.copy(it.rotation)
      mesh.scale.copy(it.scale)
      separateGroup.add(mesh)
    }
    scene.add(separateGroup)

    drawCalls.value = count.value
    triangles.value = Math.floor(baseGeometry.attributes.position.count / 3) * count.value
  }
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  mergedMesh?.geometry?.dispose?.()
  mergedMesh?.material?.dispose?.()
  disposeObject(separateGroup)
  baseGeometry?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 16, 26)
  camera.lookAt(0, 6, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(60, 60)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(60, 30, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 6, 0)

  baseGeometry = new THREE.BoxGeometry(1, 1, 1)
  clock = new THREE.Clock()
  rebuild()
  window.addEventListener('resize', onResize)
}

function regenerate() {
  seed = (seed + 99991) % 1000000
  rebuild()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    if (mergedMesh) mergedMesh.rotation.y += delta * 0.35
    if (separateGroup) separateGroup.rotation.y += delta * 0.35
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([useMerge, count, wireframe], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 60px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
