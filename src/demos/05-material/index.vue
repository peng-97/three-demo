<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GridHelper,AxesHelper,PointLightHelper,DirectionalLightHelper } from 'three';

const container = ref(null)
let scene, camera, renderer, animationId, meshes = []

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
  scene.background = new THREE.Color(0x2c3e50)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 10)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometry = new THREE.SphereGeometry(0.8, 32, 32)
  
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 }),
    new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5, roughness: 0.5 }),
    //metalness 金属度  0-1 0 表示金属 1 表示非金属
    //roughness 粗糙度 0-1 0 表示光滑 1 表示粗糙
    new THREE.MeshToonMaterial({ color: 0xff00ff })
  ]
  
  materials.forEach((material, i) => {
    const mesh = new THREE.Mesh(geometry, material)
    const x = (i - 2) * 1.8
    mesh.position.set(x, 0, 0)
    scene.add(mesh)
    meshes.push(mesh)
  })
  // 光源
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)
  
  // 方向光
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)
  // 点光源
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 100)
  pointLight.position.set(-5, 0, 5)
  scene.add(pointLight)
  
  const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(controls)

  // 坐标轴
  const axesHelper = new AxesHelper(20)
  scene.add(axesHelper)

  // 网格辅助线
  const gridHelper = new GridHelper(10, 10)
  scene.add(gridHelper)
  // 点光源辅助线
  const pointLightHelper = new PointLightHelper(pointLight, 1)
  scene.add(pointLightHelper)
  // 方向光辅助线
  const directionalLightHelper = new DirectionalLightHelper(light, 1)
  scene.add(directionalLightHelper)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  meshes.forEach((mesh, i) => {
    mesh.rotation.y += 0.01
  })
  renderer.render(scene, camera)
}

window.addEventListener('resize', onResize)
function onResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
