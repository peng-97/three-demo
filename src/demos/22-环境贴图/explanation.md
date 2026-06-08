Three.js 环境贴图
• 程序化生成环境贴图
• 演示环境反射效果
• 可调节环境强度、粗糙度、金属度
• 多种几何体展示

核心知识点：

1. 环境贴图 (Environment Map)
   - scene.environment = texture
   - material.envMap = texture
   - 使用 EquirectangularReflectionMapping

2. 环境强度 (Env Map Intensity)
   - material.envMapIntensity = 0-2
   - 控制环境反射的强度

3. 反射效果
   - 高金属度 + 低粗糙度 = 镜面反射
   - 金属会反射环境色
   - 非金属反射较弱

4. 程序化生成全景图
   - Canvas绘制渐变背景
   - 添加星星和光源效果
   - 作为环境贴图使用
