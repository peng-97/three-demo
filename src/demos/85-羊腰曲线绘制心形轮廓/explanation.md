Three.js 曲线系统：
• 基础曲线：直线、圆、椭圆
• 贝塞尔曲线：二次、三次贝塞尔
• 样条曲线：Catmull-Rom
• 管道几何体：沿曲线生成管状

核心知识点：

1. 曲线类型
   - LineCurve3: 直线
   - CatmullRomCurve3: Catmull-Rom样条
   - QuadraticBezierCurve3: 二次贝塞尔
   - CubicBezierCurve3: 三次贝塞尔

2. 曲线方法
   - getPoint(t): 获取曲线上的点
   - getPoints(n): 获取多个点
   - getSpacedPoints(n): 等距点

3. 曲线应用
   - TubeGeometry: 管道
   - ExtrudeGeometry: 拉伸
   - 路径动画