// OBJLoader 基本用法
const loader = new OBJLoader()
loader.load('model.obj', (object) => {
  scene.add(object)
})

// 程序生成复杂几何体
const geometry = new THREE.IcosahedronGeometry(4, 3)
const material = new THREE.MeshStandardMaterial({
  color: 0x4ecdc4,
  metalness: 0.3,
  roughness: 0.6,
  flatShading: true
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
