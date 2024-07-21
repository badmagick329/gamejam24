import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

export default class GameBody {
  /**
   * Responsible for common interactions between mesh and rigid body
   * @param {THREE.Mesh} mesh
   * @param {RAPIER.RigidBody} body
   */
  constructor(mesh, rigidBody) {
    this.mesh = mesh
    this.rigidBody = rigidBody
  }

  sync() {
    const position = this.rigidBody.translation()
    this.mesh.position.set(position.x, position.y, position.z)

    const rotation = rigidBody.rotation()
    this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  }
}
