<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">选择动画:</span>
      <select v-model="currentAnim" class="control-select">
        <option value="idle">Idle</option>
        <option value="walk">Walk</option>
        <option value="dance">Dance</option>
        <option value="wave">Wave</option>
      </select>
      <span class="panel-label">进度:</span>
      <input type="range" v-model="animProgress" min="0" max="100" step="1" class="control-range">
      <span class="panel-value">{{ animProgress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const currentAnim = ref('idle')
const animProgress = ref(0)

let scene, camera, renderer, animationId, controls
let bones = {}

function createBoneSegment(name, length, width, color, parent, pos) {
  const geometry = new THREE.BoxGeometry(width, length, width)
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5 })
  const mesh = new THREE.Mesh(geometry, material)
  const bone = new THREE.Bone()
  bone.add(mesh)
  mesh.position.y = length / 2
  if (parent) parent.add(bone)
  if (pos) bone.position.copy(pos)
  return { bone, mesh }
}

const animations = {
  idle(t) {
    bones.torso.rotation.x = 0
    bones.torso.rotation.z = Math.sin(t * 2) * 0.05
    bones.head.rotation.y = Math.sin(t) * 0.2
  },
  walk(t) {
    bones.torso.rotation.x = Math.sin(t * 2) * 0.1
    bones.torso.rotation.z = Math.sin(t) * 0.05
    bones.hipL.rotation.x = Math.sin(t * 2) * 0.7
    bones.hipR.rotation.x = Math.sin(t * 2 + Math.PI) * 0.7
    bones.shoulderL.rotation.z = 0.2 + Math.sin(t * 2 + Math.PI) * 0.5
    bones.shoulderR.rotation.z = -0.2 - Math.sin(t * 2) * 0.5
  },
  dance(t) {
    bones.torso.rotation.x = Math.sin(t * 2) * 0.3
    bones.torso.rotation.z = Math.sin(t * 1.5) * 0.2
    bones.torso.rotation.y = Math.sin(t) * 0.4
    bones.shoulderL.rotation.z = Math.sin(t * 3) * 0.8
    bones.shoulderR.rotation.z = -Math.sin(t * 3) * 0.8
  },
  wave(t) {
    bones.torso.rotation.z = Math.sin(t) * 0.05
    bones.shoulderR.rotation.z = -0.5 - Math.sin(t * 3) * 0.6
    bones.armR.rotation.x = Math.sin(t * 4) * 0.4
  }
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 10, 20)
  camera.lookAt(0, 5, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)
  
  const grid = new THREE.GridHelper(40, 40, 0x444466, 0x222233)
  scene.add(grid)
  
  const root = new THREE.Bone()
  
  const torso = createBoneSegment('torso', 5, 2, 0x667eea, root, new THREE.Vector3(0, 5, 0))
  const head = createBoneSegment('head', 2.5, 1.8, 0x4ecdc4, torso.bone, new THREE.Vector3(0, 5, 0))
  const shoulderL = createBoneSegment('shoulderL', 0.5, 1, 0xff6b6b, torso.bone, new THREE.Vector3(-1.8, 4, 0))
  const armL = createBoneSegment('armL', 3, 0.8, 0xff9f43, shoulderL.bone, new THREE.Vector3(0, 0, 0))
  const shoulderR = createBoneSegment('shoulderR', 0.5, 1, 0xff6b6b, torso.bone, new THREE.Vector3(1.8, 4, 0))
  const armR = createBoneSegment('armR', 3, 0.8, 0xff9f43, shoulderR.bone, new THREE.Vector3(0, 0, 0))
  const hipL = createBoneSegment('hipL', 0.5, 1.2, 0xc56cf0, torso.bone, new THREE.Vector3(-0.9, 0, 0))
  const legL = createBoneSegment('legL', 4, 1, 0x5f27cd, hipL.bone, new THREE.Vector3(0, 0, 0))
  const hipR = createBoneSegment('hipR', 0.5, 1.2, 0xc56cf0, torso.bone, new THREE.Vector3(0.9, 0, 0))
  const legR = createBoneSegment('legR', 4, 1, 0x5f27cd, hipR.bone, new THREE.Vector3(0, 0, 0))
  
  bones = {
    torso: torso.bone,
    head: head.bone,
    shoulderL: shoulderL.bone,
    armL: armL.bone,
    shoulderR: shoulderR.bone,
    armR: armR.bone,
    hipL: hipL.bone,
    legL: legL.bone,
    hipR: hipR.bone,
    legR: legR.bone
  }
  
  scene.add(root)
  const skeletonHelper = new THREE.SkeletonHelper(root)
  skeletonHelper.material.linewidth = 2
  scene.add(skeletonHelper)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)
}

let time = 0
function animate() {
  animationId = requestAnimationFrame(animate)
  time += 0.02
  
  Object.values(bones).forEach(b => { b.rotation.set(0,0,0) })
  
  const t = (animProgress.value / 100) * Math.PI * 4
  animations[currentAnim.value](t)
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { cancelAnimationFrame(animationId); renderer.dispose() })
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; font-size: 1rem; min-width: 50px; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 120px; cursor: pointer; }
</style>
