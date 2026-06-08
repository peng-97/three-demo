// 1. 屏幕坐标转归一化设备坐标 (NDC)
const x = event.clientX - rect.left
const y = event.clientY - rect.top
mouse.x = ((x / rect.width) - 0.5) * 2
mouse.y = -((y / rect.height) - 0.5) * 2

// 2. 使用光线投射器
raycaster.setFromCamera(mouse, camera)
const intersects = raycaster.intersectObject(ground)

// 3. 处理交点
if (intersects.length > 0) {
  const point = intersects[0].point
  marker.position.copy(point)
  marker.visible = true
}

// 4. 世界坐标 ↔ 局部坐标转换
const worldPos = new THREE.Vector3()
object.getWorldPosition(worldPos)

const localPos = object.worldToLocal(worldPos.clone())
const worldPos2 = object.localToWorld(localPos.clone())
