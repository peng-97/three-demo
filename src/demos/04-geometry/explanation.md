Three.js 几何体系统：
• 基础几何体 - Box, Sphere, Plane等
• BufferGeometry - 高效的几何数据
• 参数化创建 - 通过参数生成复杂形状

核心知识点：

1. 常用基础几何体
   - BoxGeometry: 立方体
   - SphereGeometry: 球体
   - PlaneGeometry: 平面
   - CylinderGeometry: 圆柱体

2. 几何体与材质分离
   - 一个几何体可用于多个Mesh
   - 节省内存资源
   - 便于统一修改

3. BufferGeometry 原理
   - 顶点数据存储在Buffer中
   - 支持自定义顶点属性
   - 高性能渲染
