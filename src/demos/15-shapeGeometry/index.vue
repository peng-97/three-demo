<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button
        v-for="(type, index) in shapeTypes"
        :key="type"
        class="control-btn"
        :class="{ active: currentShapeIndex === index }"
        @click="switchShape(index)"
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

const shapeTypes = ['矩形', '三角形', '圆角矩形', '心形', '星形', '多边形']
const currentShapeIndex = ref(0)

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
  camera.position.set(0, 5, 10)

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

  createShape(currentShapeIndex.value)
}

function createShape(index) {
  if (currentMesh) {
    scene.remove(currentMesh)
    if (currentMesh.geometry) currentMesh.geometry.dispose()
    if (currentMesh.material) currentMesh.material.dispose()
  }

  let shape, geometry, material

  switch (index) {
    case 0:
      shape = new THREE.Shape()
      shape.moveTo(-3, -2)
      shape.lineTo(3, -2)
      shape.lineTo(3, 2)
      shape.lineTo(-3, 2)
      shape.closePath()
      break

    case 1:
      shape = new THREE.Shape()
      shape.moveTo(0, 3)
      shape.lineTo(3, -2)
      shape.lineTo(-3, -2)
      shape.closePath()
      break

    case 2:
      const x = -3
      const y = -2
      const width = 6
      const height = 4
      const radius = 0.8
      shape = new THREE.Shape()
      shape.moveTo(x, y + radius)
      shape.lineTo(x, y + height - radius)
      shape.quadraticCurveTo(x, y + height, x + radius, y + height)
      shape.lineTo(x + width - radius, y + height)
      shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
      shape.lineTo(x + width, y + radius)
      shape.quadraticCurveTo(x + width, y, x + width - radius, y)
      shape.lineTo(x + radius, y)
      shape.quadraticCurveTo(x, y, x, y + radius)
      break

    case 3:
      shape = new THREE.Shape()
      shape.moveTo(0, 0.5)
      shape.bezierCurveTo(0, 0.5, -2, 2, -2.5, 0)
      shape.bezierCurveTo(-2.5, -2, 0, -2, 0, -1)
      shape.bezierCurveTo(0, -2, 2.5, -2, 2.5, 0)
      shape.bezierCurveTo(2.5, 2, 0, 0.5, 0, 0.5)
      break

    case 4:
      shape = new THREE.Shape()
      const pts = [], numPts = 5
      for (let i = 0; i < numPts * 2; i++) {
        const l = i % 2 == 1 ? 3 : 1.5
        const a = i / numPts * Math.PI
        pts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l))
      }
      shape.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i].x, pts[i].y)
      }
      shape.closePath()
      break

    case 5:
      shape = new THREE.Shape()
      const sides = 6
      const hexPts = []
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2
        hexPts.push(new THREE.Vector2(Math.cos(a) * 2.5, Math.sin(a) * 2.5))
      }
      shape.moveTo(hexPts[0].x, hexPts[0].y)
      for (let i = 1; i < hexPts.length; i++) {
        shape.lineTo(hexPts[i].x, hexPts[i].y)
      }
      shape.closePath()
      break
  }

  geometry = new THREE.ShapeGeometry(shape)
  material = new THREE.MeshStandardMaterial({ color: 0x667eea, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.7 })
  currentMesh = new THREE.Mesh(geometry, material)
  scene.add(currentMesh)
}

function switchShape(index) {
  currentShapeIndex.value = index
  createShape(index)
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
