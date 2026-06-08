Three.js 光照系统：
• 环境光 - 全局光照
• 方向光 - 平行光，如太阳光
• 点光源 - 从一点向四周发光
• 聚光灯 - 圆锥形光

核心知识点：

1. 常用光源类型
   - AmbientLight: 环境光
   - DirectionalLight: 方向光
   - PointLight: 点光源
   - SpotLight: 聚光灯

2. 光照影响
   - 需要配合支持光照的材质
   - MeshStandardMaterial, MeshPhongMaterial等
   - 阴影效果需要额外配置

3. 光照参数
   - color: 光照颜色
   - intensity: 光照强度
   - position: 光源位置
   - castShadow: 是否投影
