import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP, WALL_GROUP } from '../consts'
import { GameBody } from '../game-body'

const BOX_SEGMENTS = 10

export class PlayerFactory {
  /**
   * @param {PlayerFactoryConfig} config
   */
  constructor(config) {
    if (config.world === undefined) {
      throw new Error('PlayerFactory requires a world instance')
    }
    if (config.settings === undefined) {
      throw new Error('PlayerFactory requires game settings')
    }
    /**
     * @type {import('../../types').GameSettings}
     */
    this._settings = config.settings
    this.world = config.world
    /**
     * @type {THREE.Vector3}
     */
    this.position = config?.position ?? this.defaultPosition()
    /**
     * @type {THREE.Material}
     */
    this.mat =
      config.mat ??
      new THREE.MeshStandardMaterial({
        // old value
        // color: DEFAULT_COLOR
        roughness: 0.4,
        flatShading: false,
      })
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
      {
        name: 'player',
      }
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
    return new THREE.Vector3(0, this._settings.playerY, 0)
  }

  _initBoxGeometryAndCannonBody() {
    this.geo = new THREE.BoxGeometry(
      this._settings.playerBoxSize,
      this._settings.playerBoxSize,
      this._settings.playerBoxSize,
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
    this.cannonBody.linearDamping = this._settings.playerLinearDamping || 0.85
    this.world.addBody(this.cannonBody)
  }

  _initSphereGeometryAndCannonBody() {
    this.geo = new THREE.SphereGeometry(
      this._settings.playerSphereRadius,
      32,
      32
    )
    this.cannonBody = new CANNON.Body({
      mass: 50,
      shape: new CANNON.Sphere(this._settings.playerSphereRadius),
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
    this.cannonBody.linearDamping = this._settings.playerLinearDamping || 0.95
    this.world.addBody(this.cannonBody)
  }
}

/**
 * @typedef {Object} PlayerFactoryConfig
 * @property {CANNON.World} world
 * @property {THREE.Vector3} [position]
 * @property {THREE.Material} [mat]
 * @property {import('../../types').GameSettings} settings
 */
