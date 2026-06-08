// Z-fighting 修复
// 方法1: Polygon Offset
const material = new THREE.MeshStandardMaterial({ 
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1
})

// 方法2: 距离分离
mesh1.position.z = 0
mesh2.position.z = 0.1
mesh3.position.z = 0.2

// 方法3: 层级分离
mesh1.renderOrder = 1
mesh2.renderOrder = 2
mesh3.renderOrder = 3

// 方法4: 对数深度缓冲
const renderer = new THREE.WebGLRenderer({ 
  logarithmicDepthBuffer: true 
})
