// 创建法线贴图材质
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  normalMap: normalMap,
  normalScale: new THREE.Vector2(1, 1),
  metalness: 0.3,
  roughness: 0.7
})

// 创建凹凸贴图材质
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  bumpMap: bumpMap,
  bumpScale: 1
})

// 两者结合
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  normalMap: normalMap,
  bumpMap: bumpMap,
  normalScale: new THREE.Vector2(0.5, 0.5),
  bumpScale: 0.5
})

// 程序生成简单的凹凸纹理
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const imageData = ctx.createImageData(256, 256)
for (let i = 0; i < imageData.data.length; i += 4) {
  const value = Math.random() * 255
  imageData.data[i] = value
  imageData.data[i + 1] = value
  imageData.data[i + 2] = value
  imageData.data[i + 3] = 255
}
const texture = new THREE.CanvasTexture(canvas)
