<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button
        v-for="(type, index) in extrudeTypes"
        :key="type"
        class="control-btn"
        :class="{ active: currentExtrudeIndex === index }"
        @click="switchExtrude(index)"
      >
        {{ type }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, currentMesh, controls

const extrudeTypes = ['拉伸矩形', '拉伸心形', '拉伸星形', '带洞的拉伸', '阶梯拉伸', '斜角拉伸']
const currentExtrudeIndex = ref(0)

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
  camera.position.set(5, 8, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  createExtrude(currentExtrudeIndex.value)
}

function createExtrude(index) {
  if (currentMesh) {
    scene.remove(currentMesh)
    if (currentMesh.geometry) currentMesh.geometry.dispose()
    if (currentMesh.material) currentMesh.material.dispose()
  }

  let shape, extrudeSettings, geometry, material

  switch (index) {
    case 0:
      shape = new THREE.Shape()
      shape.moveTo(-2, -1.5)
      shape.lineTo(2, -1.5)
      shape.lineTo(2, 1.5)
      shape.lineTo(-2, 1.5)
      shape.closePath()
      extrudeSettings = { steps: 2, depth: 3, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelOffset: 0, bevelSegments: 1 }
      break

    case 1:
      shape = new THREE.Shape()
      shape.moveTo(0, 0.5)
      shape.bezierCurveTo(0, 0.5, -2, 2, -2.5, 0)
      shape.bezierCurveTo(-2.5, -2, 0, -2, 0, -1)
      shape.bezierCurveTo(0, -2, 2.5, -2, 2.5, 0)
      shape.bezierCurveTo(2.5, 2, 0, 0.5, 0, 0.5)
      extrudeSettings = { steps: 2, depth: 2, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelOffset: 0, bevelSegments: 1 }
      break

    case 2:
      shape = new THREE.Shape()
      const starPts = [], numStarPoints = 5
      for (let i = 0; i < numStarPoints * 2; i++) {
        const l = i % 2 == 1 ? 2.5 : 1.2
        const a = i / numStarPoints * Math.PI
        starPts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l))
      }
      shape.moveTo(starPts[0].x, starPts[0].y)
      for (let i = 1; i < starPts.length; i++) {
        shape.lineTo(starPts[i].x, starPts[i].y)
      }
      shape.closePath()
      extrudeSettings = { steps: 2, depth: 2.5, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelOffset: 0, bevelSegments: 1 }
      break

    case 3:
      shape = new THREE.Shape()
      shape.moveTo(-3, -2)
      shape.lineTo(3, -2)
      shape.lineTo(3, 2)
      shape.lineTo(-3, 2)
      shape.closePath()
      const hole = new THREE.Path()
      hole.moveTo(-1, -1)
      hole.lineTo(1, -1)
      hole.lineTo(1, 1)
      hole.lineTo(-1, 1)
      hole.closePath()
      shape.holes.push(hole)
      extrudeSettings = { steps: 2, depth: 2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelOffset: 0, bevelSegments: 1 }
      break

    case 4:
      shape = new THREE.Shape()
      shape.moveTo(-2, -1.5)
      shape.lineTo(2, -1.5)
      shape.lineTo(2, 1.5)
      shape.lineTo(-2, 1.5)
      shape.closePath()
      extrudeSettings = { 
        steps: 4, 
        depth: 3, 
        bevelEnabled: false,
        extrudePath: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(2, 1, -1),
          new THREE.Vector3(0, 2, -2),
          new THREE.Vector3(-2, 1, -3)
        ])
      }
      break

    case 5:
      shape = new THREE.Shape()
      const hexSides = 6
      const hexPts = []
      for (let i = 0; i < hexSides; i++) {
        const a = (i / hexSides) * Math.PI * 2
        hexPts.push(new THREE.Vector2(Math.cos(a) * 2, Math.sin(a) * 2))
      }
      shape.moveTo(hexPts[0].x, hexPts[0].y)
      for (let i = 1; i < hexPts.length; i++) {
        shape.lineTo(hexPts[i].x, hexPts[i].y)
      }
      shape.closePath()
      extrudeSettings = { steps: 2, depth: 2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelOffset: 0, bevelSegments: 4 }
      break
  }

  geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.center()
  material = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.3, roughness: 0.7 })
  currentMesh = new THREE.Mesh(geometry, material)
  scene.add(currentMesh)
}

function switchExtrude(index) {
  currentExtrudeIndex.value = index
  createExtrude(index)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (currentMesh) {
    currentMesh.rotation.y += 0.01
  }
  controls.update()
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.control-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-btn.active {
  background: #ff6b6b;
  color: white;
}
</style>
