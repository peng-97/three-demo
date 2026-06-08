// Canvas标签
function createLabel(text, color) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 256
  canvas.height = 128
  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(0,0,256,128)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 75)
  
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(3, 1.5, 1)
  return sprite
}
