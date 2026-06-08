// 线性雾化
scene.fog = new THREE.Fog(
  0xcce0ff,  // 雾化颜色
  5,         // 开始距离
  50         // 结束距离
)
scene.background = new THREE.Color(0xcce0ff)

// 指数雾化
scene.fog = new THREE.FogExp2(
  0xcce0ff,  // 雾化颜色
  0.02       // 密度
)

// 禁用雾化
scene.fog = null

// 动态调整雾化
function updateFog(near, far) {
  if (scene.fog && scene.fog.isFog) {
    scene.fog.near = near
    scene.fog.far = far
  }
}
