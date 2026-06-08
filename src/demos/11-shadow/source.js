// 1. 开启渲染器的阴影功能
renderer.shadowMap.enabled = true
// 可选: 设置阴影类型，提升效果
// renderer.shadowMap.type = THREE.PCFSoftShadowMap

// 2. 开启光源的阴影功能
directionalLight.castShadow = true

// 3. 设置物体投射阴影
cube.castShadow = true
sphere.castShadow = true

// 4. 设置物体接收阴影
ground.receiveShadow = true
