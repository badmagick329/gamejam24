import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Logger, logLevels } from '../logging'

export class GameBody {
  static ID = 0
  /**
   * Responsible for common interactions between mesh and physics body
   * @param {THREE.Mesh} mesh
   * @param {CANNON.Body} rigidBody
   * @param {string} [name]
   */
  constructor(mesh, rigidBody, name, config) {
    this.mesh = mesh
    this.rigidBody = rigidBody
    this._name = name ?? this._generateName()
    this._logger = new Logger()
    this._logger.level = logLevels.INFO
    this._throttledLogger = null
    if (this._name && this._name === 'player') {
      this._throttledLogger = this._logger.getThrottledLogger(2000, this._name)
    }

    this._ignoreGravity =
      config?.ignoreGravity !== undefined ? config.ignoreGravity : false
  }

  _generateName() {
    return `GameBody-${GameBody.ID++}`
  }

  sync(time) {
    this._throttledLogger?.debug(time, 'body position', this.rigidBody.position)
    if (this._ignoreGravity) {
      this.rigidBody.applyForce(new CANNON.Vec3(0, 9.81, 0))
    }

    this.mesh.position.copy(this.rigidBody.position)
    this.mesh.quaternion.copy(this.rigidBody.quaternion)
  }

  stopBody() {
    this.rigidBody.velocity.set(0, 0, 0)
  }

  /**
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   * @returns {void}
   */
  dispose(scene, world) {
    this.mesh.geometry.dispose()

    if (this.mesh.material.map) {
      object.material.map.dispose()
    }

    Array.isArray(this.mesh.material)
      ? this.mesh.material.forEach((material) => material.dispose())
      : this.mesh.material.dispose()

    scene.remove(this.mesh)
    world.removeBody(this.rigidBody)

    this.rigidBody = null
    this.mesh = null
  }
}
