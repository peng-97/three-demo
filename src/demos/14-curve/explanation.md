Three.js 曲线系统：
• 基础曲线 - 直线、圆、椭圆等
• 贝塞尔曲线 - 二次、三次贝塞尔
• 样条曲线 - 平滑曲线插值
• 管道几何体 - 沿曲线生成管状

核心知识点：

1. 基础曲线类
   - LineCurve3: 直线
   - CircleCurve3: 圆
   - EllipseCurve: 椭圆
   - ArcCurve: 弧线

2. 贝塞尔曲线
   - QuadraticBezierCurve3: 二次贝塞尔（3个点）
   - CubicBezierCurve3: 三次贝塞尔（4个点）
   - 控制点影响曲线形状

3. 样条曲线
   - SplineCurve3: 样条曲线
   - CatmullRomCurve3: Catmull-Rom样条
   - 通过多个点平滑插值

4. 曲线应用
   - getPoints() 获取曲线上的点
   - TubeGeometry 创建管道
   - 路径动画、轨迹生成
