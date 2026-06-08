const geometry = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
const originalPositions = geometry.attributes.position.array.slice();

function animate() {
  const time = Date.now() * 0.001;
  const positions = mesh.geometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    const x = originalPositions[i * 3];
    const y = originalPositions[i * 3 + 1];
    const z = originalPositions[i * 3 + 2];
    
    const noise = Math.sin(time + x * 2) * 0.1 
                + Math.sin(time + y * 3) * 0.1;
    
    positions.setX(i, x + noise);
    positions.setY(i, y + noise);
    positions.setZ(i, z + noise);
  }
  
  positions.needsUpdate = true;
}
