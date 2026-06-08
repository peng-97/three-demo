Three.js 正射投影和透视投影相机
• 两种相机类型的对比演示
• 可切换相机类型
• 透视相机可调节视场角 (FOV)
• 正射相机可调节缩放

核心知识点：

1. 透视相机 (PerspectiveCamera)
   - 模拟人眼的透视效果
   - 近大远小
   - 参数: fov, aspect, near, far
   - fov: 视场角（视野角度）

2. 正射相机 (OrthographicCamera)
   - 无透视效果，物体大小不随距离变化
   - 适合工程图、2D游戏
   - 参数: left, right, top, bottom, near, far

3. 两者对比
   - 透视: 真实感强，3D效果明显
   - 正射: 测量准确，无透视畸变

4. 相机属性更新
   - camera.fov = angle
   - camera.updateProjectionMatrix()
