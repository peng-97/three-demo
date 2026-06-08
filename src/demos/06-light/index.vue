<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, lights = [], mesh
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
  scene.background = new THREE.Color(0x000000)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 2, 6)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.7 })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]
  lightColors.forEach((color, i) => {
    const light = new THREE.PointLight(color, 0.8, 10)
    const angle = (i / lightColors.length) * Math.PI * 2
    light.position.set(Math.cos(angle) * 3, 1, Math.sin(angle) * 3)
    scene.add(light)
    lights.push(light)
    
    const sphereGeom = new THREE.SphereGeometry(0.1, 8, 8)
    const sphereMat = new THREE.MeshBasicMaterial({ color: color })
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    sphere.position.copy(light.position)
    scene.add(sphere)
  })
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x222222)
  scene.add(ambientLight)
 
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)


  const gridHelper = new THREE.GridHelper(10, 10)
  scene.add(gridHelper)



  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = Date.now() * 0.001
  mesh.rotation.x = time * 0.3
  mesh.rotation.y = time * 0.5
  lights.forEach((light, i) => {
    const angle = time + (i / lights.length) * Math.PI * 2
    light.position.x = Math.cos(angle) * 3
    light.position.z = Math.sin(angle) * 3
  })
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
})
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
