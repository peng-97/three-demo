// 模板缓冲渲染
const renderer = new THREE.WebGLRenderer({ stencil: true })

// 轮廓描边
renderer.setStencilTest(true)
renderer.setStencilOp(THREE.ReplaceStencilOp, THREE.ReplaceStencilOp, THREE.ReplaceStencilOp)
renderer.setStencilFunc(THREE.AlwaysStencilFunc, 1, 0xff)

// 渲染到模板
mesh.material.colorWrite = false
mesh.material.depthWrite = false
renderer.render(scene, camera)

// 渲染轮廓
renderer.setStencilFunc(THREE.NotEqualStencilFunc, 1, 0xff)
renderer.setStencilOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp)
mesh.scale.multiplyScalar(1.1)
mesh.material = outlineMaterial
renderer.render(scene, camera)
