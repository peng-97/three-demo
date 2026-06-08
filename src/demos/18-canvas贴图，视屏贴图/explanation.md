Three.js Canvas和视频纹理
• 实时Canvas绘图作为纹理
• 支持Canvas动画效果
• 演示多种几何体的应用

核心知识点：

1. CanvasTexture
   - 使用Canvas元素创建纹理
   - texture.needsUpdate = true 强制更新
   - 每帧重新绘制Canvas

2. Canvas绘图
   - ctx.fillStyle 设置颜色
   - ctx.arc 绘制圆弧
   - ctx.stroke 绘制线条
   - 正弦/余弦创建波动效果

3. 动画循环
   - time变量控制动画进度
   - Math.sin/Math.cos 波动
   - 逐帧更新Canvas内容
