Three.js 形状几何体：
• 使用 Shape 类定义 2D 形状
• 通过 ShapeGeometry 生成几何体
• 支持直线、曲线、贝塞尔曲线绘制

核心知识点：

1. Shape 基础方法
   - moveTo: 移动到起点
   - lineTo: 画直线到指定点
   - closePath: 闭合路径
   - quadraticCurveTo: 二次贝塞尔曲线
   - bezierCurveTo: 三次贝塞尔曲线

2. 常见形状
   - 矩形：四个角点
   - 三角形：三个顶点
   - 圆角矩形：二次贝塞尔曲线做圆角
   - 心形：三次贝塞尔曲线
   - 星形：交替半径的多边形
   - 正多边形：等分圆周

3. 特性
   - side: THREE.DoubleSide 双面渲染
   - 可带孔洞（使用 holes）
   - 可转为 3D（ExtrudeGeometry）
