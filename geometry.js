import * as THREE from 'three'
// 结构：
// 渲染器(WebGLRenderer)->场景(Scene)->网格(Mesh)->几何体(BoxGeometry)
//                                             ->材质(MeshPhongMaterial)
//                                 ->平行光照(DirectionalLight)
//                     ->相机(PerspectiveCamera)

// 使渲染器绘图缓冲器大小和canvas大小一致，避免展示块化
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const needResize = canvas.width !== width || canvas.height !== height
  if (needResize) {
    // 频繁重复设置相同大小也会块化
    renderer.setSize(width, height, false)
  }
  return needResize
}

function createMesh(geometry, positionX) {
  // MeshBasicMaterial 材质不会收到光照影响
  // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  // MeshPhongMaterial能体现光照阴影
  // 创建不同的材质
  const material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide
  })
  const hue = Math.random()
  const saturation = 1
  const luminance = 0.5
  material.color.setHSL(hue, saturation, luminance)

  // 网格是独立的实例
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = -4
  // 设置网格x轴位置
  mesh.position.x = positionX
  return mesh
}

function main() {
  const canvas = document.querySelector('#c')
  const renderer = new THREE.WebGLRenderer({ anitialias: true, canvas })
  const scene = new THREE.Scene()
  // 几何体复用
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const meshList = [
    createMesh(geometry, -2),
    createMesh(geometry, 0),
    createMesh(geometry, 2)
  ]
  meshList.forEach((mesh) => {
    scene.add(mesh)
  })

  // 平行白光
  const light = new THREE.DirectionalLight(0xffffff, 3)
  light.position.set(-1, 2, 4)
  scene.add(light)
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5)

  // 定时旋转几何体
  function render(time) {
    // 获取canvas的宽高，动态设置相机比例，解决变形和模糊问题
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
    }

    time *= 0.001
    meshList.forEach((mesh) => {
      mesh.rotation.y = time
      mesh.rotation.x = time
    })
    // 重新渲染，刷新视图
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }
  // 使用requestAnimationFrame
  // 1.在浏览器下一次重绘之后调用，实现平滑动画
  // 2.只在浏览器空闲时调用，避免影响高优先级的任务，提高性能，也更省电
  // 3.与css动画比较能实现更复杂的逻辑
  requestAnimationFrame(render)
}

main()
