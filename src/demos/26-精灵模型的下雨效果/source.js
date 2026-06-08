// 创建雨滴Canvas纹理
function createRainTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 32)
  gradient.addColorStop(0, 'rgba(200, 220, 255, 0)')
  gradient.addColorStop(0.5, 'rgba(200, 220, 255, 1)')
  gradient.addColorStop(1, 'rgba(200, 220, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(6, 0, 4, 32)
  
  return new THREE.CanvasTexture(canvas)
}

// 创建单个雨滴
function createRainDrop(texture) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const sprite = new THREE.Sprite(material)
  
  sprite.position.set(
    (Math.random() - 0.5) * 40,
    Math.random() * 30 + 10,
    (Math.random() - 0.5) * 40
  )
  
  const scale = Math.random() * 0.5 + 0.3
  sprite.scale.set(scale * 0.3, scale, 1)
  
  sprite.userData.speed = Math.random() * 15 + 10
  
  return sprite
}

// 动画循环
function animate() {
  const delta = clock.getDelta()
  
  rainGroup.children.forEach(sprite => {
    sprite.position.y -= sprite.userData.speed * delta
    
    if (sprite.position.y < 0) {
      sprite.position.y = sprite.userData.initialY
    }
  })
}
