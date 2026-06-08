<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button class="control-btn" @click="doTranslate">📐 平移</button>
      <button class="control-btn" @click="doRotate">🔄 旋转</button>
      <button class="control-btn" @click="doScale">🔍 缩放</button>
      <button class="control-btn reset" @click="doReset">↩️ 重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, cubeMesh, originalState

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(8, 6, 10)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  // 创建网格模型
  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2)
  const cubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })
  cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cubeMesh.position.set(0, 1, 0)
  scene.add(cubeMesh)

  // 保存原始状态
  originalState = {
    position: cubeMesh.position.clone(),
    rotation: cubeMesh.rotation.clone(),
    scale: cubeMesh.scale.clone()
  }

  // 创建坐标轴辅助线
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // 创建网格辅助线
  const gridHelper = new THREE.GridHelper(15, 15, 0x444444, 0x222222)
  scene.add(gridHelper)

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
}

function doTranslate() {
  cubeMesh.position.x += 1
}

function doRotate() {
  cubeMesh.rotation.y += Math.PI / 4
}

function doScale() {
  const newScale = cubeMesh.scale.x * 1.2
  cubeMesh.scale.set(newScale, newScale, newScale)
}

function doReset() {
  cubeMesh.position.copy(originalState.position)
  cubeMesh.rotation.copy(originalState.rotation)
  cubeMesh.scale.copy(originalState.scale)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
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
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.control-btn {
  padding: 10px 25px;
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

.control-btn.reset {
  background: #ff6b6b;
  color: white;
}

.control-btn.reset:hover {
  background: #ee5a5a;
}
</style>
