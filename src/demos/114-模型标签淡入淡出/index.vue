<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleLabel" class="control-btn">{{ labelVisible ? '隐藏标签' : '显示标签' }}</button>
      <span class="panel-label">时长:</span>
      <input type="range" v-model="fadeMs" min="100" max="3000" step="50" class="control-range">
      <span class="panel-value">{{ fadeMs }}ms</span>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
      <span class="panel-label">提示:</span>
      <span class="panel-value">点击模型也可切换</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const fadeMs = ref(600)
const labelVisible = ref(true)
const spinning = ref(true)

let scene, camera, renderer, labelRenderer, animationId, controls
let mesh, clock
let labelObj = null
let labelEl = null
let raycaster, pointer
let fadeTween = null
let virtualTime = 0

function onResize() {
  if (!container.value || !renderer || !camera || !labelRenderer) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  labelRenderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 10, 22)
  camera.lookAt(0, 4, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(container.value.clientWidth, container.value.clientHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  container.value.appendChild(labelRenderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const grid = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 4, 0)

  const geometry = new THREE.TorusKnotGeometry(3, 1, 200, 24)
  const material = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.35, metalness: 0.25 })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 4
  scene.add(mesh)

  labelEl = document.createElement('div')
  labelEl.className = 'label'
  labelEl.style.opacity = '1'
  labelEl.innerText = '模型标签'
  labelObj = new CSS2DObject(labelEl)
  labelObj.position.set(0, 4.5, 0)
  mesh.add(labelObj)

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()
  renderer.domElement.addEventListener('pointerdown', onPointerDown)

  clock = new THREE.Clock()
  virtualTime = 0
  window.addEventListener('resize', onResize)
  animate()
})

onUnmounted(() => {
  if (fadeTween) fadeTween.stop()
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
  controls?.dispose?.()
  mesh?.geometry?.dispose?.()
  mesh?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  if (labelRenderer?.domElement?.parentNode) labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  virtualTime += delta * 1000
  TWEEN.update(virtualTime)
  if (spinning.value) mesh.rotation.y += delta * 0.2
  controls.update()
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

function setLabelOpacity(v) {
  if (!labelEl) return
  labelEl.style.opacity = String(v)
}

function toggleLabel() {
  if (!labelEl) return
  if (fadeTween) fadeTween.stop()
  const from = Number(labelEl.style.opacity || '1')
  const to = labelVisible.value ? 0 : 1
  labelVisible.value = !labelVisible.value
  const data = { o: from }
  fadeTween = new TWEEN.Tween(data)
    .to({ o: to }, fadeMs.value)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => setLabelOpacity(data.o))
  fadeTween.start(virtualTime)
}

function onPointerDown(e) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObject(mesh, true)
  if (hits.length) toggleLabel()
}
</script>

<style scoped>
.label {
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 700;
  transform: translate(-50%, -100%);
  white-space: nowrap;
}
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.demo-container {
  flex: 1;
  position: relative;
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
.panel-value { color: white; font-weight: 700; min-width: 120px; text-align: left; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
