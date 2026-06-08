<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">标签样式:</span>
      <select v-model="labelStyle" class="control-select">
        <option value="simple">简单标签</option>
        <option value="tooltip">气泡提示</option>
        <option value="card">信息卡片</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const labelStyle = ref('tooltip')

let scene, camera, renderer, animationId, controls
let objects = []
let sprites = []
let clock

function createLabelTexture(text, color) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 256
  canvas.height = 128
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.roundRect = (x, y, w, h, r) => {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
  ctx.roundRect(5, 5, 246, 118, 15)
  ctx.fill()
  ctx.stroke()
  
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.fillText(text, 128, 75)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

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
  const names = ['Cube 1', 'Cube 2', 'Cube 3', 'Cube 4', 'Cube 5']
  
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({ color: colors[i], metalness: 0.4, roughness: 0.5 })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set((i - 2) * 4, 1, (Math.random() - 0.5) * 8)
    scene.add(cube)
    objects.push(cube)
    
    const labelTex = createLabelTexture(names[i], '#' + colors[i].toString(16).padStart(6, '0'))
    const spriteMaterial = new THREE.SpriteMaterial({ map: labelTex, transparent: true })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(3, 1.5, 1)
    sprite.position.copy(cube.position)
    sprite.position.y += 2
    scene.add(sprite)
    sprites.push(sprite)
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
    sprites[i].position.copy(obj.position)
    sprites[i].position.y += 2
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
