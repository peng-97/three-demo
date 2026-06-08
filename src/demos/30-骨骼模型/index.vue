<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="switchAnimation" class="control-btn">当前: {{ currentAnimation }}</button>
      <button @click="toggleAnimation" class="control-btn">{{ isPlaying ? '暂停' : '播放' }}</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const isPlaying = ref(true)
const speed = ref(1)
const currentAnimation = ref('走路')

let scene, camera, renderer, animationId, controls
let skeletonHelper, bones = {}, mesh
let clock, animationIndex = 0
const animations = ['走路', '挥手', '跳跃', '跳舞']

function createBone(name, length, color, parent) {
  const geometry = new THREE.BoxGeometry(0.3, length, 0.3)
  const material = new THREE.MeshStandardMaterial({ color: color })
  const boneMesh = new THREE.Mesh(geometry, material)
  
  const bone = new THREE.Bone()
  bone.add(boneMesh)
  boneMesh.position.y = length / 2
  bone.userData = { length: length }
  
  if (parent) parent.add(bone)
  bones[name] = bone
  return bone
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(8, 6, 12)
  camera.lookAt(0, 3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  const root = new THREE.Bone()
  scene.add(root)

  const hip = createBone('hip', 0.2, 0x667eea, root)
  hip.position.y = 4

  const spine = createBone('spine', 1.8, 0x4ecdc4, hip)

  const head = createBone('head', 1, 0xfeca57, spine)
  
  const shoulderL = createBone('shoulderL', 0.1, 0xff6b6b, spine)
  shoulderL.position.set(-0.8, 1.5, 0)
  shoulderL.rotation.z = 0.3
  
  const shoulderR = createBone('shoulderR', 0.1, 0xff6b6b, spine)
  shoulderR.position.set(0.8, 1.5, 0)
  shoulderR.rotation.z = -0.3

  const armL = createBone('armL', 1.5, 0xff9f43, shoulderL)
  const armR = createBone('armR', 1.5, 0xff9f43, shoulderR)

  const forearmL = createBone('forearmL', 1.2, 0xff6b6b, armL)
  const forearmR = createBone('forearmR', 1.2, 0xff6b6b, armR)

  const hipL = createBone('hipL', 0.3, 0xc56cf0, hip)
  hipL.position.set(-0.5, 0, 0)
  
  const hipR = createBone('hipR', 0.3, 0xc56cf0, hip)
  hipR.position.set(0.5, 0, 0)

  const legL = createBone('legL', 2, 0x5f27cd, hipL)
  const legR = createBone('legR', 2, 0x5f27cd, hipR)

  const shinL = createBone('shinL', 1.8, 0x341f97, legL)
  const shinR = createBone('shinR', 1.8, 0x341f97, legR)

  skeletonHelper = new THREE.SkeletonHelper(root)
  skeletonHelper.material.linewidth = 3
  scene.add(skeletonHelper)

  const floorGeometry = new THREE.PlaneGeometry(30, 30)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, metalness: 0.3, roughness: 0.8 })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  clock = new THREE.Clock()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)
}

function walkAnimation(time) {
  const s = Math.sin(time * 2 * speed.value)
  const c = Math.cos(time * 2 * speed.value)
  
  bones.legL.rotation.x = s * 0.6
  bones.legR.rotation.x = -s * 0.6
  bones.shinL.rotation.x = Math.abs(s) * 0.5
  bones.shinR.rotation.x = Math.abs(s) * 0.5
  
  bones.armL.rotation.x = -s * 0.4
  bones.armR.rotation.x = s * 0.4
  
  bones.spine.position.y = 4 + Math.abs(s) * 0.1
  bones.hip.rotation.z = c * 0.05
}

function waveAnimation(time) {
  const s = Math.sin(time * 3 * speed.value)
  
  bones.shoulderR.rotation.z = -0.3 - 0.8
  bones.armR.rotation.x = s * 0.5 - 0.5
  bones.forearmR.rotation.x = s * 0.8
  
  bones.armL.rotation.x = 0.1 * Math.sin(time)
}

function jumpAnimation(time) {
  const s = Math.sin(time * 2 * speed.value)
  const bounce = Math.abs(Math.sin(time * speed.value))
  
  bones.hip.position.y = 4 + bounce * 2
  bones.legL.rotation.x = -bounce * 1
  bones.legR.rotation.x = -bounce * 1
  bones.shinL.rotation.x = bounce * 1
  bones.shinR.rotation.x = bounce * 1
  
  bones.armL.rotation.x = -bounce * 0.8
  bones.armR.rotation.x = -bounce * 0.8
}

function danceAnimation(time) {
  const s1 = Math.sin(time * 2.5 * speed.value)
  const s2 = Math.sin(time * 4 * speed.value)
  const c = Math.cos(time * 1.5 * speed.value)
  
  bones.hip.rotation.z = s1 * 0.3
  bones.hip.rotation.y = c * 0.2
  bones.spine.rotation.z = s1 * 0.2
  
  bones.armL.rotation.x = s1 * 0.5
  bones.armR.rotation.x = -s1 * 0.5
  bones.forearmL.rotation.x = s2 * 0.6
  bones.forearmR.rotation.x = -s2 * 0.6
  
  bones.legL.rotation.z = s2 * 0.2
  bones.legR.rotation.z = -s2 * 0.2
  bones.shinL.rotation.x = -Math.abs(s1) * 0.3
  bones.shinR.rotation.x = -Math.abs(s1) * 0.3
}

function switchAnimation() {
  animationIndex = (animationIndex + 1) % animations.length
  currentAnimation.value = animations[animationIndex]
  
  Object.values(bones).forEach(b => {
    b.rotation.set(0, 0, 0)
    b.position.set(0, 0, 0)
  })
  
  bones.hip.position.y = 4
  bones.shoulderL.position.set(-0.8, 1.5, 0)
  bones.shoulderL.rotation.z = 0.3
  bones.shoulderR.position.set(0.8, 1.5, 0)
  bones.shoulderR.rotation.z = -0.3
  bones.hipL.position.set(-0.5, 0, 0)
  bones.hipR.position.set(0.5, 0, 0)
}

function toggleAnimation() {
  isPlaying.value = !isPlaying.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (isPlaying.value) {
    const time = clock.getElapsedTime()
    switch (animationIndex) {
      case 0: walkAnimation(time); break
      case 1: waveAnimation(time); break
      case 2: jumpAnimation(time); break
      case 3: danceAnimation(time); break
    }
  }
  
  skeletonHelper.update()
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
  min-width: 50px;
}

.control-range {
  width: 100px;
  cursor: pointer;
}

.control-btn {
  padding: 10px 20px;
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
</style>
