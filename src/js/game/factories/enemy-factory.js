import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import {
  BULLET_GROUP,
  ENEMY_GROUP,
  GROUND_GROUP,
  PLAYER_GROUP,
} from '../consts'
import { GameBody } from '../game-body'

export class EnemyFactory {
  /**
   * @param {EnemyFactoryConfig} config
   */
  constructor(config) {
    if (config.world === undefined) {
      throw new Error('EnemyFactory requires a world instance')
    }
    /**
     * @type {CANNON.World}
     */
    this.world = config.world
    /**
     * @type {THREE.Vector3}
     */
    this.position = config?.position ?? new THREE.Vector3(0, 20, 0)
    /**
     * @type {({x:number,y:number,z:number}|null)}
     */
    this.colliderDesc = null
    /**
     * @type {(THREE.Mesh|null)}
     */
    this.mesh = null
    /**
     * @type {(CANNON.Body|null)}
     */
    this.cannonBody = null
    /**
     * @type {number}
     */
    this.linearDamping = 0.05

    /**
     * @type {(GameBody|null)}
     */
    this.body = null
  }

  /**
   * @param {string} name
   * @returns {GameBody}
   */
  create(name) {
    if (this.mesh === null) {
      throw new Error(
        'EnemyFactory requires a mesh. Use an enemy setter before creating GameBody'
      )
    }
    if (this.colliderDesc === null) {
      throw new Error(
        'EnemyFactory requires a collider description. Use an enemy setter before creating GameBody'
      )
    }
    this.body = new GameBody(this.mesh, this.cannonBody, name)
    this.body.mesh.castShadow = true
    this.world.addBody(this.cannonBody)
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
    // const geo = new THREE.BoxGeometry(2, 2, 2)
    const mat = new THREE.MeshStandardMaterial({ color: 0xa0b04a })
    mat.flatShading = true
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.scale.set(0.2, 0.2, 0.2)
    this.colliderDesc = { x: 1, y: 1, z: 1 }
    this.cannonBody = new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.colliderDesc.x,
          this.colliderDesc.y,
          this.colliderDesc.z
        )
      ),
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y,
        this.position.z
      ),
      material: new CANNON.Material(),
      collisionFilterGroup: ENEMY_GROUP,
      collisionFilterMask:
        PLAYER_GROUP | ENEMY_GROUP | GROUND_GROUP | BULLET_GROUP,
    })
    this.cannonBody.linearDamping = this.linearDamping
    // Rotation experiments
    this.cannonBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    return this
  }
}

/**
 * @typedef {Object} EnemyFactoryConfig
 * @property {CANNON.World} world
 * @property {THREE.Vector3} [position]
 */
