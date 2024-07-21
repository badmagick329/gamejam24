import * as THREE from 'three'

async function main() {
  // 1: setup scene and camera
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // 2: setup renderer
  const renderer = new THREE.WebGLRenderer()
  // 3: set canvas size (drawingbuffer size)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setAnimationLoop(animate)
  document.body.appendChild(renderer.domElement)

  // 4: setup geo and mat
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

  // 5: create a mesh to hold the geo and mat
  const cube = new THREE.Mesh(geometry, material)
  // 6: add it to scene
  scene.add(cube)

  // 7: animation loop
  function animate() {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
  }
}

main()
