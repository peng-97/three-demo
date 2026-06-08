// 生成Canvas纹理
const canvas = document.createElement('canvas')
canvas.width = 256
canvas.height = 256
const ctx = canvas.getContext('2d')

// 渐变纹理
const gradient = ctx.createLinearGradient(0, 0, 256, 256)
gradient.addColorStop(0, '#667eea')
gradient.addColorStop(1, '#f093fb')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 256, 256)

// 创建纹理对象
const texture = new THREE.CanvasTexture(canvas)
texture.wrapS = THREE.RepeatWrapping
texture.wrapT = THREE.RepeatWrapping
texture.repeat.set(3, 3)

// 应用到材质
const material = new THREE.MeshStandardMaterial({
  map: texture
})

// 噪声纹理
const imageData = ctx.createImageData(256, 256)
for (let i = 0; i < imageData.data.length; i += 4) {
  const value = Math.random() * 255
  imageData.data[i] = value
  imageData.data[i + 1] = value
  imageData.data[i + 2] = value
  imageData.data[i + 3] = 255
}
ctx.putImageData(imageData, 0, 0)
