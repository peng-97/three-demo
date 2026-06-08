<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="stats-overlay">
      <div class="stats-title">renderer.info</div>
      <pre class="stats-pre">{{ statsText }}</pre>
    </div>
    <div class="control-panel">
      <span class="panel-label">数量:</span>
      <input type="range" v-model="count" min="10" max="3000" step="10" class="control-range">
      <span class="panel-value">{{ count }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="useInstanced">
        <span>Instanced</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
      <button @click="rebuild" class="control-btn">重建</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const count = ref(600)
const useInstanced = ref(true)
const spinning = ref(true)
const statsText = ref('')

let scene, camera, renderer, animationId, controls
let clock
let group
let sharedGeometry, sharedMaterial
let instancedMesh
let lastStatsUpdate = 0
let fps = 0
let frameCount = 0
let frameAcc = 0

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

function gpuInfo() {
  const gl = renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  if (!ext) return null
  const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
  const rendererInfo = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
  return { vendor, renderer: rendererInfo }
}

function rebuild() {
  if (group) {
    scene.remove(group)
    disposeObject(group)
    group = null
  }
  if (instancedMesh) {
    scene.remove(instancedMesh)
    instancedMesh.geometry?.dispose?.()
    instancedMesh.material?.dispose?.()
    instancedMesh = null
  }
  sharedGeometry?.dispose?.()
  sharedMaterial?.dispose?.()

  sharedGeometry = new THREE.BoxGeometry(1, 1, 1)
  sharedMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.55, metalness: 0.15 })

  const n = count.value
  const dummy = new THREE.Object3D()

  if (useInstanced.value) {
    instancedMesh = new THREE.InstancedMesh(sharedGeometry, sharedMaterial, n)
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 50
      const y = 0.6 + Math.random() * 8
      const z = (Math.random() - 0.5) * 50
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const s = 0.4 + Math.random() * 1.2
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)
    }
    instancedMesh.instanceMatrix.needsUpdate = true
    scene.add(instancedMesh)
  } else {
    group = new THREE.Group()
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(sharedGeometry.clone(), sharedMaterial.clone())
      mesh.position.set((Math.random() - 0.5) * 50, 0.6 + Math.random() * 8, (Math.random() - 0.5) * 50)
      mesh.rotation.set(0, Math.random() * Math.PI * 2, 0)
      const s = 0.4 + Math.random() * 1.2
      mesh.scale.set(s, s, s)
      group.add(mesh)
    }
    scene.add(group)
  }
}

function updateStats() {
  const info = renderer.info
  const g = gpuInfo()
  const lines = [
    `fps: ${fps.toFixed(1)}`,
    `render.calls: ${info.render.calls}`,
    `render.triangles: ${info.render.triangles}`,
    `render.lines: ${info.render.lines}`,
    `render.points: ${info.render.points}`,
    `memory.geometries: ${info.memory.geometries}`,
    `memory.textures: ${info.memory.textures}`,
    `programs: ${info.programs?.length ?? 0}`,
    `instanced: ${useInstanced.value}`,
    `count: ${count.value}`
  ]
  if (g) {
    lines.push(`gpu: ${g.vendor} / ${g.renderer}`)
  }
  statsText.value = lines.join('\n')
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(30, 26, 42)
  camera.lookAt(0, 6, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
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

  rebuild()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    const delta = clock.getDelta()
    const t = clock.getElapsedTime()

    frameAcc += delta
    frameCount++
    if (frameAcc >= 0.5) {
      fps = frameCount / frameAcc
      frameAcc = 0
      frameCount = 0
    }

    if (spinning.value) {
      if (instancedMesh) instancedMesh.rotation.y = t * 0.18
      if (group) group.rotation.y = t * 0.18
    }

    if (clock.getElapsedTime() - lastStatsUpdate > 0.2) {
      lastStatsUpdate = clock.getElapsedTime()
      updateStats()
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
  if (group) {
    scene.remove(group)
    disposeObject(group)
  }
  if (instancedMesh) {
    scene.remove(instancedMesh)
    instancedMesh.geometry?.dispose?.()
    instancedMesh.material?.dispose?.()
  }
  sharedGeometry?.dispose?.()
  sharedMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch([count, useInstanced], rebuild)
</script>

<style scoped>
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.demo-container {
  flex: 1;
}
.stats-overlay {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 240px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  pointer-events: none;
}
.stats-title { color: rgba(255, 255, 255, 0.92); font-weight: 800; margin-bottom: 8px; }
.stats-pre { margin: 0; white-space: pre-wrap; color: rgba(255, 255, 255, 0.9); font-size: 12px; line-height: 1.35; }
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
.control-range { width: 140px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
