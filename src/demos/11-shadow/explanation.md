Three.js 阴影效果实现：
• 渲染器开启阴影 - 需要支持阴影
• 光源开启阴影 - 只有特定光源可投影
• 物体投射阴影 - castShadow = true
• 物体接收阴影 - receiveShadow = true

核心知识点：

1. 渲染器设置
   - renderer.shadowMap.enabled = true
   - 可选设置 shadowMap.type 提升质量

2. 光源设置
   - DirectionalLight 和 SpotLight 支持阴影
   - light.castShadow = true

3. 物体设置
   - mesh.castShadow = true
   - mesh.receiveShadow = true
   - 通常地面设置为接收阴影

4. 材质要求
   - 需要使用支持光照的材质
   - MeshStandardMaterial, MeshPhongMaterial 等
