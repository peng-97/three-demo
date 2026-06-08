// OBJLoader + MTLLoader（支持贴图）
const manager = new THREE.LoadingManager()
const mtlLoader = new MTLLoader(manager)
const objLoader = new OBJLoader(manager)

mtlLoader.load('model.mtl', (materials) => {
  materials.preload()
  objLoader.setMaterials(materials)
  objLoader.load('model.obj', (object) => {
    scene.add(object)
  })
})

// 本地文件加载的关键：把 mtl 引用的相对贴图路径映射到 blob url
manager.setURLModifier((url) => {
  const filename = url.split('/').pop()
  return fileMap.get(filename) || url
})
