<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">顶点颜色强度:</span>
      <input type="range" v-model="colorIntensity" min="0.1" max="2" step="0.1" class="control-range">
      <span class="panel-value">{{ colorIntensity.toFixed(1) }}</span>
      <span class="panel-label">动画速度:</span>
      <input type="range" v-model="animSpeed" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ animSpeed.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const colorIntensity = ref(1)
const animSpeed = ref(1)

let scene, camera, renderer, animationId, controls
let mesh, attributeColors, clock

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

  const geometry = new THREE.SphereGeometry(3, 64, 64)
  const count = geometry.attributes.position.count
  attributeColors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const position = new THREE.Vector3()
    position.fromBufferAttribute(geometry.attributes.position, i)
    const phi = Math.atan2(position.y, Math.sqrt(position.x * position.x + position.z * position.z))
    const theta = Math.atan2(position.z, position.x)
    
    attributeColors[i * 3] = (Math.sin(theta * 3) + 1) / 2
    attributeColors[i * 3 + 1] = (Math.cos(phi * 4) + 1) / 2
    attributeColors[i * 3 + 2] = (Math.sin(theta + phi) + 1) / 2
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(attributeColors, 3))

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uIntensity;
      
      void main() {
        vColor = color * uIntensity;
        
        vec3 pos = position;
        float noise = sin(pos.x * 5.0 + uTime) * 0.1 * uIntensity;
        pos += normal * noise;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: colorIntensity.value }
    },
    vertexColors: true
  })

  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([colorIntensity, animSpeed], () => {
  if (mesh) {
    mesh.material.uniforms.uIntensity.value = colorIntensity.value
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  mesh.rotation.y += 0.005 * animSpeed.value
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
.control-range { width: 100px; cursor: pointer; }
</style>
