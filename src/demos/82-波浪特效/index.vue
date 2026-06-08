<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">振幅:</span>
      <input type="range" v-model="amplitude" min="0" max="2" step="0.01" class="control-range">
      <span class="panel-value">{{ amplitude.toFixed(2) }}</span>
      <span class="panel-label">频率:</span>
      <input type="range" v-model="frequency" min="0.2" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ frequency.toFixed(1) }}</span>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="5" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="playing">
        <span>播放</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const amplitude = ref(0.9)
const frequency = ref(2.2)
const speed = ref(1.4)
const wireframe = ref(false)
const playing = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, shaderMaterial, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function applyUniforms() {
  if (!shaderMaterial) return
  shaderMaterial.uniforms.uAmp.value = amplitude.value
  shaderMaterial.uniforms.uFreq.value = frequency.value
  shaderMaterial.uniforms.uSpeed.value = speed.value
  shaderMaterial.wireframe = wireframe.value
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
  shaderMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 10, 18)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
  scene.add(ambientLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)

  const geometry = new THREE.PlaneGeometry(24, 24, 220, 220)

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: amplitude.value },
      uFreq: { value: frequency.value },
      uSpeed: { value: speed.value },
      uColorA: { value: new THREE.Color('#4ecdc4') },
      uColorB: { value: new THREE.Color('#667eea') }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAmp;
      uniform float uFreq;
      uniform float uSpeed;
      varying float vH;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float t = uTime * uSpeed;
        float w1 = sin((p.x * 0.35 + t) * uFreq);
        float w2 = cos((p.y * 0.42 - t * 0.9) * (uFreq * 0.85));
        float w3 = sin((p.x + p.y) * 0.18 * uFreq + t * 0.8);
        float h = (w1 + w2 + w3) * 0.33 * uAmp;
        p.z += h;
        vH = h;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vH;
      varying vec2 vUv;
      void main() {
        float t = clamp(vH * 0.9 + 0.5, 0.0, 1.0);
        vec3 col = mix(uColorA, uColorB, t);
        float grid = 0.15 * (sin(vUv.x * 80.0) * sin(vUv.y * 80.0));
        col += grid;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide
  })
  shaderMaterial.wireframe = wireframe.value

  mesh = new THREE.Mesh(geometry, shaderMaterial)
  mesh.rotation.x = -Math.PI / 2
  scene.add(mesh)

  const gridHelper = new THREE.GridHelper(24, 24, 0x222244, 0x111122)
  scene.add(gridHelper)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (playing.value) shaderMaterial.uniforms.uTime.value += delta
  applyUniforms()
  controls.update()
  renderer.render(scene, camera)
}

watch([amplitude, frequency, speed, wireframe], applyUniforms)
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
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
