<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">心率: {{ heartRate }} BPM</span>
      <input type="range" v-model="heartRate" min="40" max="180" step="5" class="control-range">
      <span class="panel-label">强度:</span>
      <input type="range" v-model="beatIntensity" min="0.5" max="3" step="0.1" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const heartRate = ref(75)
const beatIntensity = ref(1.5)

let scene, camera, renderer, animationId, controls
let heart, particles = [], clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 8)
  camera.lookAt(0, 0, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const ambient = new THREE.AmbientLight(0xff99aa, 0.6)
  scene.add(ambient)
  
  const pointLight = new THREE.PointLight(0xff6688, 1, 20)
  pointLight.position.set(2, 2, 2)
  scene.add(pointLight)
  
  const heartGeometry = createHeartGeometry()
  const heartMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4466,
    emissive: 0xff2244,
    emissiveIntensity: 0.3,
    metalness: 0.3,
    roughness: 0.4
  })
  heart = new THREE.Mesh(heartGeometry, heartMaterial)
  scene.add(heart)
  
  for (let i = 0; i < 100; i++) {
    const geom = new THREE.SphereGeometry(0.05, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0xff66aa,
      transparent: true,
      opacity: 0.8
    })
    const particle = new THREE.Mesh(geom, mat)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 1.5 + Math.random() * 1
    particle.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      Math.random() * 0.02 + 0.01,
      (Math.random() - 0.5) * 0.02
    )
    particle.userData.life = Math.random()
    scene.add(particle)
    particles.push(particle)
  }
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  clock = new THREE.Clock()
}

function createHeartGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0, -0.5, -1, -0.5, -1, 0)
  shape.bezierCurveTo(-1, 0.5, 0, 0.5, 0, 1)
  shape.bezierCurveTo(0, 0.5, 1, 0.5, 1, 0)
  shape.bezierCurveTo(1, -0.5, 0, -0.5, 0, 0)
  
  const extrudeSettings = {
    steps: 8,
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 5
  }
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.rotateX(-Math.PI / 2)
  geometry.center()
  geometry.scale(1.5, 1.5, 1.5)
  
  return geometry
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()
  
  const bps = heartRate.value / 60
  const beat = (Math.sin(time * bps * Math.PI * 2) + 1) / 2
  const scale = 1 + beat * 0.3 * beatIntensity.value
  
  heart.scale.set(scale, scale, scale)
  heart.material.emissiveIntensity = 0.3 + beat * 0.5
  
  particles.forEach(p => {
    p.position.add(p.userData.velocity)
    p.userData.life -= 0.005
    
    if (p.userData.life <= 0) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 1.2
      p.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      )
      p.userData.life = 1
      p.material.opacity = 0.8
    } else {
      p.material.opacity = p.userData.life * 0.8
    }
  })
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { cancelAnimationFrame(animationId); renderer.dispose() })
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #ff6b6b 0%, #c56cf0 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-range { width: 120px; cursor: pointer; }
</style>
