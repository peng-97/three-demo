// 基础纹理贴图示例
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('path/to/texture.jpg');

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ 
  map: texture,
  color: 0xffffff
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 设置纹理属性
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(2, 2);