Three.js 法线贴图和凹凸贴图
• 使用程序生成的法线贴图
• 支持法线贴图和凹凸贴图
• 可调节强度参数

核心知识点：

1. 法线贴图 Normal Map
   - material.normalMap = texture
   - material.normalScale = new THREE.Vector2(x, y)
   - 使用RGB通道表示法线方向

2. 凹凸贴图 Bump Map
   - material.bumpMap = texture
   - material.bumpScale = value
   - 使用灰度值表示高度

3. 两种方式对比
   - 法线贴图更精确，需要专门的法线贴图
   - 凹凸贴图更简单，使用灰度图
   - 可以结合使用

4. 光源效果
   - 使用PointLight点光源
   - 多个光源增强凹凸感
   - 材质的metalness/roughness调节
