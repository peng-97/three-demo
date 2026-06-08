// 初始化音频分析
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 256
const dataArray = new Uint8Array(analyser.frequencyBinCount)

// 创建振荡器
const oscillator = audioContext.createOscillator()
const gain = audioContext.createGain()
oscillator.type = 'sine'
oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
oscillator.connect(gain)
gain.connect(analyser)
analyser.connect(audioContext.destination)
oscillator.start()

// 获取频率数据并更新视觉
function update() {
  analyser.getByteFrequencyData(dataArray)
  for (let i = 0; i < bars.length; i++) {
    const value = dataArray[i] / 255
    bars[i].scale.y = 1 + value * 10
  }
}
