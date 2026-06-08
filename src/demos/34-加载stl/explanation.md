Three.js 加载 STL
• 支持本地选择 .stl
• 支持输入 .stl URL 加载
• 自动居中、自动适配相机
• 支持材质切换（Standard/Normal）、线框、自动旋转、缩放

核心知识点：
1. STLLoader
   - STL 主要是三角面片数据（通常无材质信息）
   - 载入后得到 BufferGeometry

2. 法线与居中
   - 有些 STL 不带 normal，需要 computeVertexNormals()
   - geometry.center() 可把模型移到原点，方便 orbit 与相机适配

3. 资源释放
   - 清空/切换模型时释放 geometry/material
   - 本地文件 blob url 用完要 revoke
