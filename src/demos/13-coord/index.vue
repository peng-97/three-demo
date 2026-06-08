<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="info-panel">
      <div class="info-item">
        <span class="label">鼠标屏幕坐标:</span>
        <span class="value">{{ coords.screenCoord }}</span>
      </div>
      <div class="info-item">
        <span class="label">归一化设备坐标:</span>
        <span class="value">{{ coords.ndcCoord }}</span>
      </div>
      <div class="info-item">
        <span class="label">世界坐标(平面交点):</span>
        <span class="value">{{ coords.worldCoord }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, raycaster, mouse, marker, plane, group
const coords = reactive({
  screenCoord: '(0, 0)',
  ndcCoord: '(0.00, 0.00)',
  worldCoord: '(0.00, 0.00, 0.00)'
})

onMounted(() => {
  init()
  animate()
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
  window.removeEventListener('mousemove', handleMouseMove)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(8, 6, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // 创建光线投射器和鼠标向量
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)
  group = new THREE.Group()
  scene.add(group)
  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.5
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2

  group.add(ground)
  plane = ground


  // 创建标记物
  const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16)
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    emissive: 0xff6b6b,
    emissiveIntensity: 0.3
  })
  marker = new THREE.Mesh(markerGeometry, markerMaterial)
  marker.visible = false
  scene.add(marker)

  // 创建一些物体用于演示
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })

  for (let x = -4; x <= 4; x += 2) {
    for (let z = -4; z <= 4; z += 2) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial.clone())
      cube.position.set(x, 0.5, z)
      // scene.add(cube)
      group.add(cube)
    }
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

function handleMouseMove(event) {
  // 计算屏幕坐标
  const rect = container.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  coords.screenCoord = `(${x}, ${y})`  //屏幕坐标

  //转为归一化设备坐标

  mouse.x = ((x / rect.width) - 0.5) * 2
  mouse.y = -((y / rect.height) - 0.5) * 2
  coords.ndcCoord = `(${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)})`

  // 计算与地面的交点
  let preObject = null //上次选中的物体对象
  raycaster.setFromCamera(mouse, camera)
  console.log(group.children)
  const intersects = raycaster.intersectObjects(group.children, true)


  if (intersects.length > 0) {
debugger
    //是否是立方体物体
    if (intersects[0].object == plane) {
      coords.worldCoord = `(${intersects[0].point.x.toFixed(2)}, ${intersects[0].point.y.toFixed(2)}, ${intersects[0].point.z.toFixed(2)})`
      marker.visible = true
      marker.position.copy(intersects[0].point)
    }
    else {
      marker.visible = false
    }
    if(intersects[0].object.isMesh && intersects[0].object !== plane){
      //之前的物体颜色恢复默认颜色
      group.traverse(child => {
        if(child.isMesh){
          child.material.color.set(0x667eea)
        }
      })
      intersects[0].object.material.color.set(0xfffff)
    }
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

.info-panel {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  font-weight: 600;
  color: white;
}

.value {
  background: white;
  color: #333;
  padding: 5px 15px;
  border-radius: 5px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
}
</style>
