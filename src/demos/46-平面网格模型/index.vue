<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">网格:</span>
      <select v-model="gridType" class="control-select">
        <option value="grid">Grid网格</option>
        <option value="checker">棋盘</option>
        <option value="hex">六边形</option>
      </select>
      <span class="panel-label">大小:</span>
      <input type="range" v-model="gridSize" min="0.5" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ gridSize.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const gridType = ref('grid')
const gridSize = ref(1.5)

let scene, camera, renderer, animationId, controls
let plane, clock

const shaders = {
  grid: `
    uniform float uSize;
    varying vec2 vUv;
    void main() {
      vec2 grid = abs(fract(vUv * uSize - 0.5) - 0.5) / fwidth(vUv * uSize);
      float line = min(grid.x, grid.y);
      float color = 1.0 - min(line, 1.0);
      gl_FragColor = vec4(vec3(0.4, 0.8, 1.0) * color, color * 0.8);
    }
  `,
  checker: `
    uniform float uSize;
    varying vec2 vUv;
    void main() {
      vec2 c = floor(vUv * uSize * 2.0);
      float checker = mod(c.x + c.y, 2.0);
      vec3 col = mix(vec3(0.1, 0.15, 0.25), vec3(0.6, 0.8, 1.0), checker);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  hex: `
    uniform float uSize;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv * uSize;
      float r = 1.0;
      float h = 0.5 * r * sqrt(3.0);
      float hr = r * 0.75;
      float hm = h * 0.5;
      
      float x = uv.x;
      float y = uv.y;
      
      float xi = floor(x / hr);
      float yi = floor((y - hm * mod(xi, 2.0)) / h);
      float xf = fract(x / hr);
      float yf = fract((y - hm * mod(xi, 2.0)) / h);
      
      float d = 0.0;
      if (mod(xi, 2.0) == 0.0) {
        d = max(abs(0.5 - yf) * 2.0, abs(0.5 - xf) * 4.0);
      } else {
        d = max(abs(0.5 - yf) * 2.0, abs(0.5 - xf) * 4.0);
      }
      
      float col = smoothstep(0.8, 0.85, d);
      vec3 final = mix(vec3(0.4, 0.7, 0.9), vec3(0.1, 0.15, 0.25), col);
      gl_FragColor = vec4(final, 1.0);
    }
  `
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 8, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const geom = new THREE.PlaneGeometry(30, 30, 1, 1)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: gridSize.value } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: shaders[gridType.value],
    extensions: { derivatives: true },
    transparent: true,
    side: THREE.DoubleSide
  })
  plane = new THREE.Mesh(geom, mat)
  plane.rotation.x = -Math.PI / 2
  scene.add(plane)

  for (let i = 0; i < 5; i++) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.3, roughness: 0.7 }))
    cube.position.set((Math.random() - 0.5) * 20, 0.5, (Math.random() - 0.5) * 20)
    scene.add(cube)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([gridType, gridSize], () => {
  if (plane) {
    plane.material.fragmentShader = shaders[gridType.value]
    plane.material.uniforms.uSize.value = gridSize.value
    plane.material.needsUpdate = true
  }
})

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); window.addEventListener('resize', onResize); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  plane?.geometry?.dispose?.()
  plane?.material?.dispose?.()
  scene?.traverse?.((o) => {
    if (o.isMesh && o !== plane) {
      o.geometry?.dispose?.()
      o.material?.dispose?.()
    }
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
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
