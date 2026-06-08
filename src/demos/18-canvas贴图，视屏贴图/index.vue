<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模式:</span>
      <select v-model="mode" class="control-select">
        <option value="canvas">Canvas动画</option>
        <option value="video">视频纹理</option>
      </select>
      <button @click="toggleAnimation" class="control-btn">{{ playing ? '暂停' : '播放' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const mode = ref('canvas')
const playing = ref(true)

let scene, camera, renderer, animationId, controls
let canvas, ctx, canvasTexture, time = 0
let mesh

function initCanvasTexture() {
  canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  ctx = canvas.getContext('2d')
  canvasTexture = new THREE.CanvasTexture(canvas)
  return canvasTexture
}

function drawCanvas() {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 512, 512)
  
  ctx.fillStyle = '#667eea'
  for (let i = 0; i < 10; i++) {
    const x = (Math.sin(time + i) + 1) * 200 + 56
    const y = (Math.cos(time + i * 0.5) + 1) * 200 + 56
    ctx.beginPath()
    ctx.arc(x, y, 20 + Math.sin(time + i) * 10, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.strokeStyle = '#4ecdc4'
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i < 100; i++) {
    const x = i * 5.12
    const y = 256 + Math.sin(i * 0.1 + time) * 100
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  
  if (canvasTexture) canvasTexture.needsUpdate = true
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const texture = initCanvasTexture()
  const geometry = new THREE.BoxGeometry(3, 3, 3)
  const material = new THREE.MeshStandardMaterial({ map: texture })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 1.5
  scene.add(mesh)

  const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32)
  const sphereMaterial = new THREE.MeshStandardMaterial({ map: texture })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(-4, 1.5, 0)
  scene.add(sphere)

  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32)
  const cylinderMaterial = new THREE.MeshStandardMaterial({ map: texture })
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial)
  cylinder.position.set(4, 1.5, 0)
  scene.add(cylinder)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function toggleAnimation() {
  playing.value = !playing.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (playing.value) {
    time += 0.05
    drawCanvas()
  }
  
  if (mesh) mesh.rotation.y += 0.01
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.control-select {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.control-btn {
  padding: 10px 20px;
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
</style>
