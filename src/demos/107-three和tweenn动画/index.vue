<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="playAnimation" class="control-btn">▶ 播放动画</button>
      <button @click="stopAnimation" class="control-btn">⬛ 停止</button>
      <button @click="resetObjects" class="control-btn">↻ 重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)

let scene, camera, renderer, animationId, controls
let objects = [], activeTweens = []
let ground = null

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createObject(type, color, position) {
  let geometry
  switch (type) {
    case 'box':
      geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
      break
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.8, 32, 32)
      break
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 32)
      break
    case 'torus':
      geometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100)
      break
  }
  
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.3
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  mesh.userData.initialPosition = position.clone()
  mesh.userData.initialRotation = new THREE.Euler()
  mesh.userData.initialScale = new THREE.Vector3(1, 1, 1)
  
  return mesh
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 8, 18)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(30, 30)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9 })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const objectConfigs = [
    { type: 'box', color: 0xff6b6b, pos: new THREE.Vector3(-8, 0.8, 5) },
    { type: 'sphere', color: 0x4ecdc4, pos: new THREE.Vector3(-3, 0.8, 5) },
    { type: 'cylinder', color: 0x667eea, pos: new THREE.Vector3(3, 0.9, 5) },
    { type: 'torus', color: 0xf9ca24, pos: new THREE.Vector3(8, 0.8, 5) }
  ]

  objectConfigs.forEach(config => {
    const obj = createObject(config.type, config.color, config.pos)
    obj.castShadow = true
    obj.receiveShadow = true
    objects.push(obj)
    scene.add(obj)
  })
}

function playAnimation() {
  stopAnimation()
  activeTweens = []

  objects.forEach((obj, index) => {
    const tween = new TWEEN.Tween(obj.position)
      .to({ y: obj.position.y + 5 }, 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .yoyo(true)
      .repeat(Infinity)
      .delay(index * 200)

    const rotTween = new TWEEN.Tween(obj.rotation)
      .to({ y: obj.rotation.y + Math.PI * 2 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .repeat(Infinity)

    const scaleTween = new TWEEN.Tween(obj.scale)
      .to({ x: 1.5, y: 1.5, z: 1.5 }, 1000)
      .easing(TWEEN.Easing.Elastic.Out)
      .yoyo(true)
      .repeat(Infinity)
      .delay(index * 150 + 500)

    tween.start()
    rotTween.start()
    scaleTween.start()

    activeTweens.push(tween, rotTween, scaleTween)
  })
}

function stopAnimation() {
  activeTweens.forEach(tween => tween.stop())
  activeTweens = []
}

function resetObjects() {
  stopAnimation()
  objects.forEach(obj => {
    obj.position.copy(obj.userData.initialPosition)
    obj.rotation.copy(obj.userData.initialRotation)
    obj.scale.copy(obj.userData.initialScale)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  TWEEN.update()
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
  animate()
})

onUnmounted(() => {
  stopAnimation()
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  objects.forEach((o) => {
    o.geometry?.dispose?.()
    o.material?.dispose?.()
    scene.remove(o)
  })
  objects = []
  if (ground) {
    ground.geometry?.dispose?.()
    ground.material?.dispose?.()
    scene.remove(ground)
    ground = null
  }
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
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.control-btn {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
