const materials = [
  new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    wireframe: true 
  }),
  new THREE.MeshLambertMaterial({ 
    color: 0x00ff00 
  }),
  new THREE.MeshPhongMaterial({ 
    color: 0x0000ff, 
    shininess: 100 
  }),
  new THREE.MeshStandardMaterial({ 
    color: 0xffff00, 
    metalness: 0.5, 
    roughness: 0.5 
  }),
  new THREE.MeshToonMaterial({ 
    color: 0xff00ff 
  })
];
