Three.js 精灵模型
• Sprite 始终面向相机
• 程序化生成精灵纹理
• 可添加和清除精灵
• 可调整精灵大小

核心知识点：

1. Sprite (精灵)
   - 2D平面，始终面向相机
   - 适合粒子、公告牌等
   - 性能比 3D 模型更好

2. SpriteMaterial
   - map: 纹理贴图
   - 可选颜色、透明度等

3. 精灵属性
   - sprite.scale.set(x, y, 1)
   - sprite.position.set(x, y, z)
   - 自动旋转面向相机

4. CanvasTexture
   - 程序化生成纹理
   - 径向渐变、圆形等
