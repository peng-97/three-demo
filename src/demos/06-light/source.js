const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
lightColors.forEach((color, i) => {
  const light = new THREE.PointLight(color, 0.8, 10);
  const angle = (i / lightColors.length) * Math.PI * 2;
  light.position.set(Math.cos(angle) * 3, 1, Math.sin(angle) * 3);
  scene.add(light);
  
  const sphereGeom = new THREE.SphereGeometry(0.1, 8, 8);
  const sphereMat = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  sphere.position.copy(light.position);
  scene.add(sphere);
});
