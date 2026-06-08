// 模型剖切
renderer.localClippingEnabled = true

const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
const material = new THREE.MeshStandardMaterial({ 
  color: 0x667eea,
  side: THREE.DoubleSide,
  clippingPlanes: [plane]
})

// 多个平面剖切
const planes = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), -3)
]
const material = new THREE.MeshStandardMaterial({ 
  clippingPlanes: planes,
  side: THREE.DoubleSide
})
