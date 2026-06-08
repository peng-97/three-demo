const geometries = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.SphereGeometry(0.7, 32, 32),
  new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32),
  new THREE.ConeGeometry(0.7, 1.5, 32),
  new THREE.TorusGeometry(0.6, 0.2, 16, 100),
  new THREE.OctahedronGeometry(0.8)
];

geometries.forEach((geometry, i) => {
  const material = new THREE.MeshLambertMaterial({ color: colors[i] });
  const mesh = new THREE.Mesh(geometry, material);
  const angle = (i / geometries.length) * Math.PI * 2;
  mesh.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
  scene.add(mesh);
});
