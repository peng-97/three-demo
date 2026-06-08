<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">浮窗大小:</span>
      <input type="range" v-model="widgetSize" min="0.5" max="3" step="0.1" class="control-range">
      <span class="panel-label">旋转速度:</span>
      <input type="range" v-model="rotationSpeed" min="0" max="3" step="0.1" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const widgetSize = ref(1)
const rotationSpeed = ref(1)

let scene, camera, renderer, animationId, controls
let floatingWidgets = []
let clock

function init() {
  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setClearColor(0x000000, 0)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf, 0xc56cf0]
  const widgetTypes = [
    () => new THREE.BoxGeometry(1, 1, 1),
    () => new THREE.SphereGeometry(0.6, 32, 32),
    () => new THREE.TorusGeometry(0.5, 0.2, 16, 100),
    () => new THREE.ConeGeometry(0.6, 1.2, 32),
    () => new THREE.OctahedronGeometry(0.7),
    () => new THREE.IcosahedronGeometry(0.6)
  ]

  for (let i = 0; i < 6; i++) {
    const geom = widgetTypes[i]()
    const mat = new THREE.MeshStandardMaterial({ 
      color: colors[i], 
      metalness: 0.3, 
      roughness: 0.5,
      transparent: true,
      opacity: 0.9
    })
    const widget = new THREE.Mesh(geom, mat)
    
    const angle = (i / 6) * Math.PI * 2
    widget.position.set(Math.cos(angle) * 5, 2 + Math.sin(i) * 0.5, Math.sin(angle) * 5)
    widget.userData = {
      angle: angle,
      radius: 5,
      yOffset: widget.position.y,
      type: i
    }
    
    scene.add(widget)
    floatingWidgets.push(widget)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([widgetSize, rotationSpeed], () => {
  floatingWidgets.forEach(widget => {
    widget.scale.setScalar(widgetSize.value)
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  floatingWidgets.forEach((widget, i) => {
    const newAngle = widget.userData.angle + time * rotationSpeed.value * 0.5
    const radius = widget.userData.radius + Math.sin(time * 2 + i) * 0.5
    
    widget.position.x = Math.cos(newAngle) * radius
    widget.position.z = Math.sin(newAngle) * radius
    widget.position.y = widget.userData.yOffset + Math.sin(time * 1.5 + i) * 0.8
    
    widget.rotation.x += 0.01 * rotationSpeed.value
    widget.rotation.y += 0.015 * rotationSpeed.value
    widget.rotation.z += 0.005 * rotationSpeed.value
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
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; }
.control-range { width: 100px; cursor: pointer; }
</style>
