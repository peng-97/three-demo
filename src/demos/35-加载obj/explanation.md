Three.js 加载OBJ
• 支持本地选择 OBJ / MTL / 贴图（多文件）
• 支持输入 OBJ URL + 可选 MTL URL
• MTL 贴图相对路径通过 URLModifier 自动映射
• 自动适配相机并提供线框/自转开关

核心知识点：
1. OBJ + MTL
   - OBJ 负责几何数据
   - MTL 描述材质与贴图引用（map_Kd 等）
   - 贴图路径通常是相对路径，需要在加载时正确解析

2. LoadingManager.setURLModifier
   - 拦截 MTL 内部对贴图的请求
   - 将相对路径映射到本地 blob url（File -> URL.createObjectURL）

3. 资源释放
   - 清空模型时释放 geometry / material
   - 释放 blob url（URL.revokeObjectURL）
