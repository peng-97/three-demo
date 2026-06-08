<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">动画: {{ currentClip }}</span>
      <button @click="prevClip" class="control-btn">&lt;</button>
      <button @click="nextClip" class="control-btn">&gt;</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="timeScale" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ timeScale.toFixed(1) }}</span>
      <button @click="toggleLoop" class="control-btn">{{ loop ? '循环开' : '循环关'}}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const currentClip = ref('空闲')
const timeScale = ref(1)
const loop = ref(true)

let scene, camera, renderer, animationId, controls
let mixer, clock, bones = {}
let currentClipIndex = 0
const clipNames = ['空闲', '走路', '跑步', '挥手', '跳舞', '出拳', '跳跃', '鞠躬']

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

  const skeletonHelper = new THREE.SkeletonHelper(root)
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

function idleAnimation(t, time) {
  const s = Math.sin(time * 1.5 * timeScale.value)
  bones.spine.position.y = 4 + s * 0.05
  bones.head.rotation.z = s * 0.03
  bones.armL.rotation.x = Math.sin(time * 2) * 0.05
  bones.armR.rotation.x = -Math.sin(time * 2) * 0.05
}

function walkAnimation(t, time) {
  const s = Math.sin(time * 2 * timeScale.value)
  const c = Math.cos(time * 2 * timeScale.value)
  
  bones.legL.rotation.x = s * 0.6
  bones.legR.rotation.x = -s * 0.6
  bones.shinL.rotation.x = Math.abs(s) * 0.5
  bones.shinR.rotation.x = Math.abs(s) * 0.5
  bones.armL.rotation.x = -s * 0.4
  bones.armR.rotation.x = s * 0.4
  bones.spine.position.y = 4 + Math.abs(s) * 0.1
  bones.hip.rotation.z = c * 0.05
}

function runAnimation(t, time) {
  const s = Math.sin(time * 3 * timeScale.value)
  const c = Math.cos(time * 3 * timeScale.value)
  
  bones.legL.rotation.x = s * 0.8
  bones.legR.rotation.x = -s * 0.8
  bones.shinL.rotation.x = Math.abs(s) * 0.7
  bones.shinR.rotation.x = Math.abs(s) * 0.7
  bones.armL.rotation.x = -s * 0.6
  bones.armR.rotation.x = s * 0.6
  bones.spine.position.y = 4 + Math.abs(s) * 0.15
  bones.hip.rotation.z = c * 0.08
  bones.hip.position.y = 4 + Math.abs(s) * 0.2
}

function waveAnimation(t, time) {
  const s = Math.sin(time * 3 * timeScale.value)
  bones.shoulderR.rotation.z = -0.3 - 0.8
  bones.armR.rotation.x = s * 0.5 - 0.5
  bones.forearmR.rotation.x = s * 0.8
  bones.armL.rotation.x = 0.1 * Math.sin(time)
  bones.spine.rotation.z = s * 0.05
  bones.head.rotation.y = 0.2
}

function danceAnimation(t, time) {
  const s1 = Math.sin(time * 2.5 * timeScale.value)
  const s2 = Math.sin(time * 4 * timeScale.value)
  const c = Math.cos(time * 1.5 * timeScale.value)
  
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
  bones.hip.position.y = 4 + Math.abs(s1) * 0.15
}

function punchAnimation(t, time) {
  const s = Math.sin(time * 4 * timeScale.value)
  const punch = Math.max(0, s)
  
  bones.armR.rotation.z = -punch * 1
  bones.forearmR.rotation.x = -punch * 0.8
  bones.spine.rotation.y = punch * 0.3
  bones.hip.rotation.y = punch * 0.1
}

function jumpAnimation(t, time) {
  const s = Math.sin(time * 2 * timeScale.value)
  const bounce = Math.abs(Math.sin(time * timeScale.value))
  
  bones.hip.position.y = 4 + bounce * 2
  bones.legL.rotation.x = -bounce * 1
  bones.legR.rotation.x = -bounce * 1
  bones.shinL.rotation.x = bounce * 1
  bones.shinR.rotation.x = bounce * 1
  bones.armL.rotation.x = -bounce * 0.8
  bones.armR.rotation.x = -bounce * 0.8
}

function bowAnimation(t, time) {
  const s = Math.sin(time * 1.5 * timeScale.value)
  const bow = Math.abs(s)
  bones.spine.rotation.x = bow * 0.6
  bones.armL.rotation.z = -bow * 0.5
  bones.armR.rotation.z = bow * 0.5
  bones.legL.rotation.x = bow * 0.2
  bones.legR.rotation.x = bow * 0.2
}

function resetPose() {
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

function prevClip() {
  currentClipIndex = (currentClipIndex - 1 + clipNames.length) % clipNames.length
  currentClip.value = clipNames[currentClipIndex]
  resetPose()
}

function nextClip() {
  currentClipIndex = (currentClipIndex + 1) % clipNames.length
  currentClip.value = clipNames[currentClipIndex]
  resetPose()
}

function toggleLoop() {
  loop.value = !loop.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = clock.getElapsedTime()
  const t = (time * timeScale.value) % 4
  
  switch (currentClipIndex) {
    case 0: idleAnimation(t, time); break
    case 1: walkAnimation(t, time); break
    case 2: runAnimation(t, time); break
    case 3: waveAnimation(t, time); break
    case 4: danceAnimation(t, time); break
    case 5: punchAnimation(t, time); break
    case 6: jumpAnimation(t, time); break
    case 7: bowAnimation(t, time); break
  }
  
  scene.traverse(obj => { if (obj.isSkeletonHelper) obj.update() })
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
