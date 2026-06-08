<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">UI样式:</span>
      <select v-model="uiStyle" class="control-select">
        <option value="simple">简单</option>
        <option value="modern">现代</option>
        <option value="dark">暗黑</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const uiStyle = ref('modern')

let scene, camera, renderer, animationId, controls
let objects = []
let uiElements = []
let clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 8, 15)
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

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf]
  const names = ['Object A', 'Object B', 'Object C', 'Object D', 'Object E']
  
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({ color: colors[i], metalness: 0.4, roughness: 0.5 })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set((i - 2) * 4, 1, (Math.random() - 0.5) * 8)
    scene.add(cube)
    objects.push(cube)
    
    const div = document.createElement('div')
    div.style.cssText = `
      position: absolute;
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      pointer-events: none;
      user-select: none;
      transform: translate(-50%, -100%);
      white-space: nowrap;
    `
    div.textContent = names[i]
    container.value.appendChild(div)
    uiElements.push(div)
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
    obj.rotation.x = Math.sin(time * 0.5 + i) * 0.3
    obj.rotation.y = time * 0.3 + i
    
    const screenPos = obj.position.clone().project(camera)
    const x = (screenPos.x * 0.5 + 0.5) * container.value.clientWidth
    const y = (-screenPos.y * 0.5 + 0.5) * container.value.clientHeight
    
    uiElements[i].style.display = screenPos.z > 1 ? 'none' : 'block'
    uiElements[i].style.left = x + 'px'
    uiElements[i].style.top = y + 'px'
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
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
</style>
