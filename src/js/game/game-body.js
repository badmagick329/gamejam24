import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Logger, logLevels } from '../logging.js'

export class GameBody {
  static ID = 0
  /**
   * Responsible for common interactions between mesh and physics body
   * @param {THREE.Mesh} mesh
   * @param {CANNON.Body} rigidBody
   * @param {GameBodyConfig} [config]
   */
  constructor(mesh, rigidBody, config) {
    this.mesh = mesh
    this.rigidBody = rigidBody
    this._logger = new Logger()
    this._logger.level = logLevels.INFO
    if (this._name) {
      this._throttledLogger = this._logger.getThrottledLogger(2000, this._name)
    }

    this.config = config
    this._name = config?.name ?? this._generateName()
    this.config.additionalGravity = config?.additionalGravity ?? false
    this.config.freezeRotation = config?.freezeRotation ?? false
    this.config.ignoreGravity = config?.ignoreGravity ?? false
    this.config.syncMesh = config?.syncMesh ?? true
  }

  _generateName() {
    return `GameBody-${GameBody.ID++}`
  }

  get name() {
    return this._name
  }

  sync(time) {
    this._injectUTime(time)
    this._handleCustomGravity(time)

    if (this.config.freezeRotation && this.rigidBody) {
      this.rigidBody.angularVelocity.set(0, 0, 0)
      this.rigidBody.quaternion.set(0, 0, 0, 1)
    }

    if (this.config.syncMesh && this.mesh) {
      this.mesh.position.copy(this.rigidBody.position)
      this.mesh.quaternion.copy(this.rigidBody.quaternion)
    }
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
    this.mesh?.geometry?.dispose()

    if (this.mesh?.material?.map) {
      object.material.map.dispose()
    }

    Array.isArray(this.mesh?.material)
      ? this.mesh.material.forEach((material) => material.dispose())
      : this.mesh?.material?.dispose()

    if (this.mesh) {
      scene.remove(this.mesh)
    }
    if (this.rigidBody) {
      world.removeBody(this.rigidBody)
    }

    this.rigidBody = null
    this.mesh = null
  }

  _handleCustomGravity(time) {
    if (this.config.ignoreGravity) {
      this.rigidBody?.applyForce(new CANNON.Vec3(0, 9.81, 0))
      return
    }

    if (
      this.config.freezeGravityAt &&
      this.rigidBody?.position?.y <= this.config.freezeGravityAt
    ) {
      const velocity = this.rigidBody.velocity
      this.rigidBody?.velocity?.set(velocity.x, 0.0, velocity.z)
    } else if (this.config.additionalGravity) {
      this.rigidBody?.applyForce(
        new CANNON.Vec3(0, this.config.additionalGravity, 0)
      )
    }
  }

  _injectUTime(time) {
    if (!this.mesh?.material) {
      return
    }

    if (Array.isArray(this.mesh.material)) {
      this.mesh.material
        .filter((m) => m.type === 'ShaderMaterial')
        .forEach((m) => (m.uniforms.uTime.value = time / 10000))
    } else if (this.mesh.material.type === 'ShaderMaterial') {
      this.mesh.material.uniforms.uTime.value = time / 10000
    }
  }
}

/**
 * @typedef {Object} GameBodyConfig
 * @property {name} [name]
 * @property {boolean} [ignoreGravity]
 * @property {number} [additionalGravity]
 * @property {boolean} [freezeRotation]
 * @property {boolean} [syncMesh]
 */
