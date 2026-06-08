<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, mesh, originalPositions

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
  scene.background = new THREE.Color(0x1a1a1a)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const geometry = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4)
  originalPositions = geometry.attributes.position.array.slice()
  const material = new THREE.MeshNormalMaterial({ wireframe: false })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  const controls = new OrbitControls(camera, renderer.domElement)

  scene.add(controls)
  controls.update()

}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = Date.now() * 0.001
  const positions = mesh.geometry.attributes.position

  for (let i = 0; i < positions.count; i++) {
    const x = originalPositions[i * 3]
    const y = originalPositions[i * 3 + 1]
    const z = originalPositions[i * 3 + 2]

    const noise = Math.sin(time + x * 2) * 0.1 + Math.sin(time + y * 3) * 0.1

    positions.setX(i, x + noise)
    positions.setY(i, y + noise)
    positions.setZ(i, z + noise)
  }

  positions.needsUpdate = true
  mesh.rotation.x += 0.005
  mesh.rotation.y += 0.01

  renderer.render(scene, camera)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
