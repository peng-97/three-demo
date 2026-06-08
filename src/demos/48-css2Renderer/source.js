// CSS2DRenderer
const div = document.createElement('div')
div.style.cssText = 'position:absolute; color:white; padding:5px;'
div.textContent = 'Label'

// 更新位置
function update() {
  const screenPos = obj.position.clone().project(camera)
  const x = (screenPos.x * 0.5 + 0.5) * width
  const y = (-screenPos.y * 0.5 + 0.5) * height
  div.style.left = x + 'px'
  div.style.top = y + 'px'
  
  // 隐藏不可见
  div.style.display = screenPos.z > 1 ? 'none' : 'block'
}
