// 透明背景渲染
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0)

// 悬浮动画
const radius = 5
const angle = time
mesh.position.x = Math.cos(angle) * radius
mesh.position.z = Math.sin(angle) * radius
mesh.position.y = yOffset + Math.sin(time * 1.5) * 0.8
