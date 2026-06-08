Three.js 顶点级操作：
• 直接操作顶点数据
• BufferAttribute - 顶点数据容器
• 动态修改几何体

核心知识点：

1. 顶点数据结构
   - position: 顶点位置
   - color: 顶点颜色
   - normal: 法线
   - uv: 纹理坐标

2. 操作流程
   - 获取 geometry.attributes.position
   - 直接修改数组元素
   - 标记 needsUpdate = true

3. 应用场景
   - 自定义形状
   - 顶点动画
   - 粒子系统
