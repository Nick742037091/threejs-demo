import { Raycaster } from 'three'

export default class PickHelper {
  constructor({ canvas, scene, camera, onClick, onHover }) {
    this.raycaster = new Raycaster()
    this.canvas = canvas
    this.scene = scene
    this.camera = camera
    this.onClick = onClick
    this.onHover = onHover
    this.pickPosition = { x: -100000, y: -100000 }
    canvas.addEventListener('click', (event) => {
      const object = this.getEventObject(event)
      if (!object) return
      this.onClick && this.onClick(object)
    })
    // 在canvas内部用mousemove实现监听hover
    // TODO 需要避免连续hover
    // canvas.addEventListener('mousemove', (event) => {
    //   const object = this.getEventObject(event)
    //   if (!object) return
    //   this.onHover && this.onHover(object)
    // })
  }

  getPosition(event) {
    // 得出点击位置在canvas的水平和垂直方向位置的百分比(0~1)，原点为canvas的左上角
    const rect = this.canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    // 将点击位置转换为[-1,1]范围的坐标，原点为canvas的中心
    return {
      x: (x - 0.5) * 2,
      y: (0.5 - y) * 2
    }
  }

  getEventObject(event) {
    const position = this.getPosition(event)
    this.raycaster.setFromCamera(position, this.camera)
    const intersectedObjects = this.raycaster.intersectObjects(
      this.scene.children
    )
    if (intersectedObjects.length === 0) return null
    return intersectedObjects[0].object
  }
}
