import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { BULLET_GROUP, ENEMY_GROUP } from '../game/consts'
import { Logger, logLevels } from '../logging'

const config = {
  maxTimeAlive: 10000,
  maxTravel: 80,
  triggerKey: 'space',
  playerZOffset: 3,
}

export class BulletSpawner extends Component {
  /**
   * @param {CANNON.Body} playerBody
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   * @param {Object} settings
   */
  constructor(playerBody, scene, world, camera, settings) {
    super()
    this._playerBody = playerBody
    this._scene = scene
    this._world = world
    this._camera = camera
    this._bullets = []
    this._lastShot = null
    this._config = config
    /**
     * @type {import('../types').GameSettings}
     */
    this._settings = settings
    this._raycaster = null
    this._direction = new THREE.Vector3()

    this.logger = new Logger()
    this.logger.level = logLevels.INFO
    this.throttledLogger = this.logger.getThrottledLogger(1000, 'bullet')
  }

  update(time, delta) {
    let bullet
    for (let i = 0; i < this._bullets.length; i++) {
      /**
       * @type {GameBody}
       */
      bullet = this._bullets[i].bullet

      let xVel = this._direction.x * this._settings.bulletSpeed
      let zVel = this._direction.z * this._settings.bulletSpeed

      this.throttledLogger.debug(time, 'xVel', xVel, 'zVel', zVel)
      bullet.rigidBody.velocity.set(xVel, 0, zVel)
      bullet.rigidBody.angularVelocity.set(this._settings.bulletSpeed, 0, 0)
      this._bullets[i].bullet.sync(time)
      this._bullets[i].timeAlive += delta
      this._handleDisposal(this._bullets[i], i)
    }

    this._handleShoot(time)
  }

  registerHandlers() {
    this.registerHandler('mouse.movement', (m) => {
      if (this._raycaster === null) {
        this._raycaster = new THREE.Raycaster()
      }
      this._raycaster.setFromCamera(m.value.position, this._camera)
      this._direction = this._raycaster.ray.direction.clone().normalize()
      this.broadcast({
        topic: 'mouse.direction',
        value: {
          direction: this._direction,
        },
      })
    })
  }

  _shootBullet(time) {
    const position = this._playerBody.position
    const bulletGeometry = new THREE.SphereGeometry(
      this._settings.bulletRadius,
      16,
      16
    )
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    this._scene.add(bulletMesh)

    const cannonBody = this._createBulletBody(
      {
        x: position.x,
        y: position.y + this._settings.bulletHeightOffset,
        z: position.z - this._config.playerZOffset,
      },
      this._direction
    )
    const bullet = new GameBody(bulletMesh, cannonBody, {
      name: `Bullet-${time}`,
      ignoreGravity: true,
    })
    bullet.sync()
    // TODO: Calc max travel based on player's current position
    // Might need to change how shootBullet is being called too
    this._bullets.push({
      bullet,
      timeAlive: 0.0,
      maxTravel: this._config.maxTravel,
    })
  }

  _createBulletBody(position, direction) {
    const cannonBody = new CANNON.Body({
      mass: 1000,
      shape: new CANNON.Sphere(this._settings.bulletRadius),
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: new CANNON.Material(),
      collisionFilterGroup: BULLET_GROUP,
      collisionFilterMask: ENEMY_GROUP,
    })
    this._world.addBody(cannonBody)
    return cannonBody
  }

  _handleShoot(time) {
    if (
      this._lastShot === null ||
      time - this._lastShot > this._settings.bulletIntervalBetweenShots
    ) {
      for (const [key, active] of Object.entries(
        this.getComponent('InputController')._keys
      )) {
        if (key === this._config.triggerKey && active) {
          if (this.currentMousePosition !== null) {
            this._shootBullet(time)
            this._lastShot = time
          }
        }
      }
    }
  }

  /**
   * @param {GameBody} bullet
   * @param {number} index
   */
  _handleDisposal(bullet, index) {
    const position = bullet.bullet.rigidBody.position
    if (
      position.z > bullet.maxTravel ||
      position.z < -bullet.maxTravel ||
      position.x > bullet.maxTravel ||
      position.x < -bullet.maxTravel ||
      position.y > bullet.maxTravel ||
      position.y < -bullet.maxTravel
    ) {
      this._disposeBullet(index)
    } else if (bullet.timeAlive > this._config.maxTimeAlive) {
      this._disposeBullet(index)
    }
  }

  _disposeBullet(idx) {
    let obj = this._bullets[idx].bullet
    obj.dispose(this._scene, this._world)
    this._bullets.splice(idx, 1)
    obj = null
  }
}
