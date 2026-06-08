// 创建粒子纹理
function createParticleTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, color + '00')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

// 创建爆炸粒子
function createExplosion() {
  for (let i = 0; i < count; i++) {
    const material = new THREE.SpriteMaterial({
      map: createParticleTexture(color),
      blending: THREE.AdditiveBlending,
      transparent: true
    })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(0, 3, 0)
    scene.add(sprite)
    
    const speed = 2 + Math.random() * 5
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed + 2,
        (Math.random() - 0.5) * speed
      ),
      gravity: -9.8,
      lifetime: 2,
      age: 0
    })
  }
}

// 更新粒子
function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.age += delta
    
    if (p.age >= p.lifetime) {
      scene.remove(p.mesh)
      particles.splice(i, 1)
      continue
    }
    
    p.velocity.y += p.gravity * delta
    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta))
    p.mesh.material.opacity = 1 - p.age / p.lifetime
  }
}
