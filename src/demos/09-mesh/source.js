// 1. 创建点模型
const pointPositions = new Float32Array([-5, 2, 0, -3, 3, 0, -4, 0, 0]);
const pointGeometry = new THREE.BufferGeometry()
pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
const pointMaterial = new THREE.PointsMaterial({ color: 0xff6b6b, size: 0.3 })
const pointMesh = new THREE.Points(pointGeometry, pointMaterial)
scene.add(pointMesh)

// 2. 创建线模型
const linePositions = new Float32Array([0, 3, 0, 2, 4, 0, 3, 2, 0, 1, 1, 0, 0, 3, 0])
const lineGeometry = new THREE.BufferGeometry()
lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4 })
const lineMesh = new THREE.Line(lineGeometry, lineMaterial)
scene.add(lineMesh)

// 3. 创建网格模型
const cubeGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5)
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea })
const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
scene.add(cubeMesh)

