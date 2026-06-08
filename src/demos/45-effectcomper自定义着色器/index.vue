<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">效果组合:</span>
      <select v-model="effectSet" class="control-select">
        <option value="none">无效果</option>
        <option value="bloom">Bloom</option>
        <option value="dof">景深</option>
        <option value="nightvision">夜视</option>
      </select>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="intensity" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ intensity.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const effectSet = ref('bloom')
const intensity = ref(1.5)

let scene, camera, renderer, animationId, controls
let renderScene, renderTarget, effectScene, effectCamera, effectMesh, clock

const effectShaders = {
  none: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
  bloom: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 bloom = vec4(0.0);
      float offset = 0.005;
      for (int x = -3; x <= 3; x++) {
        for (int y = -3; y <= 3; y++) {
          bloom += texture2D(tDiffuse, vUv + vec2(float(x) * offset, float(y) * offset));
        }
      }
      bloom /= 49.0;
      vec4 final = color + bloom * uIntensity * color;
      gl_FragColor = final;
    }
  `,
  dof: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      float depth = 0.3 + distance(vUv, vec2(0.5)) * 0.7;
      float blurOffset = depth * 0.01 * uIntensity;
      vec4 color = vec4(0.0);
      for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
          color += texture2D(tDiffuse, vUv + vec2(float(x) * blurOffset, float(y) * blurOffset));
        }
      }
      color /= 25.0;
      gl_FragColor = color;
    }
  `,
  nightvision: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float n = noise(vUv * 100.0) * 0.1;
      vec3 night = vec3(0.0, gray + n, 0.0);
      gl_FragColor = vec4(mix(color.rgb, night, uIntensity), color.a);
    }
  `
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(30, 30, 0x333366, 0x1a1a33)
  scene.add(grid)

  const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff]
  for (let i = 0; i < 20; i++) {
    const size = 0.3 + Math.random() * 0.7
    const geom = new THREE.IcosahedronGeometry(size, 1)
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3 })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set((Math.random() - 0.5) * 20, 1 + Math.random() * 5, (Math.random() - 0.5) * 20)
    mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.02)
    scene.add(mesh)
  }

  const torusGeom = new THREE.TorusKnotGeometry(2, 0.6, 128, 32)
  const torusMat = new THREE.MeshStandardMaterial({ color: 0x667eea, emissive: 0x667eea, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2 })
  const torus = new THREE.Mesh(torusGeom, torusMat)
  torus.position.set(0, 2, 0)
  scene.add(torus)

  renderScene = scene
  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })

  effectScene = new THREE.Scene()
  effectCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const screenGeom = new THREE.PlaneGeometry(2, 2)
  const effectMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uIntensity: { value: intensity.value } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: effectShaders[effectSet.value]
  })
  effectMesh = new THREE.Mesh(screenGeom, effectMat)
  effectScene.add(effectMesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch(effectSet, () => {
  if (effectMesh) {
    effectMesh.material.fragmentShader = effectShaders[effectSet.value]
    effectMesh.material.needsUpdate = true
  }
})

watch(intensity, () => {
  if (effectMesh) {
    effectMesh.material.uniforms.uIntensity.value = intensity.value
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  renderer.setRenderTarget(renderTarget)
  renderer.render(renderScene, camera)

  effectMesh.material.uniforms.tDiffuse.value = renderTarget.texture
  effectMesh.material.uniforms.uIntensity.value = intensity.value

  renderer.setRenderTarget(null)
  renderer.render(effectScene, effectCamera)

  scene.traverse((obj) => {
    if (obj.userData.vel) {
      obj.position.add(obj.userData.vel)
      obj.rotation.x += obj.userData.vel.x * 0.5
      obj.rotation.y += obj.userData.vel.y * 0.5
      if (Math.abs(obj.position.x) > 10) obj.userData.vel.x *= -1
      if (obj.position.y < 0.5 || obj.position.y > 7) obj.userData.vel.y *= -1
      if (Math.abs(obj.position.z) > 10) obj.userData.vel.z *= -1
    }
  })

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
