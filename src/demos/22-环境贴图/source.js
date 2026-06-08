// 创建环境贴图
const canvas = document.createElement('canvas')
canvas.width = 1024
canvas.height = 512
const ctx = canvas.getContext('2d')
const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
skyGradient.addColorStop(0, '#1a1a2e')
skyGradient.addColorStop(1, '#e94560')
ctx.fillStyle = skyGradient
ctx.fillRect(0, 0, 1024, 512)
const texture = new THREE.CanvasTexture(canvas)
texture.mapping = THREE.EquirectangularReflectionMapping

// 设置场景环境
scene.environment = texture

// 材质使用环境贴图
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0.1,
  envMap: texture,
  envMapIntensity: 1
})

// 动态更新参数
material.envMapIntensity = 1.5
material.roughness = 0.05
material.needsUpdate = true
