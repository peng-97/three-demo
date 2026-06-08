<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">点数:</span>
      <input type="range" v-model="count" min="200" max="10000" step="200" class="control-range">
      <span class="panel-value">{{ count }}</span>
      <span class="panel-label">大小:</span>
      <input type="range" v-model="size" min="2" max="40" step="1" class="control-range">
      <span class="panel-value">{{ size }}</span>
      <span class="panel-label">边缘:</span>
      <input type="range" v-model="softness" min="0" max="0.35" step="0.01" class="control-range">
      <span class="panel-value">{{ softness.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="attenuation">
        <span>随距离缩放</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const count = ref(2400)
const size = ref(14)
const softness = ref(0.08)
const attenuation = ref(true)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let points, shaderMaterial, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function buildPoints() {
  if (points) {
    scene.remove(points)
    points.geometry.dispose()
    points.material.dispose()
    points = null
  }

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count.value * 3)
  const colors = new Float32Array(count.value * 3)

  for (let i = 0; i < count.value; i++) {
    const i3 = i * 3
    const r = Math.pow(Math.random(), 0.5) * 6
    const theta = Math.random() * Math.PI * 2
    const y = (Math.random() - 0.5) * 6
    positions[i3 + 0] = Math.cos(theta) * r
    positions[i3 + 1] = y + 2
    positions[i3 + 2] = Math.sin(theta) * r

    const hue = (i / count.value) * 0.9
    const col = new THREE.Color().setHSL(hue, 0.85, 0.6)
    colors[i3 + 0] = col.r
    colors[i3 + 1] = col.g
    colors[i3 + 2] = col.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: size.value },
      uSoftness: { value: softness.value },
      uAttenuation: { value: attenuation.value ? 1 : 0 }
    },
    vertexShader: `
      uniform float uSize;
      uniform float uAttenuation;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float att = mix(1.0, 250.0 / max(1.0, -mvPosition.z), step(0.5, uAttenuation));
        gl_PointSize = uSize * att;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uSoftness;
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float r = 0.5;
        float a = 1.0 - smoothstep(r - uSoftness, r, d);
        if (a <= 0.001) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  points = new THREE.Points(geometry, shaderMaterial)
  scene.add(points)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  points?.geometry?.dispose?.()
  points?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 6, 14)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  buildPoints()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  shaderMaterial.uniforms.uSize.value = size.value
  shaderMaterial.uniforms.uSoftness.value = softness.value
  shaderMaterial.uniforms.uAttenuation.value = attenuation.value ? 1 : 0

  if (spinning.value && points) {
    points.rotation.y += delta * 0.25
  }
  controls.update()
  renderer.render(scene, camera)
}

watch(count, buildPoints)
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
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
