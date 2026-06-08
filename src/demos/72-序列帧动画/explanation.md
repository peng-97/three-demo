Three.js 动画系统：
• 关键帧动画：通过定义关键帧实现平滑过渡
• 骨骼动画：用于角色动画
• 外部模型动画：加载并播放模型自带动画

核心知识点：

1. 关键帧动画
   - AnimationMixer: 动画混合器
   - AnimationClip: 动画剪辑
   - AnimationAction: 动画动作

2. 动画控制
   - play(): 播放
   - pause(): 暂停
   - stop(): 停止
   - setLoop(): 设置循环

3. 骨骼动画
   - SkinnedMesh: 蒙皮网格
   - Skeleton: 骨骼系统
   - Bone: 骨骼