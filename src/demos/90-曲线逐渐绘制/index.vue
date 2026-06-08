<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">曲线:</span>
      <select v-model="curveType" class="control-select">
        <option value="heart">心形</option>
        <option value="helix">螺旋</option>
        <option value="sine">波浪</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="showTube">
        <span>管道</span>
      </label>
      <span class="panel-label">进度:</span>
      <input type="range" v-model="progress" min="0" max="1" step="0.001" class="control-range" :disabled="autoPlay">
      <span class="panel-value">{{ progress.toFixed(3) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="autoPlay">
        <span>自动</span>
      </label>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="3" step="0.1" class="control-range" :disabled="!autoPlay">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">采样:</span>
      <input type="range" v-model="segments" min="80" max="1400" step="20" class="control-range">
      <span class="panel-value">{{ segments }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const curveType = ref('sine')
const showTube = ref(false)
const progress = ref(0.35)
const autoPlay = ref(true)
const speed = ref(1.0)
const segments = ref(700)
const tubeRadius = ref(0.14)

let scene, camera, renderer, animationId, controls
let currentMesh, movingSphere, clock
let activeCurve

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createCurve() {
  if (curveType.value === 'heart') {
    const pts = []
    const n = 240
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = 16 * Math.pow(Math.sin(a), 3)
      const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
      pts.push(new THREE.Vector3(x * 0.18, (y * 0.18) / 2.2 + 2, 0))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.2)
  }

  if (curveType.value === 'helix') {
    const pts = []
    const turns = 3
    const n = 520
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const angle = t * Math.PI * 2 * turns
      const radius = 5
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = 2 + (t - 0.5) * 9
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
  }

  const pts = []
  const n = 260
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = (t - 0.5) * 18
    const y = 2 + Math.sin(t * Math.PI * 6) * 2.2
    const z = Math.cos(t * Math.PI * 4) * 4
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

function applyProgress() {
  if (!currentMesh) return
  if (currentMesh.isLine) {
    const vertexCount = currentMesh.geometry.attributes.position.count
    const drawCount = Math.max(2, Math.floor(vertexCount * progress.value))
    currentMesh.geometry.setDrawRange(0, drawCount)
  } else if (currentMesh.isMesh && currentMesh.material?.userData?.shader) {
    currentMesh.material.userData.shader.uniforms.uProgress.value = progress.value
  }
  if (activeCurve && movingSphere) movingSphere.position.copy(activeCurve.getPointAt(progress.value))
}

function rebuild() {
  if (currentMesh) {
    scene.remove(currentMesh)
    disposeObject(currentMesh)
    currentMesh = null
  }

  activeCurve = createCurve()

  if (showTube.value) {
    const geom = new THREE.TubeGeometry(activeCurve, Math.max(80, Math.floor(segments.value / 2)), tubeRadius.value, 18, activeCurve.closed)
    const mat = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.55, metalness: 0.2 })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uProgress = { value: progress.value }
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec2 vCustomUv;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vCustomUv = uv;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uProgress;
        varying vec2 vCustomUv;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `
        if (vCustomUv.x > uProgress) discard;
        #include <output_fragment>
        `
      )
      mat.userData.shader = shader
    }
    mat.needsUpdate = true
    currentMesh = new THREE.Mesh(geom, mat)
  } else {
    const pts = activeCurve.getPoints(segments.value)
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    geom.setDrawRange(0, 2)
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff })
    currentMesh = new THREE.Line(geom, mat)
  }

  scene.add(currentMesh)
  applyProgress()
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(currentMesh)
  disposeObject(movingSphere)
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 10, 18)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const sphereGeom = new THREE.SphereGeometry(0.3, 32, 32)
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b })
  movingSphere = new THREE.Mesh(sphereGeom, sphereMat)
  scene.add(movingSphere)

  rebuild()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const delta = clock.getDelta()
  if (autoPlay.value && speed.value > 0) {
    progress.value = (progress.value + delta * speed.value * 0.08) % 1
  }

  applyProgress()
  controls.update()
  renderer.render(scene, camera)
}

watch([curveType, showTube, segments], rebuild)
watch(progress, applyProgress)
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
.panel-value { color: white; font-weight: 700; min-width: 66px; text-align: right; }
.control-range { width: 140px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
