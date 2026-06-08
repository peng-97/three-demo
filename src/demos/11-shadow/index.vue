<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId

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

  // TODO: 在这里开启渲染器的阴影功能
  // 提示: renderer.shadowMap.enabled = ?
  renderer.shadowMap.enabled = true // 开启阴影功能
  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)
  
  // TODO: 在这里开启光源的阴影功能
  // 提示: directionalLight.castShadow = ?
  directionalLight.castShadow = true // 开启阴影功能
  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)
  
  // TODO: 在这里设置地面接收阴影
  // 提示: ground.receiveShadow = ?
  ground.receiveShadow = true // 开启阴影功能
  
  // 创建立方体
  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2)
  const cubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.set(0, 1, 0)
  scene.add(cube)
  
  // TODO: 在这里设置立方体投射阴影
  // 提示: cube.castShadow = ?
  cube.castShadow = true // 开启阴影功能

  // 创建球体
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
  const sphereMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa8e6cf,
    metalness: 0.4,
    roughness: 0.3
  })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(3, 1.5, -2)
  scene.add(sphere)
  
  // TODO: 在这里设置球体投射阴影
  // 提示: sphere.castShadow = ?
  sphere.castShadow = true // 开启阴影功能
  
  // TODO: 在这里设置球体接收阴影
  // 提示: sphere.receiveShadow = ?
  sphere.receiveShadow = true // 开启阴影功能
  
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

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
