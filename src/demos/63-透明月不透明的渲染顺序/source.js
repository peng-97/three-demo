// 不透明物体
const opaqueMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff0000,
  depthWrite: true
})

// 透明物体
const transparentMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5,
  depthWrite: false
})

// 渲染顺序
// 默认：Opaque → Transparent
// Transparent: depthWrite false
