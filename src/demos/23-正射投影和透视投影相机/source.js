// 透视相机
const perspectiveCamera = new THREE.PerspectiveCamera(
  60, // fov (视角)
  window.innerWidth / window.innerHeight, // aspect (宽高比)
  0.1, // near (近裁剪面)
  1000 // far (远裁剪面)
)
perspectiveCamera.position.set(0, 10, 20)
perspectiveCamera.lookAt(0, 0, 0)

// 正射相机
const aspect = window.innerWidth / window.innerHeight
const frustumSize = 10
const orthographicCamera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2, // left
  frustumSize * aspect / 2,  // right
  frustumSize / 2,            // top
  -frustumSize / 2,           // bottom
  0.1,                        // near
  1000                        // far
)
orthographicCamera.position.set(0, 10, 20)

// 更新相机参数
perspectiveCamera.fov = 90
perspectiveCamera.updateProjectionMatrix()

// 切换相机
controls.object = currentCamera
