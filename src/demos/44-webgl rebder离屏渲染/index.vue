<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">选择效果:</span>
      <select v-model="effectType" class="control-select">
        <option value="blur">模糊</option>
        <option value="invert">反转</option>
        <option value="edge">边缘检测</option>
        <option value="grayscale">灰度</option>
      </select>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="effectIntensity" min="0" max="2" step="0.1" class="control-range">
      <span class="panel-value">{{ effectIntensity.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const effectType = ref('blur')
const effectIntensity = ref(1)

let scene, camera, renderer, animationId, controls
let renderScene, renderTarget, effectScene, effectCamera, effectMesh, clock

const effects = {
  blur: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 color = vec4(0.0);
      float offset = 0.005 * uIntensity;
      for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
          color += texture2D(tDiffuse, vUv + vec2(x * offset, y * offset));
        }
      }
      color /= 25.0;
      gl_FragColor = color;
    }
  `,
  invert: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(mix(color.rgb, 1.0 - color.rgb, uIntensity), color.a);
    }
  `,
  edge: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      float offset = 0.001;
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 left = texture2D(tDiffuse, vUv - vec2(offset, 0.0));
      vec4 right = texture2D(tDiffuse, vUv + vec2(offset, 0.0));
      vec4 up = texture2D(tDiffuse, vUv - vec2(0.0, offset));
      vec4 down = texture2D(tDiffuse, vUv + vec2(0.0, offset));
      float edge = length(abs(left - right) + abs(up - down)) * uIntensity;
      gl_FragColor = vec4(vec3(edge), 1.0);
    }
  `,
  grayscale: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(mix(color.rgb, vec3(gray), uIntensity), color.a);
    }
  `
}

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

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf]
  for (let i = 0; i < 10; i++) {
    const geom = new THREE.BoxGeometry(1 + Math.random(), 1 + Math.random(), 1 + Math.random())
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], metalness: 0.3, roughness: 0.7 })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set((Math.random() - 0.5) * 15, 1, (Math.random() - 0.5) * 15)
    mesh.rotation.set(Math.random(), Math.random(), Math.random())
    mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.02)
    scene.add(mesh)
  }

  const torusGeom = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16)
  const torusMat = new THREE.MeshStandardMaterial({ color: 0xc56cf0, metalness: 0.5, roughness: 0.3 })
  const torus = new THREE.Mesh(torusGeom, torusMat)
  torus.position.set(0, 2, 0)
  scene.add(torus)

  renderScene = scene
  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })

  effectScene = new THREE.Scene()
  effectCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const screenGeom = new THREE.PlaneGeometry(2, 2)
  const effectMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uIntensity: { value: effectIntensity.value } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: effects[effectType.value]
  })
  effectMesh = new THREE.Mesh(screenGeom, effectMat)
  effectScene.add(effectMesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch(effectType, () => {
  if (effectMesh) {
    effectMesh.material.fragmentShader = effects[effectType.value]
    effectMesh.material.needsUpdate = true
  }
})

watch(effectIntensity, () => {
  if (effectMesh) {
    effectMesh.material.uniforms.uIntensity.value = effectIntensity.value
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)

  renderer.setRenderTarget(renderTarget)
  renderer.render(renderScene, camera)

  effectMesh.material.uniforms.tDiffuse.value = renderTarget.texture
  effectMesh.material.uniforms.uIntensity.value = effectIntensity.value

  renderer.setRenderTarget(null)
  renderer.render(effectScene, effectCamera)

  controls.update()
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  renderer.dispose()
  renderTarget.dispose()
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
