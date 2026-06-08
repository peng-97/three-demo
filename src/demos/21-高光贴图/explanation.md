Three.js 高光贴图
• 演示金属度和粗糙度对高光的影响
• 程序化生成高光贴图
• 可调节材质参数
• 多个几何体同时展示

核心知识点：

1. 金属度 (Metalness)
   - material.metalness = 0-1
   - 0表示电介质（非金属）
   - 1表示金属
   - 金属会反射环境色

2. 粗糙度 (Roughness)
   - material.roughness = 0-1
   - 0表示完全光滑（镜面反射）
   - 1表示完全粗糙（漫反射）
   - 与高光效果直接相关

3. 高光贴图 (Metalness Map)
   - material.metalnessMap = texture
   - 灰度图控制不同区域的金属度
   - 白色 = 金属，黑色 = 非金属

4. 点光源动画
   - 动态位置变化
   - 观察高光随光源移动
