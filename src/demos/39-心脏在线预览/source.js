// 创建心脏形状
const shape = new THREE.Shape()
shape.moveTo(0, 0)
shape.bezierCurveTo(0, -0.5, -1, -0.5, -1, 0)
shape.bezierCurveTo(-1, 0.5, 0, 0.5, 0, 1)
shape.bezierCurveTo(0, 0.5, 1, 0.5, 1, 0)
shape.bezierCurveTo(1, -0.5, 0, -0.5, 0, 0)

// 挤出3D心脏
const extrudeSettings = {
  steps: 8,
  depth: 0.5,
  bevelEnabled: true
}
const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
geometry.rotateX(-Math.PI / 2)
geometry.center()

// 心跳动画
const bps = heartRate / 60
const beat = (Math.sin(time * bps * Math.PI * 2) + 1) / 2
const scale = 1 + beat * 0.3 * intensity
heart.scale.set(scale, scale, scale)
