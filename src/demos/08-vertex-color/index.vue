<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, mesh, circleMesh

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
  scene.background = new THREE.Color(0x0a0a0a)
  
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 4
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  // 四面体
  const geometry = new THREE.TetrahedronGeometry(2, 1)
  const colors = []


  const faceColors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0]
  ]
  
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    const faceIndex = Math.floor(i / 3)
    colors.push(...faceColors[faceIndex % faceColors.length])
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  



  const material = new THREE.MeshBasicMaterial({ vertexColors: true, })
  mesh = new THREE.Mesh(geometry, material)


    //三角形
  const circleGeometry = new THREE.BufferGeometry()
  // 三角形的顶点  移动到指定位置
  circleGeometry.setFromPoints([
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(3, 0, 0),
    new THREE.Vector3(2, 3, 0)
  ])
  //红绿蓝
  circleGeometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3))
  const circleMaterial = new THREE.MeshBasicMaterial({ vertexColors: true,side: THREE.DoubleSide, })
 circleMesh = new THREE.Mesh(circleGeometry, circleMaterial)
  scene.add(circleMesh)
  scene.add(mesh)
  
  const wireframe = new THREE.WireframeGeometry(geometry)
  const line = new THREE.LineSegments(wireframe)
  line.material.color.setHex(0xffffff)
  mesh.add(line)

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.update()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  mesh.rotation.x += 0.01
  mesh.rotation.y += 0.015

  circleMesh.rotation.x += 0.01
  
  renderer.render(scene, camera)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
