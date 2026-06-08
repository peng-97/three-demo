// 渲染顺序控制
// 1. 渲染顺序数值
mesh1.renderOrder = 0
mesh2.renderOrder = 1
mesh3.renderOrder = 2
// 数值大的后渲染，覆盖前面

// 2. 透明物体
const material = new THREE.MeshStandardMaterial({ 
  transparent: true,
  opacity: 0.5,
  depthWrite: false,   // 透明关闭深度写入
  depthTest: true
})

// 3. UI层
uiMesh.renderOrder = 999

// 4. 渲染顺序
// Opaque -> Transparent
