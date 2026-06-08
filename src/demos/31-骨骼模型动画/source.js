// 走路动画
function walkAnimation(time) {
  const s = Math.sin(time * 2)
  const c = Math.cos(time * 2)
  
  bones.legL.rotation.x = s * 0.6
  bones.legR.rotation.x = -s * 0.6
  bones.shinL.rotation.x = Math.abs(s) * 0.5
  bones.shinR.rotation.x = Math.abs(s) * 0.5
  bones.armL.rotation.x = -s * 0.4
  bones.armR.rotation.x = s * 0.4
}

// 动画切换
function nextClip() {
  currentClipIndex = (currentClipIndex + 1) % clipNames.length
  resetPose()
}
