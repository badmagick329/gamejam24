import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { GameBody } from '../game-body'

/**
 * @class
 * @implements {EnemyFactoryAttributes}
 */
export class EnemyFactory {
  /**
   * @param {EnemyFactoryConfig} config
   */
  constructor(config) {
    if (config.world === undefined) {
      throw new Error('EnemyFactory requires a world instance')
    }
    this.world = config.world
    this.position = config?.position ?? new THREE.Vector3(0, 20, 0)

    this.mesh = null
    this.colliderDesc = null
    this.linearDamping = 0.25

    this.rigidBody = null
    this.body = null
  }

  /**
   * @returns {GameBody}
   */
  create() {
    if (this.mesh === null) {
      throw new Error(
        'EnemyFactory requires a mesh. Use an enemy setter before creating GameBody'
      )
    }
    if (this.colliderDesc === null) {
      throw new Error(
        'EnemyFactory requires a colliderDesc. Use an enemy setter before creating GameBody'
      )
    }
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
      this.position.x,
      this.position.y,
      this.position.z
    )
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc)
    this.rigidBody.setLinearDamping(this.linearDamping)
    this.body = new GameBody(
      this.mesh,
      this.rigidBody,
      this.world.createCollider(this.colliderDesc, this.rigidBody)
    )
    return this.body
  }

  /**
   * @returns {EnemyFactory}
   */
  setPosition(x, y, z) {
    this.position = new THREE.Vector3(x, y, z)
    return this
  }

  /**
   * @returns {EnemyFactory}
   */
  setLinearDamping(n) {
    this.linearDamping = n
    return this
  }

  /**
   * @returns {EnemyFactory}
   */
  setBaseEnemy() {
    const geo = new THREE.TorusGeometry(2, 3, 4, 3)
    const mat = new THREE.MeshStandardMaterial({ color: 0xa0b04a })
    mat.flatShading = true

    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.scale.set(0.2, 0.2, 0.2)
    this.colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
    return this
  }
}
