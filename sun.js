import * as THREE from 'three'

/* 结构
渲染器
     ->场景->太阳->坐标轴
                 ->地球->坐标轴
                     ->月球->坐标轴        
     ->相机
     ->光照
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

// 创建球体
const createSphere = (radius, color, texturePath) => {
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

function main() {
  const canvas = document.querySelector('#canvas')
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  const camera = new THREE.PerspectiveCamera(75, 1, 1, 100)
  // 设置相机位置，位于屏幕中心靠下，远离屏幕方向，看到地球从远到近由小变大
  camera.position.set(-1, -12, 10)
  camera.lookAt(1, 12, -10)
  const scene = new THREE.Scene()
  const light = new THREE.DirectionalLight(0xffffff, 6)
  // 根据相机位置调整光源位置，使球体能看清。光源相对于相机位置更远离屏幕，使球体底部有阴影效果。
  light.position.set(0, -12, 30)
  scene.add(light)

  function rotate(geometry, value, speed = 1) {
    // 绕垂直显示器方向渲染
    geometry.rotation.z = value * speed
  }

  // 太阳
  const sunMesh = createSphere(2, 0xff0000, '/images/sun-material.jpg')
  addAxesHelper(sunMesh)
  scene.add(sunMesh)

  // 地球
  const earthMesh = createSphere(0.6, 0x0000ff, '/images/earth-material.jpg')
  addAxesHelper(earthMesh)
  // 相对于太阳圆点x轴偏移5
  earthMesh.position.x = 6
  // 地球添加为太阳的子节点，太阳自转会使地球绕太阳公转
  sunMesh.add(earthMesh)

  const moonMesh = createSphere(0.3, 0xffff00)
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
}

main()
