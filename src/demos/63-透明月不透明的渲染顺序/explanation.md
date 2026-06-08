Three.js 透明与不透明的渲染顺序
• 渲染顺序
• 透明物体
• 不透明物体
• depthWrite

核心知识点：
1. 透明物体
   - transparent: true
   - depthWrite: false
   - 不写深度缓冲

2. 渲染顺序
   - 默认：Opaque → Transparent
   - 透明物体：depthWrite false
   - 不透明物体：depthWrite true

3. 控制方法
   - renderOrder 控制
   - 手动排序
