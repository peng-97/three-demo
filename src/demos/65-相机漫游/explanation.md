Three.js 相机系统：
• PerspectiveCamera: 透视相机，模拟人眼
• OrthographicCamera: 正交相机，无透视效果
• 相机控制：OrbitControls等

核心知识点：

1. 透视相机
   - fov: 视场角
   - aspect: 宽高比
   - near/far: 近/远裁剪面

2. 正交相机
   - left/right/top/bottom: 视口边界
   - 适用于2D游戏、UI

3. 相机动画
   - 更新position
   - 更新lookAt
   - 使用Tween实现平滑过渡