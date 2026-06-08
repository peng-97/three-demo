Three.js 渲染顺序
• renderOrder
• 透明渲染
• 深度测试
• 渲染管线

核心知识点：
1. 渲染顺序
   - renderOrder
   - 后写覆盖
   - 深度测试

2. 透明渲染
   - 由后到前
   - 深度写入
   - 深度测试

3. 常用设置
   - 不透明: depthTest=true, depthWrite=true
   - 透明: depthTest=true, depthWrite=false
   - UI: renderOrder=高
