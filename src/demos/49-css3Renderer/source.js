// CSS3DRenderer
const element = document.createElement('div')
element.style.cssText = `
  width: 200px; height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; text-align: center;
  padding: 20px; box-sizing: border-box;
`

const object = new CSS3DObject(element)
object.position.set(0, 0, 0)
scene.add(object)
