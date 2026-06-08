const geometry = new THREE.TetrahedronGeometry(2, 1);
const colors = [];

const faceColors = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0]
];

for (let i = 0; i < geometry.attributes.position.count; i++) {
  const faceIndex = Math.floor(i / 3);
  colors.push(...faceColors[faceIndex % faceColors.length]);
}

geometry.setAttribute('color', 
  new THREE.Float32BufferAttribute(colors, 3)
);

const material = new THREE.MeshBasicMaterial({ 
  vertexColors: true 
});
