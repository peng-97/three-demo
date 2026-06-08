// 视锥体检测
const frustum = new THREE.Frustum()
const projScreenMatrix = new THREE.Matrix4()

// 更新视锥体
function updateFrustum() {
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(projScreenMatrix)
}

// 检测物体是否可见
function isVisible(object) {
  const box = new THREE.Box3().setFromObject(object)
  return frustum.intersectsBox(box)
}

// 批量检测
objects.forEach(obj => {
  if (isVisible(obj)) {
    // 渲染
  }
})
