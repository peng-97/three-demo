// FBXLoader加载骨骼模型
const loader = new FBXLoader()
loader.load('model.fbx', (object) => {
  object.traverse(child => {
    if (child.isMesh) { child.castShadow = true }
  })
  mixer = new THREE.AnimationMixer(object)
  if (object.animations.length) {
    mixer.clipAction(object.animations[0]).play()
  }
  scene.add(object)
})

// 骨骼层级创建
const root = new THREE.Bone()
const torso = new THREE.Bone()
const head = new THREE.Bone()
root.add(torso)
torso.add(head)
torso.position.y = 5
head.position.y = 3
