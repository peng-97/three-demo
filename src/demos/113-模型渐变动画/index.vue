<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="playing">
        <span>播放</span>
      </label>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="5" step="0.05" class="control-range">
      <span class="panel-value">{{ speed.toFixed(2) }}</span>
      <span class="panel-label">高度:</span>
      <input type="range" v-model="height" min="1" max="20" step="0.1" class="control-range">
      <span class="panel-value">{{ height.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="useWorld">
        <span>世界坐标</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const playing = ref(true)
const speed = ref(1.2)
const height = ref(10)
const useWorld = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, clock
let shaderRef = null

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
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 10, 22)
  camera.lookAt(0, 4, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 4, 0)

  const geometry = new THREE.TorusKnotGeometry(3, 1, 240, 32)
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.2
  })
  material.onBeforeCompile = (shader) => {
    shaderRef = shader
    shader.uniforms.uTime = { value: 0 }
    shader.uniforms.uHeight = { value: height.value }
    shader.uniforms.uUseWorld = { value: useWorld.value ? 1 : 0 }
    shader.uniforms.uColorA = { value: new THREE.Color('#00ffff') }
    shader.uniforms.uColorB = { value: new THREE.Color('#6c5ce7') }
    shader.uniforms.uColorC = { value: new THREE.Color('#ff4d6d') }

    shader.vertexShader =
      `
varying vec3 vWorldPos;
` + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`
    )

    shader.fragmentShader =
      `
uniform float uTime;
uniform float uHeight;
uniform float uUseWorld;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying vec3 vWorldPos;
` + shader.fragmentShader

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `
float y = mix(vViewPosition.y, vWorldPos.y, step(0.5, uUseWorld));
float t = clamp((y + uHeight * 0.5) / uHeight, 0.0, 1.0);
float w = fract(t + uTime);
vec3 grad = mix(uColorA, uColorB, smoothstep(0.0, 0.5, w));
grad = mix(grad, uColorC, smoothstep(0.5, 1.0, w));
vec4 diffuseColor = vec4( diffuse * grad, opacity );
`
    )
  }
  material.needsUpdate = true

  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 4
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (mesh) mesh.rotation.y += delta * 0.15
  if (shaderRef && playing.value) {
    shaderRef.uniforms.uTime.value = (shaderRef.uniforms.uTime.value + delta * speed.value * 0.25) % 1
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([height, useWorld], () => {
  if (!shaderRef) return
  shaderRef.uniforms.uHeight.value = height.value
  shaderRef.uniforms.uUseWorld.value = useWorld.value ? 1 : 0
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
