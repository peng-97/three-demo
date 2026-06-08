// 1. 基础拉伸矩形
const rectShape = new THREE.Shape()
rectShape.moveTo(-2, -1.5)
rectShape.lineTo(2, -1.5)
rectShape.lineTo(2, 1.5)
rectShape.lineTo(-2, 1.5)
rectShape.closePath()
const rectExtrudeSettings = { 
  steps: 2, 
  depth: 3, 
  bevelEnabled: true, 
  bevelThickness: 0.3, 
  bevelSize: 0.3, 
  bevelOffset: 0, 
  bevelSegments: 1 
}
const rectGeometry = new THREE.ExtrudeGeometry(rectShape, rectExtrudeSettings)
const rectMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea })
const rectMesh = new THREE.Mesh(rectGeometry, rectMaterial)
scene.add(rectMesh)

// 2. 拉伸心形
const heartShape = new THREE.Shape()
heartShape.moveTo(0, 0.5)
heartShape.bezierCurveTo(0, 0.5, -2, 2, -2.5, 0)
heartShape.bezierCurveTo(-2.5, -2, 0, -2, 0, -1)
heartShape.bezierCurveTo(0, -2, 2.5, -2, 2.5, 0)
heartShape.bezierCurveTo(2.5, 2, 0, 0.5, 0, 0.5)
const heartExtrudeSettings = { 
  steps: 2, 
  depth: 2, 
  bevelEnabled: true, 
  bevelThickness: 0.2, 
  bevelSize: 0.2, 
  bevelOffset: 0, 
  bevelSegments: 1 
}
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, heartExtrudeSettings)
const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b })
const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial)
scene.add(heartMesh)

// 3. 带洞的拉伸
const holeShape = new THREE.Shape()
holeShape.moveTo(-3, -2)
holeShape.lineTo(3, -2)
holeShape.lineTo(3, 2)
holeShape.lineTo(-3, 2)
holeShape.closePath()
const hole = new THREE.Path()
hole.moveTo(-1, -1)
hole.lineTo(1, -1)
hole.lineTo(1, 1)
hole.lineTo(-1, 1)
hole.closePath()
holeShape.holes.push(hole)
const holeExtrudeSettings = { 
  steps: 2, 
  depth: 2, 
  bevelEnabled: true, 
  bevelThickness: 0.3, 
  bevelSize: 0.3, 
  bevelOffset: 0, 
  bevelSegments: 1 
}
const holeGeometry = new THREE.ExtrudeGeometry(holeShape, holeExtrudeSettings)
const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4 })
const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial)
scene.add(holeMesh)

// 4. 斜角拉伸
const bevelShape = new THREE.Shape()
const hexSides = 6
const hexPts = []
for (let i = 0; i < hexSides; i++) {
  const a = (i / hexSides) * Math.PI * 2
  hexPts.push(new THREE.Vector2(Math.cos(a) * 2, Math.sin(a) * 2))
}
bevelShape.moveTo(hexPts[0].x, hexPts[0].y)
for (let i = 1; i < hexPts.length; i++) {
  bevelShape.lineTo(hexPts[i].x, hexPts[i].y)
}
bevelShape.closePath()
const bevelExtrudeSettings = { 
  steps: 2, 
  depth: 2, 
  bevelEnabled: true, 
  bevelThickness: 0.5, 
  bevelSize: 0.5, 
  bevelOffset: 0, 
  bevelSegments: 4 
}
const bevelGeometry = new THREE.ExtrudeGeometry(bevelShape, bevelExtrudeSettings)
const bevelMaterial = new THREE.MeshStandardMaterial({ color: 0xffd93d })
const bevelMesh = new THREE.Mesh(bevelGeometry, bevelMaterial)
scene.add(bevelMesh)
