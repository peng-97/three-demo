<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">轨迹:</span>
      <select v-model="curveType" class="control-select">
        <option value="loop">闭合轨迹</option>
        <option value="sine">波浪轨迹</option>
        <option value="helix">螺旋轨迹</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="showTrack">
        <span>细线轨迹</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="showFly">
        <span>飞线</span>
      </label>
      <span class="panel-label">尾长:</span>
      <input type="range" v-model="trailLength" min="0.02" max="0.6" step="0.01" class="control-range">
      <span class="panel-value">{{ trailLength.toFixed(2) }}</span>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">粒径:</span>
      <input type="range" v-model="pointSize" min="2" max="24" step="1" class="control-range">
      <span class="panel-value">{{ pointSize }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const curveType = ref('loop')
const showTrack = ref(true)
const showFly = ref(true)
const trailLength = ref(0.25)
const speed = ref(1.2)
const pointSize = ref(10)

let scene, camera, renderer, animationId, controls
let clock
let trackLine, flyPoints, flyMaterial
let activeCurve
let head = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createCurve() {
  if (curveType.value === 'sine') {
    const pts = []
    const n = 260
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const x = (t - 0.5) * 22
      const y = 2 + Math.sin(t * Math.PI * 8) * 2.4
      const z = Math.cos(t * Math.PI * 4) * 5
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
  }

  if (curveType.value === 'helix') {
    const pts = []
    const turns = 3
    const n = 520
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const angle = t * Math.PI * 2 * turns
      const radius = 7
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = 2 + (t - 0.5) * 10
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
  }

  const pts = []
  const n = 520
  const a = 7
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2
    const x = (a * Math.sin(t)) / (1 + Math.cos(t) * Math.cos(t))
    const z = (a * Math.sin(t) * Math.cos(t)) / (1 + Math.cos(t) * Math.cos(t))
    const y = 2 + Math.sin(t * 2) * 1.6
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.4)
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

function rebuild() {
  if (trackLine) {
    scene.remove(trackLine)
    disposeObject(trackLine)
    trackLine = null
  }
  if (flyPoints) {
    scene.remove(flyPoints)
    disposeObject(flyPoints)
    flyPoints = null
  }

  activeCurve = createCurve()
  head = 0

  const trackPoints = activeCurve.getPoints(900)
  const trackGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints)
  const trackMaterial = new THREE.LineBasicMaterial({ color: 0x667eea, transparent: true, opacity: 0.45 })
  trackLine = new THREE.Line(trackGeometry, trackMaterial)
  trackLine.visible = showTrack.value
  scene.add(trackLine)

  const n = 900
  const positions = new Float32Array(n * 3)
  const aT = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const p = activeCurve.getPointAt(t)
    positions[i * 3 + 0] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = p.z
    aT[i] = t
  }
  const flyGeometry = new THREE.BufferGeometry()
  flyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  flyGeometry.setAttribute('aT', new THREE.BufferAttribute(aT, 1))

  flyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uHead: { value: 0 },
      uTrail: { value: trailLength.value },
      uSize: { value: pointSize.value },
      uColor: { value: new THREE.Color('#00ffff') }
    },
    vertexShader: `
      uniform float uHead;
      uniform float uTrail;
      uniform float uSize;
      attribute float aT;
      varying float vAlpha;
      void main() {
        float dt = uHead - aT;
        dt = dt < 0.0 ? dt + 1.0 : dt;
        float inside = step(dt, uTrail);
        float k = inside * (1.0 - dt / max(0.0001, uTrail));
        vAlpha = k;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (0.6 + 1.6 * k);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float a = (1.0 - smoothstep(0.35, 0.5, d)) * vAlpha;
        if (a <= 0.001) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  flyPoints = new THREE.Points(flyGeometry, flyMaterial)
  flyPoints.visible = showFly.value
  scene.add(flyPoints)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(trackLine)
  disposeObject(flyPoints)
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 12, 24)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const gridHelper = new THREE.GridHelper(50, 50, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  clock = new THREE.Clock()
  rebuild()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (speed.value > 0) head = (head + delta * speed.value * 0.12) % 1
  if (flyMaterial) {
    flyMaterial.uniforms.uHead.value = head
    flyMaterial.uniforms.uTrail.value = trailLength.value
    flyMaterial.uniforms.uSize.value = pointSize.value
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([curveType], rebuild)
watch([showTrack], () => {
  if (trackLine) trackLine.visible = showTrack.value
})
watch([showFly], () => {
  if (flyPoints) flyPoints.visible = showFly.value
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
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
