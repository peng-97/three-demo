// 光照贴图
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  lightMap: lightMapTexture,
  lightMapIntensity: 1
})

// 高光/金属度/粗糙度贴图
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  metalnessMap: metalnessTexture,
  roughnessMap: roughnessTexture,
  metalness: 1,
  roughness: 1
})

// 环境贴图
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1,
  roughness: 0,
  envMap: envTexture,
  envMapIntensity: 1
})

// Canvas生成渐变纹理
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 150)
gradient.addColorStop(0, '#ffffff')
gradient.addColorStop(1, '#000000')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 256, 256)
