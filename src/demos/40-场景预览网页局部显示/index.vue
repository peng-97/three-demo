<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div ref="minimap" class="minimap"></div>
    <div class="control-panel">
      <span class="panel-label">移动速度:</span>
      <input type="range" v-model="moveSpeed" min="0.1" max="2" step="0.1" class="control-range">
      <span class="panel-label">小地图大小:</span>
      <input type="range" v-model="minimapSize" min="100" max="300" step="10" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const container = ref(null)
const minimap = ref(null)
const moveSpeed = ref(0.5)
const minimapSize = ref(180)

let scene, camera, renderer, animationId
let minimapScene, minimapCamera, minimapRenderer
let objects = [], player, playerIndicator, clock
let keys = {}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 15, 20)
  camera.lookAt(0, 0, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)
  
  const grid = new THREE.GridHelper(60, 60, 0x444466, 0x222233)
  scene.add(grid)
  
  const floorGeom = new THREE.PlaneGeometry(60, 60)
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a })
  const floor = new THREE.Mesh(floorGeom, floorMat)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  
  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf, 0xc56cf0]
  
  for (let i = 0; i < 30; i++) {
    const size = 0.8 + Math.random() * 2
    const geom = new THREE.BoxGeometry(size, size * 2, size)
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      metalness: 0.3,
      roughness: 0.7
    })
    const box = new THREE.Mesh(geom, mat)
    box.position.set(
      (Math.random() - 0.5) * 50,
      size,
      (Math.random() - 0.5) * 50
    )
    scene.add(box)
    objects.push(box)
  }
  
  const playerGeom = new THREE.ConeGeometry(0.8, 2, 8)
  const playerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5
  })
  player = new THREE.Mesh(playerGeom, playerMat)
  player.position.set(0, 1, 0)
  scene.add(player)
  
  minimapScene = new THREE.Scene()
  minimapScene.background = new THREE.Color(0x111122)
  
  minimapCamera = new THREE.OrthographicCamera(-30, 30, 30, -30, 0.1, 1000)
  minimapCamera.position.set(0, 50, 0)
  minimapCamera.lookAt(0, 0, 0)
  
  minimapRenderer = new THREE.WebGLRenderer({ antialias: true })
  minimapRenderer.setSize(minimapSize.value, minimapSize.value)
  minimap.value.appendChild(minimapRenderer.domElement)
  
  const minimapGrid = new THREE.GridHelper(60, 30, 0x333355, 0x222244)
  minimapScene.add(minimapGrid)
  
  const minimapPlayerGeom = new THREE.ConeGeometry(1, 2, 8)
  const minimapPlayerMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  playerIndicator = new THREE.Mesh(minimapPlayerGeom, minimapPlayerMat)
  playerIndicator.rotation.x = -Math.PI / 2
  minimapScene.add(playerIndicator)
  
  objects.forEach(obj => {
    const copyGeom = new THREE.BoxGeometry(
      obj.geometry.parameters.width,
      0.5,
      obj.geometry.parameters.depth
    )
    const copyMat = new THREE.MeshBasicMaterial({ color: obj.material.color })
    const copy = new THREE.Mesh(copyGeom, copyMat)
    copy.position.set(obj.position.x, 0.25, obj.position.z)
    minimapScene.add(copy)
  })
  
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true)
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false)
  
  clock = new THREE.Clock()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  
  const speed = moveSpeed.value * 10 * delta
  
  if (keys['w'] || keys['arrowup']) player.position.z -= speed
  if (keys['s'] || keys['arrowdown']) player.position.z += speed
  if (keys['a'] || keys['arrowleft']) player.position.x -= speed
  if (keys['d'] || keys['arrowright']) player.position.x += speed
  
  player.position.x = Math.max(-28, Math.min(28, player.position.x))
  player.position.z = Math.max(-28, Math.min(28, player.position.z))
  
  camera.position.x = player.position.x
  camera.position.z = player.position.z + 20
  camera.lookAt(player.position.x, 0, player.position.z)
  
  playerIndicator.position.x = player.position.x
  playerIndicator.position.z = player.position.z
  
  player.rotation.y += delta * 2
  
  renderer.render(scene, camera)
  minimapRenderer.render(minimapScene, minimapCamera)
}

watch(minimapSize, (size) => {
  minimapRenderer.setSize(size, size)
})

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  window.removeEventListener('keydown', () => {})
  window.removeEventListener('keyup', () => {})
  renderer.dispose()
  minimapRenderer.dispose()
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
.demo-container { flex: 1; }
.minimap { position: absolute; top: 20px; right: 20px; border: 3px solid #667eea; border-radius: 8px; overflow: hidden; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-range { width: 120px; cursor: pointer; }
</style>
