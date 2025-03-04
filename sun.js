import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import PickHelper from './utils/PickerHelper'

/* 结构
渲染器
     ->场景->太阳->坐标轴
                 ->地球->坐标轴
                     ->月球->坐标轴        
            ->光照
     ->相机   

轨道控制器(依赖相机和canvas元素)  
*/

/** 方向
  从左到右: -x -> +x
  从下到上: -y -> +y
  从后到前: -z -> +z
*/

/* 自转和公转逻辑
太阳上添加地球，太阳定时旋转，实现太阳的自转和地球的公转。
地球上添加月球，地球定时旋转，实现地球的自转和月球的公转。
月球定时旋转，实现月球的自转。
*/

// 是否显示坐标轴辅助线
const showAxesHelper = false
// 是否开启球体平面着色，会显示条纹
const sphereFlatShading = false
// 设置球体光泽度
const sphereShininess = 100
const spherePhysicalMaterial = false

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

function createOrbit() {
  return new THREE.Object3D()
}

// 创建球体
const createSphere = (radius, color, texturePath, name) => {
  const segments = 24
  const geometry = new THREE.SphereGeometry(radius, segments, segments)
  const loader = new THREE.TextureLoader()
  const texture = texturePath ? loader.load(texturePath) : null
  // 1.MeshPhongMaterial实现3D效果，支持光照和光泽度
  // 2.MeshStandardMaterial有更好的物理渲染效果
  const material = spherePhysicalMaterial
    ? new THREE.MeshPhysicalMaterial({
        flatShading: sphereFlatShading,
        roughness: 0.4,
        metalness: 0.2,
        ...(texture ? { map: texture } : { color })
      })
    : new THREE.MeshPhongMaterial({
        flatShading: sphereFlatShading,
        shininess: sphereShininess,
        ...(texture ? { map: texture } : { color })
      })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  return mesh
}

// 添加坐标轴辅助线
function addAxesHelper(mesh) {
  if (!showAxesHelper) return
  const axesHelper = new THREE.AxesHelper()
  axesHelper.material.depthTest = false
  axesHelper.renderOrder = 1
  mesh.add(axesHelper)
}
// 添加相机旋转控制
function addOrbitControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas)
  // 可以围绕原点旋转
  controls.target.set(0, 0, 0)
  controls.update()
}

function main() {
  const canvas = document.querySelector('#c')
  // antialias: true 抗锯齿，避免渲染块化
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#555')

  // 透视摄像机，提供近大远小效果
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  // 设置相机位置，位于屏幕中心之外，看到屏幕里面，看到物体从远到近由小变大
  camera.position.set(0, 0, -20)
  camera.lookAt(0, 0, 20)
  addOrbitControls(camera, canvas)

  // 平行光，模拟太阳光效果
  const light = new THREE.DirectionalLight(0xffffff, 6)
  // 根据相机位置调整光源位置，使球体能看清。光源位于y轴正方向，使球体底部有阴影效果。
  light.position.set(0, 20, 0)
  scene.add(light)

  function rotate(geometry, value, speed = 1) {
    // 绕y轴渲染
    geometry.rotation.y = value * speed
  }

  // 太阳
  const sunMesh = createSphere(2, 0xff0000, '/images/sun-material.jpg', 'Sun')
  addAxesHelper(sunMesh)
  scene.add(sunMesh)

  // 地球
  const earthMesh = createSphere(
    0.6,
    0x0000ff,
    '/images/earth-material.jpg',
    'Earth'
  )
  addAxesHelper(earthMesh)
  // 相对于太阳圆点x轴偏移5
  earthMesh.position.x = 6
  // 地球添加为太阳的子节点，太阳自转会使地球绕太阳公转
  sunMesh.add(earthMesh)

  const moonMesh = createSphere(0.3, 0xffff00, null, 'Moon')
  addAxesHelper(moonMesh)
  // 相对于地球圆点x轴偏移1
  moonMesh.position.x = 2
  // 月球添加为地球的子节点，地球自转会使月球绕地球公转
  earthMesh.add(moonMesh)

  // 定时旋转几何体
  function render(time) {
    // 获取canvas的宽高，动态设置相机比例，解决变形问题
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
    }

    time *= 0.0005
    // 通过太阳轨道实现太阳自转
    rotate(sunMesh, time, 1)
    // 通过地球轨道实现地球自转
    rotate(earthMesh, time, 4)
    // 通过月球轨道实现月球自转
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

  new PickHelper({
    canvas,
    scene,
    camera,
    onClick: (object) => {
      console.log('pickedObject', object.name)
    }
  })
}

main()
