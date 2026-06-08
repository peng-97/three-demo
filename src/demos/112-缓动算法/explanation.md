Three.js 缓动算法演示
• 展示 @tweenjs/tween.js 所有缓动函数
• 直观对比不同缓动效果
• 支持单种缓动和自动全部演示

核心知识点：

1. 缓动函数分类
   - Linear: 线性匀速
   - Quadratic: 二次曲线
   - Cubic: 三次曲线
   - Elastic: 弹性效果
   - Bounce: 弹跳效果
   - Back: 回退效果
   - Circular: 圆形曲线
   - Exponential: 指数曲线

2. 缓动方向
   - In: 缓入 (开始慢, 后面快)
   - Out: 缓出 (开始快, 后面慢)
   - InOut: 缓入缓出 (两端慢, 中间快)

3. 使用方式
   - easing(TWEEN.Easing.Quadratic.Out)
   - 在 Tween 链式调用中设置
