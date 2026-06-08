Three.js 纹理贴图
• 使用Canvas动态生成纹理
• 支持多种纹理类型：渐变、棋盘格、噪声、条纹
• 纹理重复控制
• 多种几何体展示

核心知识点：

1. 纹理类型
   - CanvasTexture: Canvas动态生成的纹理
   - 支持wrapS/wrapT: RepeatWrapping
   - texture.repeat.set(x, y): 控制重复

2. Canvas绘图
   - 线性渐变 createLinearGradient
   - 像素操作 createImageData
   - 多种绘图模式

3. 材质使用
   - material.map = texture
   - material.needsUpdate = true 强制刷新

4. 多种几何体
   - Box、Sphere、Cylinder
   - 不同UV映射效果
