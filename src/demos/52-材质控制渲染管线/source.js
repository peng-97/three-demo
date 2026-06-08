// 三种渲染模式
const geometry = new THREE.TorusKnotGeometry(3, 1, 128, 32)

// 1. 填充模式
const fillMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea })
const fillMesh = new THREE.Mesh(geometry, fillMaterial)

// 2. 线框模式
const lineMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x667eea, 
  wireframe: true 
})
const lineMesh = new THREE.Mesh(geometry, lineMaterial)

// 3. 点模式
const pointMaterial = new THREE.PointsMaterial({ 
  color: 0x667eea, 
  size: 3,
  sizeAttenuation: true 
})
const pointMesh = new THREE.Points(geometry, pointMaterial)
