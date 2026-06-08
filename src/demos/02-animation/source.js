// 使用 requestAnimationFrame 实现动画
function animate() {
  requestAnimationFrame(animate)
  
  // 更新物体旋转
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  
  // 渲染场景
  renderer.render(scene, camera)
}

// 启动动画
animate()
