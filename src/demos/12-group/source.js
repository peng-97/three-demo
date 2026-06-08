// 1. 创建 Group
const carGroup = new THREE.Group()
scene.add(carGroup)

// 2. 将对象添加到 Group 中
carGroup.add(body)
carGroup.add(roof)
carGroup.add(wheel)

// 3. 统一变换 Group (会影响所有子对象)
carGroup.position.x += 2
carGroup.rotation.y += Math.PI / 4
carGroup.scale.set(1.2, 1.2, 1.2)

// 4. 移除对象
carGroup.remove(wheel)
