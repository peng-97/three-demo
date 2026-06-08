// 创建骨骼
function createBone(name, length, color, parent) {
  const geometry = new THREE.BoxGeometry(0.3, length, 0.3)
  const material = new THREE.MeshStandardMaterial({ color: color })
  const boneMesh = new THREE.Mesh(geometry, material)
  
  const bone = new THREE.Bone()
  bone.add(boneMesh)
  boneMesh.position.y = length / 2
  
  if (parent) parent.add(bone)
  return bone
}

// 创建骨骼结构
const root = new THREE.Bone()
const hip = createBone('hip', 0.2, 0x667eea, root)
const spine = createBone('spine', 1.8, 0x4ecdc4, hip)
const head = createBone('head', 1, 0xfeca57, spine)

// 骨骼辅助
const skeletonHelper = new THREE.SkeletonHelper(root)
scene.add(skeletonHelper)

// 走路动画
function walkAnimation(time) {
  const s = Math.sin(time * 2)
  
  bones.legL.rotation.x = s * 0.6
  bones.legR.rotation.x = -s * 0.6
  bones.armL.rotation.x = -s * 0.4
  bones.armR.rotation.x = s * 0.4
  
  skeletonHelper.update()
}
