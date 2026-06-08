// 关键帧数据
const keyframes = [
  { time: 0, position: new THREE.Vector3(-5, 0, 0), rotation: new THREE.Euler(0, 0, 0) },
  { time: 1, position: new THREE.Vector3(0, 3, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0) },
  { time: 2, position: new THREE.Vector3(5, 0, 0), rotation: new THREE.Euler(Math.PI, Math.PI, 0) }
]

// 线性插值
function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpVector3(a, b, t) {
  return new THREE.Vector3(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t)
  )
}

// 应用动画帧
function applyFrame(t) {
  let prev = keyframes[0], next = keyframes[1]
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      prev = keyframes[i]
      next = keyframes[i + 1]
      break
    }
  }
  const localT = (t - prev.time) / (next.time - prev.time)
  mesh.position.copy(lerpVector3(prev.position, next.position, localT))
}
