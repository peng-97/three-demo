<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="playAnimation" class="control-btn">播放</button>
      <button @click="pauseAnimation" class="control-btn">暂停</button>
      <button @click="resetAnimation" class="control-btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, controls
let mesh, mixer, action, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  mesh?.geometry?.dispose?.()
  mesh?.material?.dispose?.()
  mixer?.stopAllAction?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 3, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    roughness: 0.5,
    metalness: 0.3
  })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const cameraPositions = [
    new THREE.Vector3(0, 3, 10),
    new THREE.Vector3(8, 5, 6),
    new THREE.Vector3(-6, 4, -8),
    new THREE.Vector3(0, 6, -12),
    new THREE.Vector3(0, 3, 10)
  ]
  const target = new THREE.Vector3(0, 0, 0)
  const cameraQuaternions = cameraPositions.map((pos) => {
    const tempCamera = new THREE.PerspectiveCamera()
    tempCamera.position.copy(pos)
    tempCamera.lookAt(target)
    return tempCamera.quaternion.clone()
  })

  const times = [0, 1, 2, 3, 4]
  const positionValues = cameraPositions.flatMap((v) => [v.x, v.y, v.z])
  const quaternionValues = cameraQuaternions.flatMap((q) => [q.x, q.y, q.z, q.w])

  const positionKF = new THREE.VectorKeyframeTrack('.position', times, positionValues)
  const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, quaternionValues)
  const fovKF = new THREE.NumberKeyframeTrack('.fov', [0, 2, 4], [75, 55, 75])

  const clip = new THREE.AnimationClip('CameraMove', 4, [positionKF, rotationKF, fovKF])
  mixer = new THREE.AnimationMixer(camera)
  action = mixer.clipAction(clip)
  action.setLoop(THREE.LoopRepeat)
  
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function playAnimation() {
  action.play()
}

function pauseAnimation() {
  action.paused = !action.paused
}

function resetAnimation() {
  action.stop()
  action.reset()
  camera.position.set(0, 3, 10)
  camera.lookAt(0, 0, 0)
  camera.fov = 75
  camera.updateProjectionMatrix()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (mixer) mixer.update(delta)
  if (camera) camera.updateProjectionMatrix()
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
</style>
