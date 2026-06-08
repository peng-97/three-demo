// 创建Catmull-Rom曲线
const points = [
  new THREE.Vector3(-5, 0, 0),
  new THREE.Vector3(-3, 3, 2),
  new THREE.Vector3(0, -1, -2),
  new THREE.Vector3(3, 3, 1),
  new THREE.Vector3(5, 0, 0)
];
const curve = new THREE.CatmullRomCurve3(points);

// 创建管道
const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 16, false);
const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea });
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);