// 透视深度问题
// 问题：Near过小或Far过大

// 优化方法
camera = new THREE.PerspectiveCamera(
  60,
  aspect,
  0.1,    // Near不要太小
  1000    // Far不要太大
)

// 对数深度缓冲
const renderer = new THREE.WebGLRenderer({ 
  logarithmicDepthBuffer: true 
})

// Near/Far 建议值
// 近场景: near=0.1, far=100
// 中场景: near=1, far=1000
// 远场景: near=10, far=10000
