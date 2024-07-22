import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { GameBody } from '../game-body'

const PLAYER_Y = 0.6
const BOX_SIZE = 1
const BOX_SEGMENTS = 10
const DEFAULT_COLOR = 0x55aa55

export class PlayerFactory {
  /**
   * @param {import('../../types').PlayerFactoryConfig} config
   */
  constructor(config) {
    if (config.world === undefined) {
      throw new Error('PlayerFactory requires a world instance')
    }
    /**
     * @type {RAPIER.World}
     */
    this.world = config.world
    /**
     * @type {THREE.Vector3}
     */
    this.position = config?.position ?? this.defaultPosition()
    /**
     * @type {(THREE.BufferGeometry)}
     */
    this.geo =
      config?.geo ??
      new THREE.BoxGeometry(
        BOX_SIZE,
        BOX_SIZE,
        BOX_SIZE,
        BOX_SEGMENTS,
        BOX_SEGMENTS,
        BOX_SEGMENTS
      )
    /**
     * @type {THREE.MeshStandardMaterial}
     */
    this.mat =
      config.mat ?? new THREE.MeshStandardMaterial({ color: DEFAULT_COLOR })
    this.mat.flatShading = true
    /**
     * @type {RAPIER.ColliderDesc}
     */
    this.colliderDesc =
      config?.colliderDesc ??
      RAPIER.ColliderDesc.cuboid(BOX_SIZE / 2, BOX_SIZE / 2, BOX_SIZE / 2)
    /**
     * @type {(number)}
     */
    this.linearDamping = 0.25

    /**
     * @type {(RAPIER.RigidBody|null)}
     */
    this.rigidBody = null
    /**
     * @type {(GameBody|null)}
     */
    this.body = null
  }

  /**
   * @returns {GameBody}
   */
  create() {
    const rigidBodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        this.position.x,
        this.position.y,
        this.position.z
      )
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc)
    this.rigidBody.setLinearDamping(this.linearDamping)
    this.body = new GameBody(
      new THREE.Mesh(this.geo, this.mat),
      this.rigidBody,
      this.world.createCollider(this.colliderDesc, this.rigidBody)
    )
    return this.body
  }

  /**
   * @returns {PlayerFactory}
   */
  setLinearDamping(n) {
    this.linearDamping = n
    return this
  }

  /**
   * @returns {THREE.Vector3}
   */
  defaultPosition() {
    return new THREE.Vector3(0, PLAYER_Y, 0)
  }
}
