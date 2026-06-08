// 关键帧动画示例
const positionKF = new THREE.VectorKeyframeTrack(
  '.position',
  [0, 1, 2],
  [0, 0, 0, 5, 0, 0, 0, 0, 0]
);

const clip = new THREE.AnimationClip('Action', 3, [positionKF]);
const mixer = new THREE.AnimationMixer(mesh);
const action = mixer.clipAction(clip);
action.play();

// 在动画循环中更新
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  mixer.update(delta);
}