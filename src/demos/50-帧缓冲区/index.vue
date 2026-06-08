<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">后处理:</span>
      <select v-model="effectType" class="control-select">
        <option value="blur">模糊</option>
        <option value="edge">边缘检测</option>
        <option value="bloom">光晕</option>
        <option value="composite">合成</option>
      </select>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="effectValue" min="0" max="2" step="0.1" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const effectType = ref('blur')
const effectValue = ref(0.5)

let scene, camera, renderer, animationId, controls
let renderTarget, effectScene, effectCamera, clock
let plane

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 6, 12)
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

  const geometry = new THREE.TorusKnotGeometry(2, 0.7, 128, 32)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea, 
    metalness: 0.7, 
    roughness: 0.3,
    emissive: 0x667eea,
    emissiveIntensity: 0.2
  })
  const knot = new THREE.Mesh(geometry, material)
  scene.add(knot)
  
  const colors = [0xff6b6b, 0x4ecdc4, 0xfeca57, 0xa8e6cf]
  for (let i = 0; i < 4; i++) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: colors[i], metalness: 0.4, roughness: 0.5 })
    )
    const angle = (i / 4) * Math.PI * 2
    cube.position.set(Math.cos(angle) * 5, 1, Math.sin(angle) * 5)
    scene.add(cube)
  }

  renderTarget = new THREE.WebGLRenderTarget(container.value.clientWidth, container.value.clientHeight)
  
  effectScene = new THREE.Scene()
  effectCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  
  const quadGeom = new THREE.PlaneGeometry(2, 2)
  const quadMat = new THREE.ShaderMaterial({
    uniforms: { 
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uValue: { value: effectValue.value },
      uResolution: { value: new THREE.Vector2(container.value.clientWidth, container.value.clientHeight) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uValue;
      uniform vec2 uResolution;
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // 模糊
        if (uValue > 0.0) {
          vec4 blur = vec4(0.0);
          float off = uValue * 0.01;
          for(int x=-2; x<=2; x++) for(int y=-2; y<=2; y++) {
            blur += texture2D(tDiffuse, vUv + vec2(float(x)*off, float(y)*off));
          }
          blur /= 25.0;
          color = mix(color, blur, uValue);
        }
        
        gl_FragColor = color;
      }
    `
  })
  plane = new THREE.Mesh(quadGeom, quadMat)
  effectScene.add(plane)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([effectType, effectValue], () => {
  if (plane) plane.material.uniforms.uValue.value = effectValue.value
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()
  
  scene.traverse(obj => {
    if (obj.isMesh) obj.rotation.y += 0.01
  })
  
  renderer.setRenderTarget(renderTarget)
  renderer.render(scene, camera)
  
  plane.material.uniforms.tDiffuse.value = renderTarget.texture
  plane.material.uniforms.uTime.value = time
  plane.material.uniforms.uValue.value = effectValue.value
  
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
.panel-value { color: white; font-weight: 700; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 120px; cursor: pointer; }
</style>
