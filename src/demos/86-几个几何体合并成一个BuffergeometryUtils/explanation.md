Three.js 86-几个几何体合并成一个BuffergeometryUtils
• 这是一个关于86-几个几何体合并成一个BuffergeometryUtils的演示
• 使用Three.js实现的基础示例
• 包含基本的交互控制

核心知识点：

1. 场景设置
   - Scene: 场景容器
   - Camera: 透视相机
   - Renderer: WebGL渲染器

2. 3D对象
   - TorusKnotGeometry: 环形结几何体
   - MeshStandardMaterial: PBR材质
   - OrbitControls: 轨道控制

3. 光照和辅助
   - AmbientLight: 环境光
   - DirectionalLight: 平行光
   - GridHelper: 网格辅助线

4. 动画循环
   - requestAnimationFrame: 帧动画
   - rotation: 旋转属性
   - controls.update(): 更新控制
