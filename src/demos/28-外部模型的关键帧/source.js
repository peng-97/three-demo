// 轨道数据
const tracks = [
  {
    name: '轨道 1',
    keyframes: [
      { time: 0, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0) },
      { time: 1.5, position: new THREE.Vector3(4, 1, 0), rotation: new THREE.Euler(0, Math.PI / 2, 0) },
      { time: 3, position: new THREE.Vector3(0, 0, 4), rotation: new THREE.Euler(0, Math.PI, 0) }
    ],
    color: 0x667eea
  }
]

// 绘制轨道线
function drawTrackLine(track) {
  const points = track.keyframes.map(kf => kf.position)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: track.color })
  const line = new THREE.LineLoop(geometry, material)
  scene.add(line)
}

// 模型组合
function createRobot() {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), material)
  body.position.y = 1.5
  group.add(body)
  return group
}
