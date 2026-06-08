<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">3D元素:</span>
      <select v-model="elementType" class="control-select">
        <option value="card">3D卡片</option>
        <option value="panel">信息面板</option>
        <option value="image">图片展示</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const elementType = ref('card')

let scene, camera, renderer, animationId, controls
let objects = []
let clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(grid)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57]
  
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 512
    ctx.fillStyle = '#' + colors[i].toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('3D Card ' + (i+1), 256, 220)
    ctx.font = '24px Arial'
    ctx.fillText('CSS3D Renderer', 256, 280)
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    const geometry = new THREE.PlaneGeometry(4, 4)
    const plane = new THREE.Mesh(geometry, material)
    
    const angle = (i / 4) * Math.PI * 2
    plane.position.set(Math.cos(angle) * 5, 2, Math.sin(angle) * 5)
    plane.lookAt(0, 2, 0)
    scene.add(plane)
    objects.push(plane)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()
  
  objects.forEach((obj, i) => {
    obj.rotation.y = time * 0.5 + i * Math.PI * 0.5
  })
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  renderer.dispose()
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
</style>
