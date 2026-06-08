Three.js WebGL渲染离屏渲染
• RenderTarget离屏渲染
• 后处理着色器效果
• 多种滤镜效果切换
• 实时参数调整

核心知识点：
1. 离屏渲染
   - WebGLRenderTarget
   - 先渲染到纹理
   - 再应用效果

2. 后处理效果
   - 模糊效果
   - 反色效果
   - 边缘检测
   - 灰度效果

3. 渲染流程
   - 渲染场景到RenderTarget
   - 用Post Shader处理纹理
   - 渲染到屏幕
