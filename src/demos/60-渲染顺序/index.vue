<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">渲染顺序:</span>
      <select v-model="renderOrder" class="control-select">
        <option value="auto">自动（默认）</option>
        <option value="manual">手动设置</option>
        <option value="backfront">由后到前</option>
      </select>
      <span class="panel-label">深度测试:</span>
      <select v-model="depthTest" class="control-select">
        <option value="on">开启</option>
        <option value="off">关闭</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const renderOrder = ref('auto')
const depthTest = ref('on')

let scene, camera, renderer, animationId, controls
let meshes = [], clock

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
  const sizes = [3, 2.5, 2, 1.5]
  const positions = [-4, -2, 2, 4]
  
  for (let i = 0; i < 4; i++) {
    const geometry = new THREE.BoxGeometry(sizes[i], sizes[i], sizes[i])
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[i], 
      metalness: 0.3, 
      roughness: 0.5,
      transparent: true,
      opacity: 0.8
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = positions[i]
    mesh.renderOrder = i
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([renderOrder, depthTest], () => {
  meshes.forEach((mesh, i) => {
    mesh.material.depthTest = depthTest.value === 'on'
    mesh.material.depthWrite = depthTest.value === 'on'
    
    if (renderOrder.value === 'manual') {
      mesh.renderOrder = i
    } else if (renderOrder.value === 'backfront') {
      mesh.renderOrder = 3 - i
    } else {
      mesh.renderOrder = 0
    }
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.rotation.x = time * 0.3 + i * 0.5
    mesh.rotation.y = time * 0.4 + i * 0.5
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
