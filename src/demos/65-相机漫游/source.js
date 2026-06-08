// 透视相机
const camera = new THREE.PerspectiveCamera(
  75, 
  width / height, 
  0.1, 
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// 正交相机
const camera = new THREE.OrthographicCamera(
  -width / 2, 
  width / 2, 
  height / 2, 
  -height / 2, 
  0.1, 
  1000
);