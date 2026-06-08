const loader = new STLLoader()
loader.load('model.stl', (geometry) => {
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  geometry.center()

  const material = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    roughness: 0.55,
    metalness: 0.25
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
})
