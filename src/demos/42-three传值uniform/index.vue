<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">RGB颜色:</span>
      <input type="range" v-model="colorR" min="0" max="1" step="0.01" class="control-range">
      <input type="range" v-model="colorG" min="0" max="1" step="0.01" class="control-range">
      <input type="range" v-model="colorB" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-label">缩放:</span>
      <input type="range" v-model="scale" min="0.5" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ scale.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const colorR = ref(0.4)
const colorG = ref(0.6)
const colorB = ref(1.0)
const scale = ref(1.5)

let scene, camera, renderer, animationId, controls
let mesh, clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(grid)

  const geometry = new THREE.TorusKnotGeometry(2, 0.8, 128, 32)

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float uScale;
      uniform float uTime;
      varying vec3 vPosition;
      
      void main() {
        vPosition = position;
        
        vec3 pos = position * uScale;
        float wave = sin(pos.x * 3.0 + uTime) * 0.3;
        pos.y += wave;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vPosition;
      
      void main() {
        float pattern = sin(vPosition.x * 5.0 + uTime) * 0.5 + 0.5;
        vec3 finalColor = uColor * (0.5 + pattern * 0.5);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    uniforms: {
      uColor: { value: new THREE.Vector3(colorR.value, colorG.value, colorB.value) },
      uScale: { value: scale.value },
      uTime: { value: 0 }
    }
  })

  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([colorR, colorG, colorB, scale], () => {
  if (mesh) {
    mesh.material.uniforms.uColor.value.set(colorR.value, colorG.value, colorB.value)
    mesh.material.uniforms.uScale.value = scale.value
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  mesh.rotation.y += 0.005
  mesh.material.uniforms.uTime.value = time

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  renderer.dispose()
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; font-size: 1rem; min-width: 50px; }
.control-range { width: 80px; cursor: pointer; }
</style>
