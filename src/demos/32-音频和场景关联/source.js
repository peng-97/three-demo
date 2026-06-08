// 创建音频监听
const listener = new THREE.AudioListener()
camera.add(listener)

// 创建位置音频
const sound = new THREE.PositionalAudio(listener)
const oscillator = listener.context.createOscillator()
const gain = listener.context.createGain()
oscillator.type = 'sine'
oscillator.frequency.setValueAtTime(440, listener.context.currentTime)
oscillator.connect(gain)
sound.setNodeSource(gain)

// 设置音频参数
sound.setRefDistance(5)
sound.setRolloffFactor(1)
sound.setDistanceModel('exponential')
mesh.add(sound)
oscillator.start()
