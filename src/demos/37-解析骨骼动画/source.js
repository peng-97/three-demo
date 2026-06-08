// 动画解析系统
const animations = {
  idle(t) {
    bones.torso.rotation.z = Math.sin(t * 2) * 0.05
    bones.head.rotation.y = Math.sin(t) * 0.2
  },
  walk(t) {
    bones.hipL.rotation.x = Math.sin(t * 2) * 0.7
    bones.hipR.rotation.x = Math.sin(t * 2 + Math.PI) * 0.7
  }
}

// 播放动画
function playAnimation(name, time) {
  Object.values(bones).forEach(b => b.rotation.set(0,0,0))
  animations[name](time)
}
