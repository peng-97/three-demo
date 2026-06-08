Three.js 顶点颜色插值：
• 每个顶点可以有独立颜色
• 面内颜色自动插值
• vertexColors 属性启用

核心知识点：

1. 顶点颜色设置
   - 创建颜色数组
   - 设置到 geometry.attributes.color
   - material.vertexColors = true

2. 颜色插值原理
   - 顶点之间平滑过渡
   - 渲染时自动计算插值
   - 实现渐变效果

3. 应用场景
   - 可视化数据
   - 艺术效果
   - 高度图着色
