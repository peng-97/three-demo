<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">雾化类型:</span>
      <select v-model="fogType" class="control-select" @change="updateFog">
        <option value="none">无雾化</option>
        <option value="linear">线性雾化</option>
        <option value="exp">指数雾化</option>
        <option value="exp2">指数平方雾化</option>
      </select>
      <span class="panel-label">近:</span>
      <input type="range" v-model="fogNear" min="1" max="30" step="1" @input="updateFog" class="control-range" :disabled="fogType !== 'linear'">
      <span class="panel-label">远:</span>
      <input type="range" v-model="fogFar" min="10" max="80" step="1" @input="updateFog" class="control-range" :disabled="fogType !== 'linear'">
      <span class="panel-label">密度:</span>
      <input type="range" v-model="fogDensity" min="0.001" max="0.06" step="0.001" @input="updateFog" class="control-range" :disabled="fogType === 'none' || fogType === 'linear'">
      <span class="panel-value">{{ fogType === 'linear' ? `${fogNear}-${fogFar}` : fogDensity.toFixed(3) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const fogType = ref('linear')
const fogNear = ref(5)
const fogFar = ref(40)
const fogDensity = ref(0.02)

let scene, camera, renderer, animationId, controls
let objects = []
const fogColor = 0xcce0ff

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createTree(position) {
  const group = new THREE.Group()

  const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 2, 8)
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.position.y = 1
  trunk.castShadow = true
  group.add(trunk)

  const leafGeometry = new THREE.ConeGeometry(1, 2.5, 8)
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 })

  const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial)
  leaf1.position.y = 2.7
  leaf1.castShadow = true
  group.add(leaf1)

  const leaf2 = new THREE.Mesh(leafGeometry.clone(), leafMaterial)
  leaf2.scale.set(0.8, 0.8, 0.8)
  leaf2.position.y = 3.6
  leaf2.castShadow = true
  group.add(leaf2)

  const leaf3 = new THREE.Mesh(leafGeometry.clone(), leafMaterial)
  leaf3.scale.set(0.6, 0.6, 0.6)
  leaf3.position.y = 4.3
  leaf3.castShadow = true
  group.add(leaf3)

  group.position.copy(position)
  return group
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(fogColor)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 8, 20)
  camera.lookAt(0, 3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 40, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(100, 100)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90, roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 80
    const z = (Math.random() - 0.5) * 80
    const tree = createTree(new THREE.Vector3(x, 0, z))
    objects.push(tree)
    scene.add(tree)
  }

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24]
  for (let i = 0; i < 15; i++) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.4,
      metalness: 0.3
    })
    const box = new THREE.Mesh(geometry, material)
    box.position.set(
      (Math.random() - 0.5) * 40,
      0.75,
      (Math.random() - 0.5) * 40
    )
    box.castShadow = true
    box.receiveShadow = true
    objects.push(box)
    scene.add(box)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)
  controls.maxDistance = 60

  updateFog()
  window.addEventListener('resize', onResize)
}

function updateFog() {
  scene.fog = null

  if (fogType.value === 'linear') {
    const near = Math.min(fogNear.value, fogFar.value - 1)
    fogNear.value = near
    scene.fog = new THREE.Fog(fogColor, fogNear.value, fogFar.value)
  } else if (fogType.value === 'exp') {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity.value)
  } else if (fogType.value === 'exp2') {
    const d = fogDensity.value
    scene.fog = new THREE.FogExp2(fogColor, d * d)
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)

  objects.forEach((obj, index) => {
    if (obj.children.length > 0) {
      obj.rotation.y += 0.002
    }
  })

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  objects.forEach((obj) => {
    obj.traverse?.((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.()
        child.material?.dispose?.()
      }
    })
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})
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
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  min-width: 80px;
}

.control-select {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.control-range {
  width: 120px;
  cursor: pointer;
}
</style>
