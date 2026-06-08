Three.js 三大基本变换：
• 平移 (Translate) - 改变物体的位置
• 旋转 (Rotate) - 改变物体的朝向
• 缩放 (Scale) - 改变物体的大小

核心知识点：

1. 平移变换
   - 通过 object.position 属性设置
   - 支持 x, y, z 三个轴独立控制
   - 使用 position.set(x, y, z) 或直接修改各轴

2. 旋转变换
   - 通过 object.rotation 属性设置
   - 单位是弧度 (π = 180°)
   - 支持 x, y, z 三个轴独立旋转
   - 使用 rotation.set(x, y, z)

3. 缩放变换
   - 通过 object.scale 属性设置
   - 1 表示原始大小，大于 1 放大，小于 1 缩小
   - 使用 scale.set(x, y, z) 统一或分别缩放

4. 状态保存与恢复
   - 使用 clone() 保存当前状态
   - 使用 copy() 恢复之前的状态

