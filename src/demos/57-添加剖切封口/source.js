// 添加剖切封口
// 方法1: 手工添加几何
const capGeometry = new THREE.CircleGeometry(radius, segments)
const capMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff0000,
  side: THREE.DoubleSide
})
const capMesh = new THREE.Mesh(capGeometry, capMaterial)
capMesh.position.x = planePosition

// 方法2: 使用剪裁平面
const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
const mainMaterial = new THREE.MeshStandardMaterial({ 
  clippingPlanes: [plane],
  side: THREE.DoubleSide
})

// 方法3: 封口变换
capMesh.rotation.y = Math.PI / 2
capMesh.position.x = planePosition
