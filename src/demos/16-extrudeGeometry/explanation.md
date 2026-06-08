Three.js 拉伸几何体：
• 将 2D Shape 沿路径拉伸为 3D 物体
• ExtrudeGeometry 提供丰富的拉伸选项
• 支持斜角、孔洞、路径拉伸

核心知识点：

1. ExtrudeSettings 参数
   - depth: 拉伸深度
   - steps: 拉伸分段数
   - bevelEnabled: 是否启用斜角
   - bevelThickness: 斜角厚度
   - bevelSize: 斜角大小
   - bevelSegments: 斜角分段数

2. 拉伸特性
   - 带孔洞：使用 shape.holes.push(path)
   - 沿路径：使用 extrudePath
   - 斜角效果：bevelSegments 控制平滑度
   - geometry.center() 居中对齐

3. 应用场景
   - 文字 3D 化
   - Logo 3D 化
   - 建筑建模
   - 复杂截面拉伸
