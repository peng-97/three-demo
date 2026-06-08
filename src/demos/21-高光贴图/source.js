// 创建金属度贴图
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
gradient.addColorStop(0, '#ffffff')
gradient.addColorStop(1, '#333333')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 256, 256)
const metalnessMap = new THREE.CanvasTexture(canvas)

// 创建标准材质并应用贴图
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  metalness: 0.5,
  roughness: 0.5,
  metalnessMap: metalnessMap
})

// 动态更新材质参数
material.metalness = 0.8
material.roughness = 0.2
material.needsUpdate = true

// 点光源影响高光效果
const pointLight = new THREE.PointLight(0xff6b6b, 1.5)
pointLight.position.set(3, 3, 3)
