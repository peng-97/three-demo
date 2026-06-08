Three.js 雾化效果
• 实现距离雾效果
• 支持线性雾化和指数雾化
• 营造真实的场景深度感

核心知识点：

1. 雾化类型
   - Fog: 线性雾化
   - FogExp2: 指数雾化 (更自然)

2. 线性雾化 (Fog)
   - near: 雾化开始距离
   - far: 雾化完全不透明距离
   - scene.fog = new THREE.Fog(color, near, far)

3. 指数雾化 (FogExp2)
   - density: 雾化密度
   - scene.fog = new THREE.FogExp2(color, density)

4. 背景色
   - scene.background 颜色需要与雾化颜色一致
   - 这样雾效果才自然

5. 视觉效果
   - 远处物体逐渐融入背景
   - 增强场景深度感和氛围
