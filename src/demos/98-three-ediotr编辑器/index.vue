<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">对象:</span>
      <select v-model="selectedId" class="control-select">
        <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
      <button @click="addBox" class="control-btn">加Box</button>
      <button @click="addSphere" class="control-btn">加Sphere</button>
      <button @click="addCone" class="control-btn">加Cone</button>
      <button @click="removeSelected" class="control-btn" :disabled="!selectedObject">删除</button>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe" :disabled="!selectedObject">
        <span>线框</span>
      </label>
      <span class="panel-label">位置X:</span>
      <input type="range" v-model="px" min="-20" max="20" step="0.1" class="control-range" :disabled="!selectedObject">
      <span class="panel-value">{{ px.toFixed(1) }}</span>
      <span class="panel-label">位置Z:</span>
      <input type="range" v-model="pz" min="-20" max="20" step="0.1" class="control-range" :disabled="!selectedObject">
      <span class="panel-value">{{ pz.toFixed(1) }}</span>
      <span class="panel-label">旋转Y:</span>
      <input type="range" v-model="ry" min="-180" max="180" step="1" class="control-range" :disabled="!selectedObject">
      <span class="panel-value">{{ ry }}°</span>
      <span class="panel-label">缩放:</span>
      <input type="range" v-model="s" min="0.1" max="5" step="0.1" class="control-range" :disabled="!selectedObject">
      <span class="panel-value">{{ s.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const objects = ref([])
const selectedId = ref('')
const wireframe = ref(false)

const px = ref(0)
const pz = ref(0)
const ry = ref(0)
const s = ref(1)

let scene, camera, renderer, animationId, controls
let clock
let nextId = 1
let selectionBox
let raycaster
let pointer

const selectedObject = computed(() => objects.value.find((o) => o.id === selectedId.value)?.object ?? null)

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function disposeObject(obj) {
  obj.traverse?.((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    }
  })
}

function makeMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.25 })
}

function addObject(object, name) {
  object.userData.__editorId = String(nextId)
  objects.value.push({ id: String(nextId), name: `${name}-${nextId}`, object })
  nextId++
  scene.add(object)
  selectedId.value = object.userData.__editorId
}

function addBox() {
  const g = new THREE.BoxGeometry(2.2, 2.2, 2.2)
  const m = makeMaterial(0x667eea)
  const mesh = new THREE.Mesh(g, m)
  mesh.position.set((Math.random() - 0.5) * 10, 2.2, (Math.random() - 0.5) * 10)
  addObject(mesh, 'Box')
}

function addSphere() {
  const g = new THREE.SphereGeometry(1.4, 32, 32)
  const m = makeMaterial(0x4ecdc4)
  const mesh = new THREE.Mesh(g, m)
  mesh.position.set((Math.random() - 0.5) * 10, 2.2, (Math.random() - 0.5) * 10)
  addObject(mesh, 'Sphere')
}

function addCone() {
  const g = new THREE.ConeGeometry(1.6, 3.2, 32, 1)
  const m = makeMaterial(0xff4d6d)
  const mesh = new THREE.Mesh(g, m)
  mesh.position.set((Math.random() - 0.5) * 10, 2.2, (Math.random() - 0.5) * 10)
  addObject(mesh, 'Cone')
}

function removeSelected() {
  const obj = selectedObject.value
  if (!obj) return
  scene.remove(obj)
  disposeObject(obj)
  objects.value = objects.value.filter((o) => o.id !== selectedId.value)
  selectedId.value = objects.value[0]?.id ?? ''
}

function syncControlsFromSelection() {
  const obj = selectedObject.value
  if (!obj) return
  px.value = obj.position.x
  pz.value = obj.position.z
  ry.value = Math.round(THREE.MathUtils.radToDeg(obj.rotation.y))
  s.value = obj.scale.x
  wireframe.value = !!obj.material?.wireframe
}

function applyControlsToSelection() {
  const obj = selectedObject.value
  if (!obj) return
  obj.position.x = px.value
  obj.position.z = pz.value
  obj.rotation.y = THREE.MathUtils.degToRad(ry.value)
  obj.scale.setScalar(s.value)
  if (obj.material) obj.material.wireframe = wireframe.value
  selectionBox?.setFromObject(obj)
}

function onPointerDown(e) {
  if (!renderer || !camera) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
  raycaster.setFromCamera(pointer, camera)
  const meshes = objects.value.map((o) => o.object).filter(Boolean)
  const hits = raycaster.intersectObjects(meshes, true)
  if (!hits.length) return
  const root = hits[0].object
  let picked = root
  while (picked && !picked.userData.__editorId && picked.parent) picked = picked.parent
  const id = picked?.userData?.__editorId
  if (id) selectedId.value = id
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
  controls?.dispose?.()
  if (selectionBox) {
    scene.remove(selectionBox)
    selectionBox.geometry.dispose()
    selectionBox.material.dispose()
  }
  objects.value.forEach((o) => {
    scene.remove(o.object)
    disposeObject(o.object)
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 14, 26)
  camera.lookAt(0, 4, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(60, 60)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(60, 30, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 4, 0)

  selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0x00ffff)
  selectionBox.visible = false
  scene.add(selectionBox)

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()
  renderer.domElement.addEventListener('pointerdown', onPointerDown)

  addBox()
  addSphere()
  addCone()

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

function animate() {
  animationId = requestAnimationFrame(animate)
  if (animating) {
  clock.getDelta()

  const obj = selectedObject.value
  if (obj) {
    selectionBox.setFromObject(obj)
    selectionBox.visible = true
  } else {
    selectionBox.visible = false
  }
  renderer.render(scene, camera)
}
</script>

watch(selectedId, syncControlsFromSelection, { immediate: true })
watch([px, pz, ry, s, wireframe], applyControlsToSelection)

<style scoped>
.demo-wrapper {
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
  flex-wrap: wrap;
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
.control-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 56px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; max-width: 180px; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
