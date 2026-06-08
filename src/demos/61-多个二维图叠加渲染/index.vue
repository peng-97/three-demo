<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">透明度:</span>
      <input type="range" v-model="opacity" min="0.1" max="1" step="0.1" class="control-range">
      <span class="panel-label">混合模式:</span>
      <select v-model="blendMode" class="control-select">
        <option value="normal">Normal</option>
        <option value="add">Additive</option>
        <option value="subtract">Subtract</option>
        <option value="multiply">Multiply</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="useRenderOrder">
        <span>renderOrder</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="depthTest">
        <span>depthTest</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="depthWrite">
        <span>depthWrite</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const opacity = ref(0.7)
const blendMode = ref('normal')
const useRenderOrder = ref(true)
const depthTest = ref(true)
const depthWrite = ref(false)

let scene, camera, renderer, animationId, controls
let meshes = []
let clock
let textures = []

function createLabelTexture({ label, color }) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2)
  ctx.fillStyle = color.replace('rgb(', 'rgba(').replace(')', ', 0.25)')
  ctx.fill()

  ctx.fillStyle = color
  ctx.font = 'bold 120px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function applyMaterialSettings() {
  meshes.forEach((mesh, i) => {
    const material = mesh.material
    material.transparent = true
    material.opacity = opacity.value
    material.depthTest = depthTest.value
    material.depthWrite = depthWrite.value

    if (blendMode.value === 'add') {
      material.blending = THREE.AdditiveBlending
    } else if (blendMode.value === 'subtract') {
      material.blending = THREE.SubtractiveBlending
    } else if (blendMode.value === 'multiply') {
      material.blending = THREE.MultiplyBlending
    } else {
      material.blending = THREE.NormalBlending
    }

    mesh.renderOrder = useRenderOrder.value ? i : 0
    material.needsUpdate = true
  })
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

  const colors = [
    { label: 'A', color: 'rgb(255, 107, 107)' },
    { label: 'B', color: 'rgb(78, 205, 196)' },
    { label: 'C', color: 'rgb(102, 126, 234)' },
    { label: 'D', color: 'rgb(254, 202, 87)' }
  ]
  const positions = [
    [0, 0, 0],
    [1.5, 1.5, 1.5],
    [-1.5, -1.5, -1.5],
    [0, 2, 0]
  ]
  
  for (let i = 0; i < 4; i++) {
    const geometry = new THREE.PlaneGeometry(6, 6)
    const texture = createLabelTexture(colors[i])
    textures.push(texture)
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      opacity: opacity.value,
      side: THREE.DoubleSide
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...positions[i])
    mesh.rotation.x = Math.PI / 4
    mesh.rotation.y = i * Math.PI / 4
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()

  applyMaterialSettings()
  window.addEventListener('resize', onResize)
}

watch([opacity, blendMode, useRenderOrder, depthTest, depthWrite], applyMaterialSettings)

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.rotation.x = Math.PI / 4 + Math.sin(time + i) * 0.2
    mesh.rotation.y = i * Math.PI / 4 + Math.cos(time * 0.5 + i) * 0.3
  })

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  meshes.forEach((mesh) => {
    mesh.geometry?.dispose?.()
    mesh.material?.dispose?.()
  })
  textures.forEach((t) => t.dispose())
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  renderer.dispose()
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 100px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
