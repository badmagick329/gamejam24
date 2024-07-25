import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP, WALL_GROUP } from '../consts'
import { GameBody } from '../game-body'

const PLAYER_Y = 0.6
const BOX_SIZE = 1
const SPHERE_RADIUS = 1
const BOX_SEGMENTS = 10
const DEFAULT_COLOR = 0x55aa55

export class PlayerFactory {
  /**
   * @param {PlayerFactoryConfig} config
   */
  constructor(config) {
    if (config.world === undefined) {
      throw new Error('PlayerFactory requires a world instance')
    }
    this.world = config.world
    /**
     * @type {THREE.Vector3}
     */
    this.position = config?.position ?? this.defaultPosition()
    /**
     * @type {THREE.Material}
     */
    this.mat =
      config.mat ?? new THREE.MeshStandardMaterial({ color: DEFAULT_COLOR })
    this.mat.flatShading = true
    /**
     * @type {number}
     */
    this.linearDamping = 0.95

    /**
     * @type {(THREE.BufferGeometry|null)}
     */
    this.geo = null
    /**
     * @type {(CANNON.Body|null)}
     */
    this.cannonBody = null
    /**
     * @type {(GameBody|null)}
     */
    this.body = null
  }

  /**
   * @returns {GameBody}
   */
  create() {
    this._initSphereGeometryAndCannonBody()
    this.body = new GameBody(
      new THREE.Mesh(this.geo, this.mat),
      this.cannonBody,
      'player'
    )
    this.body.mesh.castShadow = true
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

  _initBoxGeometryAndCannonBody() {
    this.geo = new THREE.BoxGeometry(
      BOX_SIZE,
      BOX_SIZE,
      BOX_SIZE,
      BOX_SEGMENTS,
      BOX_SEGMENTS,
      BOX_SEGMENTS
    )
    this.cannonBody = new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.geo.parameters.width / 2,
          this.geo.parameters.height / 2,
          this.geo.parameters.depth / 2
        )
      ),
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y,
        this.position.z
      ),
      material: new CANNON.Material(),
    })
    this.cannonBody.linearDamping = this.linearDamping
    this.world.addBody(this.cannonBody)
  }

  _initSphereGeometryAndCannonBody() {
    this.geo = new THREE.SphereGeometry(SPHERE_RADIUS, 10, 10)
    this.cannonBody = new CANNON.Body({
      mass: 50,
      shape: new CANNON.Sphere(SPHERE_RADIUS),
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y + 2,
        this.position.z
      ),
      material: new CANNON.Material(),
      collisionFilterGroup: PLAYER_GROUP,
      collisionFilterMask:
        PLAYER_GROUP | ENEMY_GROUP | WALL_GROUP | GROUND_GROUP,
    })
    this.cannonBody.linearDamping = this.linearDamping
    this.world.addBody(this.cannonBody)
  }
}

/**
 * @typedef {Object} PlayerFactoryConfig
 * @property {CANNON.World} world
 * @property {THREE.Vector3} [position]
 * @property {THREE.Material} [mat]
 */
