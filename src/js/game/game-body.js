import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

export class GameBody {
  /**
   * Responsible for common interactions between mesh and rigid body
   * @param {THREE.Mesh} mesh
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.Collider} collider
   */
  constructor(mesh, rigidBody, collider) {
    // TODO: Add ID field?
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

  /**
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @returns {void}
   */
  dispose(scene, world) {
    this.mesh.geometry.dispose()

    if (this.mesh.material.map) {
      object.material.map.dispose()
    }
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => material.dispose())
    } else {
      this.mesh.material.dispose()
    }

    scene.remove(this.mesh)
    world.removeRigidBody(this.rigidBody)
  }
}
