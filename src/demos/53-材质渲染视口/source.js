// 多个视口渲染
renderer.setScissorTest(true)

const cols = 2
const rows = 2
const size = 1 / cols - gap
for (let i = 0; i < 4; i++) {
  const col = i % cols
  const row = Math.floor(i / cols)
  const x = -1 + size/2 + col * (size + gap)
  const y = 1 - size/2 - row * (size + gap)
  
  const scissorX = (x + 1) * 0.5 * rendererWidth
  const scissorY = (1 - (y + 1) * 0.5) * rendererHeight
  const scissorW = size * rendererWidth
  const scissorH = size * rendererHeight
  
  renderer.setViewport(scissorX, scissorY, scissorW, scissorH)
  renderer.setScissor(scissorX, scissorY, scissorW, scissorH)
  renderer.render(scene, camera)
}
