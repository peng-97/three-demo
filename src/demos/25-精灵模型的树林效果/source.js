// 创建树纹理
const canvas = document.createElement('canvas')
canvas.width = 256
canvas.height = 512
const ctx = canvas.getContext('2d')

ctx.fillStyle = '#5d4037'
ctx.fillRect(118, 350, 20, 160)

const gradient = ctx.createRadialGradient(128, 200, 0, 128, 200, 150)
gradient.addColorStop(0, '#81c784')
gradient.addColorStop(1, '#2e7d32')
ctx.fillStyle = gradient
ctx.beginPath()
ctx.moveTo(128, 50)
ctx.lineTo(50, 250)
ctx.lineTo(206, 250)
ctx.closePath()
ctx.fill()

const treeTexture = new THREE.CanvasTexture(canvas)

// 生成树林
for (let i = 0; i < 100; i++) {
  const material = new THREE.SpriteMaterial({ map: treeTexture })
  const tree = new THREE.Sprite(material)
  const angle = Math.random() * Math.PI * 2
  const radius = 5 + Math.random() * 40
  tree.position.set(
    Math.cos(angle) * radius,
    3,
    Math.sin(angle) * radius
  )
  const scale = 3 + Math.random() * 4
  tree.scale.set(scale, scale * 2, 1)
  scene.add(tree)
}
