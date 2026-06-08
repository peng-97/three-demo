Three.js 材质系统：
• 基础材质 - 不受光照影响
• PBR材质 - 物理真实感渲染
• 多种材质类型 - 满足不同需求

核心知识点：

1. 常用材质类型
   - MeshBasicMaterial: 基础材质
   - MeshStandardMaterial: 标准PBR材质
   - MeshPhongMaterial: 高光材质
   - PointsMaterial: 点材质

2. PBR材质参数
   - color: 颜色
   - metalness: 金属度
   - roughness: 粗糙度
   - emissive: 自发光

3. 材质特点
   - 可复用，多个Mesh可共享
   - 支持透明效果
   - 支持纹理贴图
