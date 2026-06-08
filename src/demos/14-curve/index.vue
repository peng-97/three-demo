<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button
        v-for="(type, index) in curveTypes"
        :key="type"
        class="control-btn"
        :class="{ active: currentCurveIndex === index }"
        @click="switchCurve(index)"
      >
        {{ type }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, currentMesh, controls

const curveTypes = ['直线', '圆', '椭圆', '二次贝塞尔', '三次贝塞尔', '样条曲线', 'CatmullRom', '螺旋线', '管道']
const currentCurveIndex = ref(0)

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(8, 6, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  // 坐标轴
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // 网格辅助线
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  // 轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 显示初始曲线
  createCurve(currentCurveIndex.value)
}

function createCurve(index) {
  // 移除旧曲线
  if (currentMesh) {
    scene.remove(currentMesh)
    if (currentMesh.geometry) currentMesh.geometry.dispose()
    if (currentMesh.material) currentMesh.material.dispose()
  }

  let curve, geometry, material

  switch (index) {
    case 0: // 直线
      const linePoints = [new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0)]
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6b6b, linewidth: 2 })
      currentMesh = new THREE.Line(lineGeometry, lineMaterial)
      break

    case 1: // 圆
      const circleCurve = new THREE.CircleCurve3(new THREE.Vector3(0, 0, 0), 3)
      const circlePoints = circleCurve.getPoints(50)
      const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints)
      const circleMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4 })
      currentMesh = new THREE.Line(circleGeometry, circleMaterial)
      break

    case 2: // 椭圆
      const ellipseCurve = new THREE.EllipseCurve(0, 0, 4, 2, 0, Math.PI * 2, false, 0)
      const ellipsePoints = ellipseCurve.getPoints(50).map(p => new THREE.Vector3(p.x, p.y, 0))
      const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints)
      const ellipseMaterial = new THREE.LineBasicMaterial({ color: 0x667eea })
      currentMesh = new THREE.Line(ellipseGeometry, ellipseMaterial)
      break

    case 3: // 二次贝塞尔
      const quadCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(0, 5, 0),
        new THREE.Vector3(5, 0, 0)
      )
      const quadPoints = quadCurve.getPoints(50)
      const quadGeometry = new THREE.BufferGeometry().setFromPoints(quadPoints)
      const quadMaterial = new THREE.LineBasicMaterial({ color: 0xa8e6cf })
      currentMesh = new THREE.Line(quadGeometry, quadMaterial)
      break

    case 4: // 三次贝塞尔
      const cubicCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(-2, 5, 2),
        new THREE.Vector3(2, -5, -2),
        new THREE.Vector3(5, 0, 0)
      )
      const cubicPoints = cubicCurve.getPoints(50)
      const cubicGeometry = new THREE.BufferGeometry().setFromPoints(cubicPoints)
      const cubicMaterial = new THREE.LineBasicMaterial({ color: 0xffd93d })
      currentMesh = new THREE.Line(cubicGeometry, cubicMaterial)
      break

    case 5: // 样条曲线
      const splinePoints = [
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(-3, 3, 2),
        new THREE.Vector3(0, -2, -1),
        new THREE.Vector3(3, 4, 1),
        new THREE.Vector3(5, 0, 0)
      ]
      const splineCurve = new THREE.SplineCurve3(splinePoints)
      const splineGeomPoints = splineCurve.getPoints(50)
      const splineGeometry = new THREE.BufferGeometry().setFromPoints(splineGeomPoints)
      const splineMaterial = new THREE.LineBasicMaterial({ color: 0xc56cf0 })
      currentMesh = new THREE.Line(splineGeometry, splineMaterial)
      break

    case 6: // CatmullRom
      const catmullPoints = [
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(-3, 2, 3),
        new THREE.Vector3(0, -1, -2),
        new THREE.Vector3(3, 3, 1),
        new THREE.Vector3(5, 0, 0)
      ]
      const catmullCurve = new THREE.CatmullRomCurve3(catmullPoints)
      const catmullGeomPoints = catmullCurve.getPoints(50)
      const catmullGeometry = new THREE.BufferGeometry().setFromPoints(catmullGeomPoints)
      const catmullMaterial = new THREE.LineBasicMaterial({ color: 0xff9ff3 })
      currentMesh = new THREE.Line(catmullGeometry, catmullMaterial)
      break

    case 7: // 螺旋线
      const spiralPoints = []
      for (let i = 0; i <= 100; i++) {
        const t = i / 100
        const angle = t * Math.PI * 8
        const radius = 2 + t * 3
        spiralPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          t * 8 - 4,
          Math.sin(angle) * radius
        ))
      }
      const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints)
      const spiralMaterial = new THREE.LineBasicMaterial({ color: 0x70a1ff })
      currentMesh = new THREE.Line(spiralGeometry, spiralMaterial)
      break

    case 8: // 管道
      const tubeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(-3, 3, 2),
        new THREE.Vector3(0, -2, -1),
        new THREE.Vector3(3, 4, 1),
        new THREE.Vector3(5, 0, 0)
      ])
      const tubeGeometry = new THREE.TubeGeometry(tubeCurve, 64, 0.5, 16, false)
      const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.3, roughness: 0.7 })
      currentMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
      break
  }

  scene.add(currentMesh)
}

function switchCurve(index) {
  currentCurveIndex.value = index
  createCurve(index)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.control-btn.active {
  background: #ff6b6b;
  color: white;
}
</style>
