Three.js 和 Tween.js 动画
• 使用 @tweenjs/tween.js 创建流畅动画
• 展示位移、旋转、缩放动画
• yoyo 反弹效果和重复动画

核心知识点：

1. TWEEN.Tween 基础
   - 创建 Tween 实例
   - 设置起点和终点属性
   - 指定动画时长

2. 缓动函数
   - TWEEN.Easing.Quadratic
   - TWEEN.Easing.Elastic
   - 各种内置缓动效果

3. 高级特性
   - yoyo(true) 反弹效果
   - repeat(Infinity) 无限循环
   - delay() 延迟开始
   - 链式调用多个属性动画

4. 更新循环
   - TWEEN.update() 在动画循环中调用
   - 多个 Tween 同时运行
   - 性能考虑
