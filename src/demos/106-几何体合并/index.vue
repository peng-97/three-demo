<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="useMerge">
        <span>合并几何体</span>
      </label>
      <span class="panel-label">数量:</span>
      <input type="range" v-model="count" min="10" max="800" step="10" class="control-range">
      <span class="panel-value">{{ count }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
      <button @click="rebuild" class="control-btn">重建</button>
      <span class="panel-label">DrawCalls:</span>
      <span class="panel-value">{{ drawCalls }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const container = ref(null)
const useMerge = ref(true)
const count = ref(200)
const wireframe = ref(false)
const spinning = ref(true)
const drawCalls = ref(1)

let scene, camera, renderer, animationId, controls
let clock
let mergedMesh, separateGroup
let baseGeometry

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function disposeObject(obj) {
  if (!obj) return
  obj.traverse?.((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    }
  })
}

function rebuild() {
  if (mergedMesh) {
    scene.remove(mergedMesh)
    mergedMesh.geometry?.dispose?.()
    mergedMesh.material?.dispose?.()
    mergedMesh = null
  }
  if (separateGroup) {
    scene.remove(separateGroup)
    disposeObject(separateGroup)
    separateGroup = null
  }

  const n = count.value
  const dummy = new THREE.Object3D()
  const rand = () => Math.random()

  if (useMerge.value) {
    const geometries = []
    for (let i = 0; i < n; i++) {
      const g = baseGeometry.clone()
      dummy.position.set((rand() - 0.5) * 36, 1 + rand() * 10, (rand() - 0.5) * 36)
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      const s = 0.4 + rand() * 1.2
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      g.applyMatrix4(dummy.matrix)

      const c = new THREE.Color().setHSL(rand(), 0.8, 0.6)
      const colorAttr = new Float32Array(g.attributes.position.count * 3)
      for (let k = 0; k < g.attributes.position.count; k++) {
        const k3 = k * 3
        colorAttr[k3 + 0] = c.r
        colorAttr[k3 + 1] = c.g
        colorAttr[k3 + 2] = c.b
      }
      g.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3))
      geometries.push(g)
    }

    const merged = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    merged.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15, wireframe: wireframe.value })
    mergedMesh = new THREE.Mesh(merged, mat)
    scene.add(mergedMesh)
    drawCalls.value = 1
  } else {
    separateGroup = new THREE.Group()
    for (let i = 0; i < n; i++) {
      const g = baseGeometry.clone()
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(rand(), 0.8, 0.6),
        roughness: 0.55,
        metalness: 0.15,
        wireframe: wireframe.value
      })
      const m = new THREE.Mesh(g, mat)
      m.position.set((rand() - 0.5) * 36, 1 + rand() * 10, (rand() - 0.5) * 36)
      m.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      const s = 0.4 + rand() * 1.2
      m.scale.set(s, s, s)
      separateGroup.add(m)
    }
    scene.add(separateGroup)
    drawCalls.value = n
  }
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 18, 32)
  camera.lookAt(0, 6, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(80, 80)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const grid = new THREE.GridHelper(80, 40, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 6, 0)

  baseGeometry = new THREE.IcosahedronGeometry(1, 0)
  clock = new THREE.Clock()
  rebuild()

  window.addEventListener('resize', onResize)
  const tick = () => {
    animationId = requestAnimationFrame(tick)
    const t = clock.getElapsedTime()
    if (spinning.value) {
      if (mergedMesh) mergedMesh.rotation.y = t * 0.18
      if (separateGroup) separateGroup.rotation.y = t * 0.18
    }
    controls.update()
    renderer.render(scene, camera)
  }
  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  if (mergedMesh) {
    scene.remove(mergedMesh)
    mergedMesh.geometry?.dispose?.()
    mergedMesh.material?.dispose?.()
  }
  if (separateGroup) {
    scene.remove(separateGroup)
    disposeObject(separateGroup)
  }
  baseGeometry?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch([useMerge, count, wireframe], rebuild)
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
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 60px; text-align: right; }
.control-range { width: 130px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
