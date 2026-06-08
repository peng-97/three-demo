Three.js 光照贴图、高光贴图、环境贴图
• 程序生成光照贴图
• 高光贴图控制反光区域
• 环境贴图模拟环境反射

核心知识点：

1. 光照贴图 Light Map
   - material.lightMap = texture
   - material.lightMapIntensity = value
   - 预计算的光照信息

2. 高光贴图 Specular Map
   - material.metalnessMap 控制金属度
   - material.roughnessMap 控制粗糙度
   - 不同区域不同的反光效果

3. 环境贴图 Environment Map
   - material.envMap = texture
   - material.envMapIntensity = value
   - 模拟周围环境的反射
