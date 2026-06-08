// 创建精灵纹理
const canvas = document.createElement('canvas')
canvas.width = 256
canvas.height = 256
const ctx = canvas.getContext('2d')
const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
gradient.addColorStop(0, '#ff6b6b')
gradient.addColorStop(1, '#ff6b6b00')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 256, 256)
const texture = new THREE.CanvasTexture(canvas)

// 创建精灵
const material = new THREE.SpriteMaterial({ map: texture })
const sprite = new THREE.Sprite(material)
sprite.position.set(0, 5, 0)
sprite.scale.set(2, 2, 1)
scene.add(sprite)

// 精灵会自动面向相机
