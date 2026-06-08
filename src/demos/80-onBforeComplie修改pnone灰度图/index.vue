<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="enableBeforeCompile">
        <span>启用 onBeforeCompile</span>
      </label>
      <span class="panel-label">灰度:</span>
      <input type="range" v-model="gray" min="0" max="1" step="0.01" class="control-range" :disabled="!enableBeforeCompile">
      <span class="panel-value">{{ gray.toFixed(2) }}</span>
      <span class="panel-label">对比度:</span>
      <input type="range" v-model="contrast" min="0.5" max="2" step="0.01" class="control-range" :disabled="!enableBeforeCompile">
      <span class="panel-value">{{ contrast.toFixed(2) }}</span>
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
const enableBeforeCompile = ref(true)
const gray = ref(1)
const contrast = ref(1.05)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let phoneMesh, backMesh, clock
let phoneTexture
let phoneMaterial

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createPhoneTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0b1026'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, 'rgba(102,126,234,0.6)')
  grad.addColorStop(1, 'rgba(233,69,96,0.25)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(40, 120, canvas.width - 80, canvas.height - 220)

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 64px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PHONE UI', canvas.width / 2, 190)

  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = 'bold 44px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Messages', 80, 300)

  for (let i = 0; i < 6; i++) {
    const y = 360 + i * 90
    const w = 340 - i * 10
    ctx.fillStyle = i % 2 === 0 ? 'rgba(78,205,196,0.7)' : 'rgba(255,209,102,0.65)'
    ctx.fillRect(80, y, w, 60)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText(i % 2 === 0 ? 'Hello' : 'OK', 100, y + 38)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height - 90, 34, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function applyUniforms() {
  if (!phoneMaterial?.userData?.shader) return
  const shader = phoneMaterial.userData.shader
  shader.uniforms.uGray.value = gray.value
  shader.uniforms.uContrast.value = contrast.value
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  phoneMesh?.geometry?.dispose?.()
  phoneMaterial?.dispose?.()
  backMesh?.geometry?.dispose?.()
  backMesh?.material?.dispose?.()
  phoneTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 4.2, 12)
  camera.lookAt(0, 2.2, 0)

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
  controls.target.set(0, 2.2, 0)

  phoneTexture = createPhoneTexture()
  const phoneGeometry = new THREE.PlaneGeometry(4.2, 8.4)
  phoneMaterial = new THREE.MeshStandardMaterial({
    map: phoneTexture,
    roughness: 0.85,
    metalness: 0.1,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.15
  })

  phoneMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uGray = { value: gray.value }
    shader.uniforms.uContrast = { value: contrast.value }

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uGray;
      uniform float uContrast;
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      `
      vec3 col = outgoingLight;
      float g = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 grayCol = vec3(g);
      col = mix(col, grayCol, clamp(uGray, 0.0, 1.0));
      col = (col - 0.5) * uContrast + 0.5;
      gl_FragColor = vec4(col, diffuseColor.a);
      `
    )

    phoneMaterial.userData.shader = shader
    applyUniforms()
  }

  phoneMesh = new THREE.Mesh(phoneGeometry, phoneMaterial)
  phoneMesh.position.set(0, 2.2, 0.4)
  scene.add(phoneMesh)

  const backGeometry = new THREE.TorusKnotGeometry(1.2, 0.45, 160, 24)
  const backMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.35, metalness: 0.55 })
  backMesh = new THREE.Mesh(backGeometry, backMaterial)
  backMesh.position.set(0, 2.2, -2.5)
  scene.add(backMesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  applyUniforms()

  if (spinning.value) {
    backMesh.rotation.y += delta * 0.5
    backMesh.rotation.x += delta * 0.2
  }

  if (!enableBeforeCompile.value) {
    phoneMaterial.onBeforeCompile = null
  } else {
    if (!phoneMaterial.onBeforeCompile) {
      phoneMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.uGray = { value: gray.value }
        shader.uniforms.uContrast = { value: contrast.value }

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `
          #include <common>
          uniform float uGray;
          uniform float uContrast;
          `
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <output_fragment>',
          `
          vec3 col = outgoingLight;
          float g = dot(col, vec3(0.299, 0.587, 0.114));
          vec3 grayCol = vec3(g);
          col = mix(col, grayCol, clamp(uGray, 0.0, 1.0));
          col = (col - 0.5) * uContrast + 0.5;
          gl_FragColor = vec4(col, diffuseColor.a);
          `
        )

        phoneMaterial.userData.shader = shader
        applyUniforms()
      }
      phoneMaterial.needsUpdate = true
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

watch([gray, contrast], applyUniforms)
watch(enableBeforeCompile, () => {
  phoneMaterial.needsUpdate = true
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
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
