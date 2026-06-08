<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">臂长:</span>
      <input type="range" v-model="armLength" min="1" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ armLength.toFixed(1) }}</span>
      <span class="panel-label">臂宽:</span>
      <input type="range" v-model="armWidth" min="0.2" max="2.5" step="0.1" class="control-range">
      <span class="panel-value">{{ armWidth.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="showFill">
        <span>填充</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="showOutline">
        <span>轮廓</span>
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
const armLength = ref(4)
const armWidth = ref(1.2)
const showFill = ref(true)
const showOutline = ref(true)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let fillMesh, outlineLine, group, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createPlusShape() {
  const l = armLength.value
  const w = armWidth.value
  const halfW = w / 2
  const halfL = l / 2

  const shape = new THREE.Shape()
  shape.moveTo(-halfW, halfL)
  shape.lineTo(halfW, halfL)
  shape.lineTo(halfW, halfW)
  shape.lineTo(halfL, halfW)
  shape.lineTo(halfL, -halfW)
  shape.lineTo(halfW, -halfW)
  shape.lineTo(halfW, -halfL)
  shape.lineTo(-halfW, -halfL)
  shape.lineTo(-halfW, -halfW)
  shape.lineTo(-halfL, -halfW)
  shape.lineTo(-halfL, halfW)
  shape.lineTo(-halfW, halfW)
  shape.closePath()

  return shape
}

function rebuild() {
  const shape = createPlusShape()

  if (fillMesh) {
    fillMesh.geometry.dispose()
    fillMesh.geometry = new THREE.ShapeGeometry(shape, 24)
  }

  if (outlineLine) {
    outlineLine.geometry.dispose()
    const points = shape.getPoints(128)
    outlineLine.geometry = new THREE.BufferGeometry().setFromPoints(points)
  }

  if (fillMesh) fillMesh.visible = showFill.value
  if (outlineLine) outlineLine.visible = showOutline.value
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  fillMesh?.geometry?.dispose?.()
  fillMesh?.material?.dispose?.()
  outlineLine?.geometry?.dispose?.()
  outlineLine?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 6, 14)
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

  group = new THREE.Group()
  group.position.y = 2
  scene.add(group)

  const shape = createPlusShape()
  const fillGeometry = new THREE.ShapeGeometry(shape, 24)
  const fillMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide })
  fillMesh = new THREE.Mesh(fillGeometry, fillMaterial)
  fillMesh.visible = showFill.value
  group.add(fillMesh)

  const outlinePoints = shape.getPoints(128)
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints)
  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff })
  outlineLine = new THREE.LineLoop(outlineGeometry, outlineMaterial)
  outlineLine.position.z = 0.01
  outlineLine.visible = showOutline.value
  group.add(outlineLine)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    group.rotation.y += delta * 0.55
    group.rotation.x += delta * 0.22
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([armLength, armWidth, showFill, showOutline], rebuild)
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
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
