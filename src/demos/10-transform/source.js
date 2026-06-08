// 1. 平移变换
cubeMesh.position.x += 1
// 或者
cubeMesh.position.set(5, 2, 3)

// 2. 旋转变换 (单位是弧度，π = 180°)
cubeMesh.rotation.y += Math.PI / 4
// 或者
cubeMesh.rotation.set(Math.PI / 2, 0, 0)

// 3. 缩放变换 (1是原始大小)
cubeMesh.scale.set(1.2, 1.2, 1.2)
// 分别缩放
cubeMesh.scale.x = 2
cubeMesh.scale.y = 0.5

// 4. 保存和恢复状态
const originalPosition = cubeMesh.position.clone()
const originalRotation = cubeMesh.rotation.clone()
const originalScale = cubeMesh.scale.clone()
// 恢复状态
cubeMesh.position.copy(originalPosition)
cubeMesh.rotation.copy(originalRotation)
cubeMesh.scale.copy(originalScale)

