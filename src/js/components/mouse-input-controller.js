import * as THREE from 'three'
import Component from '../ecs/component'

export default class MouseInputController extends Component {
  constructor(renderer, camera, scene) {
    super()
    this.mousePosition = null
    this._rayCaster = new THREE.Raycaster()
    this._camera = camera
    this._scene = scene
    this._init(renderer)
    this.intersects = []
    this.pressed = null
  }

  _init(renderer) {
    window.addEventListener('mousemove', (e) => {
      if (!this.mousePosition) {
        this.mousePosition = new THREE.Vector2()
      }
      this.mousePosition.x = getMouseX(e, renderer)
      this.mousePosition.y = getMouseY(e, renderer)
      this._rayCaster.setFromCamera(this.mousePosition, this._camera)
      this.intersects = this._rayCaster.intersectObjects(this._scene.children)
    })
    window.addEventListener('mouseup', (e) => {
      if (!this.mousePosition) {
        this.mousePosition = new THREE.Vector2()
      }
      this.mousePosition.x = getMouseX(e, renderer)
      this.mousePosition.y = getMouseY(e, renderer)
      this._rayCaster.setFromCamera(this.mousePosition, this._camera)
      this.intersects = this._rayCaster.intersectObjects(this._scene.children)
      this.broadcast({
        topic: 'mouse.up',
        value: {
          position: this.mousePosition,
          intersects: this.intersects,
          buttons: e.buttons,
        },
      })
      this.pressed = null
    })
    window.addEventListener('mousedown', (e) => {
      if (!this.mousePosition) {
        this.mousePosition = new THREE.Vector2()
      }
      this.mousePosition.x = getMouseX(e, renderer)
      this.mousePosition.y = getMouseY(e, renderer)
      this._rayCaster.setFromCamera(this.mousePosition, this._camera)
      this.intersects = this._rayCaster.intersectObjects(this._scene.children)
      this.broadcast({
        topic: 'mouse.down',
        value: {
          position: this.mousePosition,
          intersects: this.intersects,
          buttons: e.buttons,
        },
      })
      this.pressed = e.buttons
    })
  }

  update() {
    if (!this.mousePosition) {
      return
    }
    if (this.intersects.length > 0) {
      this.broadcast({
        topic: 'intersect.objects',
        value: { intersects: this.intersects },
      })
    }
    if (this.pressed !== null) {
      this.broadcast({
        topic: 'mouse.movement',
        value: {
          position: this.mousePosition,
          intersects: this.intersects,
          buttons: this.pressed,
        },
      })
    }
  }
}

/**
 * Return normalised mouse x position
 * @param {MouseEvent} e
 * @param {THREE.WebGLRenderer} renderer
 * @returns {number}
 */
function getMouseX(e, renderer) {
  return (e.clientX / renderer.domElement.clientWidth) * 2 - 1
}

/**
 * Return normalised mouse y position
 * @param {MouseEvent} e
 * @param {THREE.WebGLRenderer} renderer
 * @returns {number}
 */
function getMouseY(e, renderer) {
  return -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
}
