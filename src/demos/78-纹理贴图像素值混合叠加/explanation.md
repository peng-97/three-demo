Three.js 纹理贴图：
• 纹理是给3D模型添加表面细节的图片
• 支持多种纹理类型：基础贴图、法线贴图、高光贴图等
• 纹理坐标(UV)决定纹理如何映射到几何体

核心知识点：

1. 纹理加载
   - TextureLoader: 加载图片作为纹理
   - 支持jpg、png等常见格式
   - 纹理需要等待加载完成

2. 纹理属性
   - wrapS/wrapT: 纹理包裹方式
   - repeat: 纹理重复次数
   - offset: 纹理偏移
   - rotation: 纹理旋转

3. 纹理过滤
   - minFilter/magFilter: 缩小/放大过滤
   - anisotropy: 各向异性过滤