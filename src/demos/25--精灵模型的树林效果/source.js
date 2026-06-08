// 创建精灵
const spriteMaterial = new THREE.SpriteMaterial({ 
  color: 0xffffff,
  sizeAttenuation: true
});
const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(1, 1, 1);
scene.add(sprite);

// 创建多个精灵
for (let i = 0; i < 100; i++) {
  const sprite = new THREE.Sprite(spriteMaterial.clone());
  sprite.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 10,
    (Math.random() - 0.5) * 20
  );
  sprite.scale.set(0.5, 0.5, 0.5);
  scene.add(sprite);
}