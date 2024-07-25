import * as THREE from 'three'
import { Component } from '../ecs'
import { Logger } from '../logging'
import { useCamera, useControls } from '../render/init'

export class ThirdPersonCamera extends Component {
  constructor() {
    super()
    this.camera = useCamera()
    this.controls = useControls()
    this.cameraOffset = new THREE.Vector3(0, 12, 10)
    this._target = null
    this._logger = new Logger()
    this._throttledLogging = this._logger.getThrottledLogger(1000, 'camera')
  }

  /**
   * @param {THREE.Mesh} target
   */
  setTarget(target) {
    this._target = target
  }

  update(time) {
    if (!this._target) {
      return
    }
    const relativeOffset = this.cameraOffset.clone()
    // .applyQuaternion(this._target.quaternion) // ignore rotation
    const cameraPosition = new THREE.Vector3()
      .copy(this._target.position)
      .add(relativeOffset)
    this.camera.position.lerp(cameraPosition, 0.08)
    this.camera.lookAt(this._target.position)
    this.controls.target.copy(this._target.position)
    this._throttledLogging.info(time, this.camera.position)
  }
}
