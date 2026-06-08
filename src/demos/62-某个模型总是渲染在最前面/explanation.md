Three.js 某个模型总是渲染在最前面
• renderOrder
• 深度测试
• 渲染顺序
• 覆盖

核心知识点：
1. renderOrder
   - 数值大后渲染
   - 后渲染覆盖前面
   - 控制渲染顺序

2. 深度测试
   - depthTest: false
   - depthWrite: false
   - 不写深度缓冲

3. 使用方法
   - 方法1: renderOrder = 999
   - 方法2: depthTest = false
