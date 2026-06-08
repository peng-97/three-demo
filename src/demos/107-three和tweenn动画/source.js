import * as TWEEN from '@tweenjs/tween.js'

// 创建位置动画
const tween = new TWEEN.Tween(obj.position)
  .to({ y: obj.position.y + 5 }, 1000)
  .easing(TWEEN.Easing.Quadratic.Out)
  .yoyo(true)
  .repeat(Infinity)
  .delay(200)
  .start()

// 创建旋转动画
const rotTween = new TWEEN.Tween(obj.rotation)
  .to({ y: obj.rotation.y + Math.PI * 2 }, 2000)
  .easing(TWEEN.Easing.Quadratic.InOut)
  .repeat(Infinity)
  .start()

// 动画循环中更新
function animate() {
  requestAnimationFrame(animate)
  TWEEN.update()
  renderer.render(scene, camera)
}
