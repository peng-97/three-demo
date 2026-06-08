import * as TWEEN from '@tweenjs/tween.js'

// 常用缓动函数
const tween = new TWEEN.Tween(obj.position)
  .to({ x: 10 }, 2000)
  .easing(TWEEN.Easing.Linear.None)
  .start()

// 二次缓动
.easing(TWEEN.Easing.Quadratic.In)
.easing(TWEEN.Easing.Quadratic.Out)
.easing(TWEEN.Easing.Quadratic.InOut)

// 三次缓动
.easing(TWEEN.Easing.Cubic.InOut)

// 弹性效果
.easing(TWEEN.Easing.Elastic.Out)

// 弹跳效果
.easing(TWEEN.Easing.Bounce.Out)

// 回退效果
.easing(TWEEN.Easing.Back.Out)
