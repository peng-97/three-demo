<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="start" class="control-btn">开始序列</button>
      <button @click="stop" class="control-btn">停止</button>
      <button @click="reset" class="control-btn">重置</button>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转场景</span>
      </label>
      <span class="panel-label">状态:</span>
      <span class="panel-value">{{ state }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const spinning = ref(true)
const state = ref('idle')

let scene, camera, renderer, animationId, controls
let clock
let group
let objects = []
let tweens = []
let virtualTime = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 14, 26)
  camera.lookAt(0, 3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const grid = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)

  group = new THREE.Group()
  scene.add(group)

  const geometry = new THREE.SphereGeometry(1, 28, 28)
  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24]
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.45, metalness: 0.2 })
    const m = new THREE.Mesh(geometry.clone(), mat)
    m.position.set((i - 1.5) * 5, 2, 0)
    m.userData.base = m.position.clone()
    group.add(m)
    objects.push(m)
  }

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    const delta = clock.getDelta()
    if (tweens.length) {
      virtualTime += delta * 1000
      TWEEN.update(virtualTime)
    }
    if (spinning.value) group.rotation.y += delta * 0.15
    controls.update()
    renderer.render(scene, camera)
  }
  tick()
})

onUnmounted(() => {
  stop()
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  objects.forEach((o) => {
    o.geometry?.dispose?.()
    o.material?.dispose?.()
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function start() {
  stop()
  reset()
  state.value = 'phase-1'

  const lead = objects[0]
  const leadData = { k: 0 }
  const t1 = new TWEEN.Tween(leadData)
    .to({ k: 1 }, 1200)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(() => {
      lead.position.y = lead.userData.base.y + leadData.k * 7
      lead.rotation.y = leadData.k * Math.PI * 2
    })
    .onComplete(() => {
      state.value = 'phase-2'
      const created = []
      for (let i = 1; i < objects.length; i++) {
        const o = objects[i]
        const data = { k: 0 }
        const t = new TWEEN.Tween(data)
          .to({ k: 1 }, 1000 + i * 180)
          .delay(i * 120)
          .easing(TWEEN.Easing.Back.Out)
          .yoyo(true)
          .repeat(2)
          .onUpdate(() => {
            o.position.y = o.userData.base.y + data.k * 6
            o.rotation.x = data.k * Math.PI * 2
          })
          .onComplete(() => {
            if (i === objects.length - 1) state.value = 'completed'
          })
        created.push(t)
      }
      created.forEach((t) => t.start(virtualTime))
      tweens.push(...created)
    })

  virtualTime = 0
  t1.start(0)
  tweens.push(t1)
}

function stop() {
  tweens.forEach((t) => t.stop())
  tweens = []
  TWEEN.removeAll()
  virtualTime = 0
  state.value = 'stopped'
}

function reset() {
  objects.forEach((o) => {
    o.position.copy(o.userData.base)
    o.rotation.set(0, 0, 0)
  })
  state.value = 'idle'
}
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
.panel-value { color: white; font-weight: 700; min-width: 90px; text-align: left; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
