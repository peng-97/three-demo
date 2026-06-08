Three.js 精灵模型下雨效果
• 使用 Sprite 精灵创建雨滴
• 每个雨滴有随机的速度和位置
• Canvas 生成雨滴纹理
• 支持控制雨滴数量和开关

核心知识点：

1. Sprite 精灵
   - 始终面向相机的平面对象
   - SpriteMaterial 材质设置
   - 纹理和透明效果

2. 粒子系统技巧
   - 单个粒子的随机参数
   - 粒子循环重置
   - 性能优化（depthWrite: false）

3. Canvas 纹理
   - 动态创建雨滴纹理
   - 渐变透明效果
   - CanvasTexture 使用

4. 动画控制
   - 雨滴下落物理
   - 随机化参数
   - 性能和效果平衡
