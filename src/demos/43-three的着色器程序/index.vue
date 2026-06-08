<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">选择着色器:</span>
      <select v-model="shaderType" class="control-select">
        <option value="noise">噪声</option>
        <option value="wave">波浪</option>
        <option value="grid">网格</option>
        <option value="rainbow">彩虹</option>
      </select>
      <span class="panel-label">时间缩放:</span>
      <input type="range" v-model="timeScale" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ timeScale.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const shaderType = ref('noise')
const timeScale = ref(1)

let scene, camera, renderer, animationId, controls
let mesh, clock

const shaders = {
  noise: {
    vertex: `
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        float noise = sin(pos.x * 10.0 + uTime) * sin(pos.y * 8.0 + uTime) * 0.2;
        pos.z += noise;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        float color = sin(vUv.x * 15.0 + uTime) * cos(vUv.y * 10.0 + uTime) * 0.5 + 0.5;
        gl_FragColor = vec4(color, 0.2 + color * 0.8, 1.0 - color, 1.0);
      }
    `
  },
  wave: {
    vertex: `
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 3.0 + uTime) * cos(pos.y * 2.0 + uTime) * 0.5;
        pos.z += wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        float wave = sin(distance(vUv, vec2(0.5)) * 20.0 + uTime) * 0.5 + 0.5;
        gl_FragColor = vec4(0.0, wave, 1.0, 1.0);
      }
    `
  },
  grid: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        float grid = step(0.01, abs(fract(vUv.x * 10.0) - 0.5)) + step(0.01, abs(fract(vUv.y * 10.0) - 0.5));
        float color = 0.5 + sin(uTime * 2.0) * 0.5;
        gl_FragColor = vec4(grid * color, grid * 0.5, grid, 1.0);
      }
    `
  },
  rainbow: {
    vertex: `
      uniform float uTime;
      varying vec3 vPosition;
      
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      uniform float uTime;
      varying vec3 vPosition;
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        float hue = vPosition.x * 0.2 + uTime * 0.1;
        vec3 color = hsv2rgb(vec3(hue, 1.0, 1.0));
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
}

function createMaterial(type) {
  return new THREE.ShaderMaterial({
    vertexShader: shaders[type].vertex,
    fragmentShader: shaders[type].fragment,
    uniforms: {
      uTime: { value: 0 }
    }
  })
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 4, 6)
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

  const geometry = new THREE.PlaneGeometry(6, 6, 64, 64)
  const material = createMaterial(shaderType.value)
  mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  scene.add(mesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch(shaderType, () => {
  if (mesh) {
    mesh.material = createMaterial(shaderType.value)
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  mesh.material.uniforms.uTime.value = time * timeScale.value
  mesh.rotation.z += 0.002

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
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 100px; cursor: pointer; }
</style>
