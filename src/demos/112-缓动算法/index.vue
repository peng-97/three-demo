<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <select v-model="currentEasing" class="control-select" @change="restartAnimation">
        <option v-for="easing in easingOptions" :key="easing.value" :value="easing.value">
          {{ easing.label }}
        </option>
      </select>
      <button @click="restartAnimation" class="control-btn">▶ 重新播放</button>
      <button @click="playAll" class="control-btn">▶▶ 全部演示</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const currentEasing = ref('Quadratic.InOut')

let scene, camera, renderer, animationId, controls
let movingObject
let currentTween = null

const easingOptions = [
  { label: 'Linear (线性)', value: 'Linear.None' },
  { label: 'Quadratic.In (二次缓入)', value: 'Quadratic.In' },
  { label: 'Quadratic.Out (二次缓出)', value: 'Quadratic.Out' },
  { label: 'Quadratic.InOut (二次缓入缓出)', value: 'Quadratic.InOut' },
  { label: 'Cubic.In (三次缓入)', value: 'Cubic.In' },
  { label: 'Cubic.Out (三次缓出)', value: 'Cubic.Out' },
  { label: 'Cubic.InOut (三次缓入缓出)', value: 'Cubic.InOut' },
  { label: 'Elastic.Out (弹性)', value: 'Elastic.Out' },
  { label: 'Bounce.Out (弹跳)', value: 'Bounce.Out' },
  { label: 'Back.Out (回退)', value: 'Back.Out' },
  { label: 'Circular.Out (圆形)', value: 'Circular.Out' },
  { label: 'Exponential.Out (指数)', value: 'Exponential.Out' }
]

const startPos = new THREE.Vector3(-8, 1, 0)
const endPos = new THREE.Vector3(8, 1, 0)

function getEasingFunction(value) {
  const parts = value.split('.')
  const type = parts[0]
  const direction = parts[1]
  return TWEEN.Easing[type][direction]
}

function createPathVisualization() {
  const geometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos])
  const material = new THREE.LineDashedMaterial({
    color: 0x444466,
    dashSize: 0.3,
    gapSize: 0.2
  })
  const line = new THREE.Line(geometry, material)
  line.computeLineDistances()
  scene.add(line)

  const startMarkerGeom = new THREE.SphereGeometry(0.2, 16, 16)
  const startMarkerMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 })
  const startMarker = new THREE.Mesh(startMarkerGeom, startMarkerMat)
  startMarker.position.copy(startPos)
  scene.add(startMarker)

  const endMarkerGeom = new THREE.SphereGeometry(0.2, 16, 16)
  const endMarkerMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b })
  const endMarker = new THREE.Mesh(endMarkerGeom, endMarkerMat)
  endMarker.position.copy(endPos)
  scene.add(endMarker)
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 8, 18)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(25, 15)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(25, 25, 0x444466, 0x222233)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  createPathVisualization()

  const objectGeom = new THREE.DodecahedronGeometry(0.7, 0)
  const objectMat = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.3, metalness: 0.5 })
  movingObject = new THREE.Mesh(objectGeom, objectMat)
  movingObject.position.copy(startPos)
  scene.add(movingObject)
}

function restartAnimation() {
  if (currentTween) {
    currentTween.stop()
  }

  movingObject.position.copy(startPos)
  movingObject.rotation.set(0, 0, 0)

  const easing = getEasingFunction(currentEasing.value)

  currentTween = new TWEEN.Tween(movingObject.position)
    .to({ x: endPos.x }, 2000)
    .easing(easing)
    .start()

  const rotTween = new TWEEN.Tween(movingObject.rotation)
    .to({ y: Math.PI * 4 }, 2000)
    .easing(easing)
    .start()
}

function playAll() {
  if (currentTween) {
    currentTween.stop()
  }

  let delay = 0
  const duration = 1500

  easingOptions.forEach((option, index) => {
    setTimeout(() => {
      currentEasing.value = option.value

      movingObject.position.copy(startPos)
      movingObject.rotation.set(0, 0, 0)

      const easing = getEasingFunction(option.value)

      const tween = new TWEEN.Tween(movingObject.position)
        .to({ x: endPos.x }, duration)
        .easing(easing)
        .start()

      const rotTween = new TWEEN.Tween(movingObject.rotation)
        .to({ y: Math.PI * 3 }, duration)
        .easing(easing)
        .start()
    }, delay)
    delay += duration + 500
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  TWEEN.update()
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
  animate()
})

onUnmounted(() => {
  if (currentTween) currentTween.stop()
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  movingObject?.geometry?.dispose?.()
  movingObject?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
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
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.control-select {
  padding: 10px 15px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  min-width: 220px;
}

.control-btn {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
