Three.js 基础入门：
• 场景 Scene - 所有物体的容器
• 相机 Camera - 观察视角
• 渲染器 Renderer - 将场景渲染到页面
• 网格 Mesh - 几何体 + 材质的组合

核心知识点：

1. 基础结构
   - Scene: 容纳所有物体的场景
   - PerspectiveCamera: 透视相机，模拟人眼
   - WebGLRenderer: 渲染器，负责绘制画面

2. 网格 Mesh
   - BoxGeometry: 立方体几何体
   - MeshBasicMaterial: 基础材质，不受光照影响
   - 网格添加到场景后才可见

3. 动画循环
   - requestAnimationFrame: 浏览器原生 API
   - 每帧更新物体状态
   - 调用 renderer.render 渲染画面
