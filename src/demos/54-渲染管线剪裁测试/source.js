// 剪裁平面
renderer.localClippingEnabled = true

const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
const material = new THREE.MeshStandardMaterial({ 
  color: 0x667eea,
  clippingPlanes: [plane]
})

// 多个剪裁平面
const planeX = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const material = new THREE.MeshStandardMaterial({ 
  clippingPlanes: [planeX, planeY]
})
