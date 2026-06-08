// 1. 创建圆
const circleCurve = new THREE.CircleCurve3(new THREE.Vector3(0, 0, 0), 3)
const circlePoints = circleCurve.getPoints(50)
const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints)
const circleMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4 })
const circleLine = new THREE.Line(circleGeometry, circleMaterial)
scene.add(circleLine)

// 2. 创建二次贝塞尔曲线
const quadCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-5, 0, 0),
  new THREE.Vector3(0, 5, 0),
  new THREE.Vector3(5, 0, 0)
)
const quadPoints = quadCurve.getPoints(50)
const quadGeometry = new THREE.BufferGeometry().setFromPoints(quadPoints)
const quadMaterial = new THREE.LineBasicMaterial({ color: 0xa8e6cf })
const quadLine = new THREE.Line(quadGeometry, quadMaterial)
scene.add(quadLine)

// 3. 创建三次贝塞尔曲线
const cubicCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-5, 0, 0),
  new THREE.Vector3(-2, 5, 2),
  new THREE.Vector3(2, -5, -2),
  new THREE.Vector3(5, 0, 0)
)
const cubicPoints = cubicCurve.getPoints(50)
const cubicGeometry = new THREE.BufferGeometry().setFromPoints(cubicPoints)
const cubicMaterial = new THREE.LineBasicMaterial({ color: 0xffd93d })
const cubicLine = new THREE.Line(cubicGeometry, cubicMaterial)
scene.add(cubicLine)

// 4. 创建 CatmullRom 曲线
const catmullPoints = [
  new THREE.Vector3(-5, 0, 0),
  new THREE.Vector3(-3, 2, 3),
  new THREE.Vector3(0, -1, -2),
  new THREE.Vector3(3, 3, 1),
  new THREE.Vector3(5, 0, 0)
]
const catmullCurve = new THREE.CatmullRomCurve3(catmullPoints)
const catmullGeomPoints = catmullCurve.getPoints(50)
const catmullGeometry = new THREE.BufferGeometry().setFromPoints(catmullGeomPoints)
const catmullMaterial = new THREE.LineBasicMaterial({ color: 0xff9ff3 })
const catmullLine = new THREE.Line(catmullGeometry, catmullMaterial)
scene.add(catmullLine)

// 5. 创建管道
const tubeCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-5, 0, 0),
  new THREE.Vector3(-3, 3, 2),
  new THREE.Vector3(0, -2, -1),
  new THREE.Vector3(3, 4, 1),
  new THREE.Vector3(5, 0, 0)
])
const tubeGeometry = new THREE.TubeGeometry(tubeCurve, 64, 0.5, 16, false)
const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.3, roughness: 0.7 })
const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
scene.add(tubeMesh)
