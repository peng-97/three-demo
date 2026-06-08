// 创建Canvas纹理
const canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
const ctx = canvas.getContext('2d')
const canvasTexture = new THREE.CanvasTexture(canvas)

// 实时绘制Canvas
function drawCanvas() {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 512, 512)
  
  // 绘制移动的圆
  for (let i = 0; i < 10; i++) {
    const x = (Math.sin(time + i) + 1) * 200 + 56
    const y = (Math.cos(time + i * 0.5) + 1) * 200 + 56
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 标记纹理需要更新
  canvasTexture.needsUpdate = true
}

// 视频纹理
const video = document.createElement('video')
video.src = 'video.mp4'
video.loop = true
video.play()

const videoTexture = new THREE.VideoTexture(video)
const material = new THREE.MeshBasicMaterial({ map: videoTexture })
