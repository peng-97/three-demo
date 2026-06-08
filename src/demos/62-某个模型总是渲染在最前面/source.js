// 让物体总在最前
// 方法1: renderOrder
mesh.renderOrder = 999

// 方法2: 关闭深度测试
mesh.material.depthTest = false
mesh.material.depthWrite = false

// 方法3: 两者结合
mesh.renderOrder = 999
mesh.material.depthTest = false
