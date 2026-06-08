// 多个平面叠加
const material = new THREE.MeshBasicMaterial({ 
  color: 0xff0000,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending
})

// 混合模式选项
// THREE.NormalBlending
// THREE.AdditiveBlending
// THREE.SubtractiveBlending
// THREE.MultiplyBlending

// 渲染顺序
plane1.renderOrder = 0
plane2.renderOrder = 1
