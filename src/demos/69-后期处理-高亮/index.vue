<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="clearSelection" class="control-btn">清除高亮</button>
      <label class="control-check">
        <input type="checkbox" v-model="pulse">
        <span>呼吸</span>
      </label>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="edgeStrength" min="0" max="10" step="0.1" class="control-range">
      <span class="panel-value">{{ edgeStrength.toFixed(1) }}</span>
      <span class="panel-label">粗细:</span>
      <input type="range" v-model="edgeThickness" min="0" max="5" step="0.1" class="control-range">
      <span class="panel-value">{{ edgeThickness.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'

const container = ref(null)
const edgeStrength = ref(3)
const edgeThickness = ref(1)
const pulse = ref(true)

let scene, camera, renderer, animationId, controls
let composer, outlinePass, clock
let objects = []
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let selectedObject = null

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
  controls?.dispose?.()
  objects.forEach((m) => {
    m.geometry?.dispose?.()
    m.material?.dispose?.()
  })
  composer?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function onResize() {
  if (!container.value || !renderer || !camera || !composer) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  composer.setSize(clientWidth, clientHeight)
  outlinePass.setSize(clientWidth, clientHeight)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 6, 16)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]
  const baseGeometries = [
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.SphereGeometry(0.95, 24, 24),
    new THREE.ConeGeometry(0.9, 2, 24),
    new THREE.TorusGeometry(1, 0.35, 18, 100)
  ]
  for (let i = 0; i < 28; i++) {
    const geometry = baseGeometries[Math.floor(Math.random() * baseGeometries.length)].clone()
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.45,
      metalness: 0.35
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set((Math.random() - 0.5) * 18, 1 + Math.random() * 4, (Math.random() - 0.5) * 18)
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    scene.add(mesh)
    objects.push(mesh)
  }

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  outlinePass = new OutlinePass(new THREE.Vector2(container.value.clientWidth, container.value.clientHeight), scene, camera)
  outlinePass.edgeStrength = edgeStrength.value
  outlinePass.edgeThickness = edgeThickness.value
  outlinePass.visibleEdgeColor.set(0x00ffff)
  outlinePass.hiddenEdgeColor.set(0x001122)
  composer.addPass(outlinePass)

  clock = new THREE.Clock()
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('resize', onResize)
}

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(objects, false)
  if (intersects.length > 0) {
    selectedObject = intersects[0].object
    outlinePass.selectedObjects = [selectedObject]
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  objects.forEach((m, i) => {
    m.rotation.y += delta * (0.2 + i * 0.01)
  })
  controls.update()
  if (pulse.value) {
    const t = clock.getElapsedTime()
    outlinePass.edgeStrength = edgeStrength.value * (0.75 + Math.sin(t * 2.5) * 0.25)
  } else {
    outlinePass.edgeStrength = edgeStrength.value
  }
  outlinePass.edgeThickness = edgeThickness.value
  composer.render()
}

function clearSelection() {
  selectedObject = null
  if (outlinePass) outlinePass.selectedObjects = []
}

watch([edgeStrength, edgeThickness], () => {
  if (!outlinePass) return
  outlinePass.edgeStrength = edgeStrength.value
  outlinePass.edgeThickness = edgeThickness.value
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
.panel-value { color: white; font-weight: 700; min-width: 40px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
