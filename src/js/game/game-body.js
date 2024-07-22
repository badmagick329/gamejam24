import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

export default class GameBody {
  /**
   * Responsible for common interactions between mesh and rigid body
   * @param {THREE.Mesh} mesh
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.Collider} collider
   */
  constructor(mesh, rigidBody, collider) {
    this.mesh = mesh
    this.rigidBody = rigidBody
    this.collider = collider
  }

  sync() {
    const position = this.rigidBody.translation()
    this.mesh.position.set(position.x, position.y, position.z)

    const rotation = this.rigidBody.rotation()
    this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  }
}
