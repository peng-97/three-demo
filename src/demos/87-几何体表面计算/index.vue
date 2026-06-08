<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">几何体:</span>
      <select v-model="shape" class="control-select">
        <option value="box">Box</option>
        <option value="sphere">Sphere</option>
        <option value="cone">Cone</option>
        <option value="torus">Torus</option>
        <option value="knot">TorusKnot</option>
      </select>
      <span class="panel-label">细分:</span>
      <input type="range" v-model="detail" min="6" max="96" step="2" class="control-range">
      <span class="panel-value">{{ detail }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
      <span class="panel-label">三角形:</span>
      <span class="panel-value">{{ triCount }}</span>
      <span class="panel-label">表面积:</span>
      <span class="panel-value">{{ area.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const shape = ref('sphere')
const detail = ref(32)
const spinning = ref(true)
const triCount = ref(0)
const area = ref(0)

let scene, camera, renderer, animationId, controls
let mesh, material, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function surfaceArea(geometry) {
  const pos = geometry.attributes.position
  const idx = geometry.index

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()

  let total = 0

  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      a.fromBufferAttribute(pos, idx.getX(i))
      b.fromBufferAttribute(pos, idx.getX(i + 1))
      c.fromBufferAttribute(pos, idx.getX(i + 2))
      ab.subVectors(b, a)
      ac.subVectors(c, a)
      total += ab.cross(ac).length() * 0.5
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i)
      b.fromBufferAttribute(pos, i + 1)
      c.fromBufferAttribute(pos, i + 2)
      ab.subVectors(b, a)
      ac.subVectors(c, a)
      total += ab.cross(ac).length() * 0.5
    }
  }
  return total
}

function createGeometry() {
  const d = detail.value
  if (shape.value === 'box') return new THREE.BoxGeometry(3, 3, 3, Math.max(1, Math.floor(d / 12)), Math.max(1, Math.floor(d / 12)), Math.max(1, Math.floor(d / 12)))
  if (shape.value === 'cone') return new THREE.ConeGeometry(1.8, 3.6, d, Math.max(1, Math.floor(d / 2)))
  if (shape.value === 'torus') return new THREE.TorusGeometry(2, 0.75, Math.max(6, Math.floor(d / 2)), Math.max(24, d * 3))
  if (shape.value === 'knot') return new THREE.TorusKnotGeometry(1.6, 0.55, Math.max(80, d * 6), Math.max(10, Math.floor(d / 2)))
  return new THREE.SphereGeometry(2, d, d)
}

function rebuild() {
  if (mesh) {
    scene.remove(mesh)
    mesh.geometry?.dispose?.()
    mesh = null
  }
  const geometry = createGeometry()
  geometry.computeVertexNormals()

  triCount.value = geometry.index ? Math.floor(geometry.index.count / 3) : Math.floor(geometry.attributes.position.count / 3)
  area.value = surfaceArea(geometry)

  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 2.2
  scene.add(mesh)
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
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 6, 16)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(40, 40)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(40, 20, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2.2, 0)

  material = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    roughness: 0.35,
    metalness: 0.25
  })

  rebuild()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value && mesh) {
    mesh.rotation.y += delta * 0.6
    mesh.rotation.x += delta * 0.25
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([shape, detail], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 76px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
