<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button class="control-btn" @click="rotateGroup">🔄 旋转整体</button>
      <button class="control-btn" @click="moveGroup">➡️ 移动整体</button>
      <button class="control-btn" @click="scaleGroup">🔍 缩放整体</button>
      <button class="control-btn reset" @click="resetGroup">↩️ 重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, carGroup, originalState

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

  carGroup = new THREE.Group()
  scene.add(carGroup)

  // 创建车身
  const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 1.5)
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.name = 'body'
  body.position.y = 1

   carGroup.add(body)
  // 创建车顶
  const roofGeometry = new THREE.BoxGeometry(1.8, 1, 1.3)
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x764ba2,
    metalness: 0.3,
    roughness: 0.7
  })
  const roof = new THREE.Mesh(roofGeometry, roofMaterial)
  roof.position.set(0, 2.2, 0)
  
  carGroup.add(roof)
   
 //遍历
  carGroup.traverse((child) => {
    if (child.isMesh) {
      child.material.color.set(0xff0000)
    }
  })

  //遍历
  carGroup.children.forEach((child) => {
    if (child.isMesh) {
      console.log(child)
    }
  })
  // 获取对象
  carGroup.getObjectByName('body').material.color.set(0xff0000)



  // 创建轮子
  const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16)
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
  
  const wheelPositions = [
    { x: -1, y: 0.5, z: 1 },
    { x: 1, y: 0.5, z: 1 },
    { x: -1, y: 0.5, z: -1 },
    { x: 1, y: 0.5, z: -1 }
  ]
  
  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(pos.x, pos.y, pos.z)
    carGroup.add(wheel)
  })

  // 保存原始状态
  originalState = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1)
  }

  // 创建坐标轴辅助线
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // 创建网格辅助线
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
}

function rotateGroup() {
  if (carGroup) {
    carGroup.rotation.y += Math.PI / 4
  }
}

function moveGroup() {
  // TODO: 移动 carGroup
  if (carGroup) {
    carGroup.position.x += 1
  }
}

function scaleGroup() {
  // TODO: 缩放 carGroup

  if (carGroup) {
    debugger
    const newScale = carGroup.scale.x * 1.2
    carGroup.scale.set(newScale, newScale, newScale)
  }
}

function resetGroup() {
  // TODO: 重置 carGroup 状态
  carGroup.position.copy(originalState.position)
  carGroup.rotation.copy(originalState.rotation)
  carGroup.scale.copy(originalState.scale)
  if (carGroup) {
    carGroup.position.copy(originalState.position)
    carGroup.rotation.copy(originalState.rotation)
    carGroup.scale.copy(originalState.scale)
  }
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
