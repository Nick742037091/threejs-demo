import * as THREE from 'three'

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

const canvas = document.querySelector('#canvas')
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
const camera = new THREE.PerspectiveCamera(75, 1, 1, 100)
const scene = new THREE.Scene()
scene.position.z = -10
const light = new THREE.DirectionalLight(0xffffff, 3)
light.position.set(0, 0, 100)
scene.add(light)

const createSphere = (radius, color) => {
  const segments = 6
  const geometry = new THREE.SphereGeometry(radius, segments, segments)
  const material = new THREE.MeshPhongMaterial({ color })
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

// 太阳
const sunMesh = createSphere(1, 0xff0000)
scene.add(sunMesh)

// 地球
const earthMesh = createSphere(0.6, 0x0000ff)
// 相对于太阳圆点x轴偏移5
earthMesh.position.x = 5
// 地球添加为太阳的子节点，太阳自转会使地球绕太阳公转
sunMesh.add(earthMesh)

const moonMesh = createSphere(0.3, 0xffff00)
// 相对于地球圆点x轴偏移1
moonMesh.position.x = 1
// 月球添加为地球的子节点，地球自转会使月球绕地球公转
earthMesh.add(moonMesh)

const rotate = (geometry, value, speed = 1) => {
  // 绕垂直显示器方向渲染
  geometry.rotation.z = value * speed
}

// 定时旋转几何体
function render(time) {
  // 获取canvas的宽高，动态设置相机比例，解决变形问题
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
  }

  time *= 0.001
  // 太阳自转
  rotate(sunMesh, time, 1)
  // 地球自转
  rotate(earthMesh, time, 4)
  // 月球自转
  rotate(moonMesh, time, 10)

  // 重新渲染，刷新视图
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}
// 使用requestAnimationFrame
// 1.在浏览器下一次重绘之后调用，实现平滑动画
// 2.只在浏览器空闲时调用，避免影响高优先级的任务，提高性能，也更省电
// 3.与css动画比较能实现更复杂的逻辑
requestAnimationFrame(render)
