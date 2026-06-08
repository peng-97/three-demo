// 1. 创建矩形
const rectShape = new THREE.Shape()
rectShape.moveTo(-3, -2)
rectShape.lineTo(3, -2)
rectShape.lineTo(3, 2)
rectShape.lineTo(-3, 2)
rectShape.closePath()
const rectGeometry = new THREE.ShapeGeometry(rectShape)
const rectMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, side: THREE.DoubleSide })
const rectMesh = new THREE.Mesh(rectGeometry, rectMaterial)
scene.add(rectMesh)

// 2. 创建三角形
const triShape = new THREE.Shape()
triShape.moveTo(0, 3)
triShape.lineTo(3, -2)
triShape.lineTo(-3, -2)
triShape.closePath()
const triGeometry = new THREE.ShapeGeometry(triShape)
const triMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, side: THREE.DoubleSide })
const triMesh = new THREE.Mesh(triGeometry, triMaterial)
scene.add(triMesh)

// 3. 创建圆角矩形
const radius = 0.8
const roundRectShape = new THREE.Shape()
roundRectShape.moveTo(-3, -2 + radius)
roundRectShape.lineTo(-3, 2 - radius)
roundRectShape.quadraticCurveTo(-3, 2, -3 + radius, 2)
roundRectShape.lineTo(3 - radius, 2)
roundRectShape.quadraticCurveTo(3, 2, 3, 2 - radius)
roundRectShape.lineTo(3, -2 + radius)
roundRectShape.quadraticCurveTo(3, -2, 3 - radius, -2)
roundRectShape.lineTo(-3 + radius, -2)
roundRectShape.quadraticCurveTo(-3, -2, -3, -2 + radius)
const roundRectGeometry = new THREE.ShapeGeometry(roundRectShape)
const roundRectMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, side: THREE.DoubleSide })
const roundRectMesh = new THREE.Mesh(roundRectGeometry, roundRectMaterial)
scene.add(roundRectMesh)

// 4. 创建心形
const heartShape = new THREE.Shape()
heartShape.moveTo(0, 0.5)
heartShape.bezierCurveTo(0, 0.5, -2, 2, -2.5, 0)
heartShape.bezierCurveTo(-2.5, -2, 0, -2, 0, -1)
heartShape.bezierCurveTo(0, -2, 2.5, -2, 2.5, 0)
heartShape.bezierCurveTo(2.5, 2, 0, 0.5, 0, 0.5)
const heartGeometry = new THREE.ShapeGeometry(heartShape)
const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, side: THREE.DoubleSide })
const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial)
scene.add(heartMesh)

// 5. 创建星形
const starShape = new THREE.Shape()
const starPts = [], numStarPoints = 5
for (let i = 0; i < numStarPoints * 2; i++) {
  const l = i % 2 == 1 ? 3 : 1.5
  const a = i / numStarPoints * Math.PI
  starPts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l))
}
starShape.moveTo(starPts[0].x, starPts[0].y)
for (let i = 1; i < starPts.length; i++) {
  starShape.lineTo(starPts[i].x, starPts[i].y)
}
starShape.closePath()
const starGeometry = new THREE.ShapeGeometry(starShape)
const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffd93d, side: THREE.DoubleSide })
const starMesh = new THREE.Mesh(starGeometry, starMaterial)
scene.add(starMesh)

// 6. 创建六边形
const hexShape = new THREE.Shape()
const hexSides = 6
const hexPts = []
for (let i = 0; i < hexSides; i++) {
  const a = (i / hexSides) * Math.PI * 2
  hexPts.push(new THREE.Vector2(Math.cos(a) * 2.5, Math.sin(a) * 2.5))
}
hexShape.moveTo(hexPts[0].x, hexPts[0].y)
for (let i = 1; i < hexPts.length; i++) {
  hexShape.lineTo(hexPts[i].x, hexPts[i].y)
}
hexShape.closePath()
const hexGeometry = new THREE.ShapeGeometry(hexShape)
const hexMaterial = new THREE.MeshStandardMaterial({ color: 0xa8e6cf, side: THREE.DoubleSide })
const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial)
scene.add(hexMesh)
