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
   * @param {THREE.Camera} camera
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
    this._raycaster = new THREE.Raycaster()
    this._direction = new THREE.Vector3(
      0,
      this._settings.bulletHeightOffset,
      -1
    )
    this._destroyedBulletIndices = []

    this.logger = new Logger()
    this.logger.level = logLevels.INFO
    this.throttledLogger = this.logger.getThrottledLogger(1000, 'bullet')
  }

  registerHandlers() {
    this.registerHandler('mouse.movement', (m) => {
      this._direction = this._mouseToWorldPosition(
        m.value.position.x,
        m.value.position.y
      )
      this.broadcast({
        topic: 'mouse.direction',
        value: {
          direction: this._direction,
          position: m.value.position,
        },
      })
    })
  }

  update(time, delta) {
    this._disposeOfDestroyedBullets()
    this._moveBullets(time, delta)
    this._handleShoot(time)
  }

  _moveBullets(time, delta) {
    let bullet
    for (let i = 0; i < this._bullets.length; i++) {
      /**
       * @type {GameBody}
       */
      bullet = this._bullets[i].bullet

      let xVel = this._bullets[i].direction.x * this._settings.bulletSpeed
      let zVel = this._bullets[i].direction.z * this._settings.bulletSpeed

      bullet.rigidBody.velocity.set(xVel, 0, zVel)
      bullet.rigidBody.angularVelocity.set(this._settings.bulletSpeed, 0, 0)
      this._bullets[i].bullet.sync(time)
      this._bullets[i].timeAlive += delta
      this._handleDisposal(this._bullets[i], i)
    }
  }

  _handleShoot(time) {
    if (
      this._lastShot === null ||
      time - this._lastShot > this._settings.bulletIntervalBetweenShots
    ) {
      // check for mouse left click
      if (this.getComponent('MouseInputController').pressed === 1) {
        this._shootBullet(time)
        this._lastShot = time
        return
      }

      // check for keyboard trigger key
      for (const [key, active] of Object.entries(
        this.getComponent('InputController')._keys
      )) {
        if (key === this._config.triggerKey && active) {
          this._shootBullet(time)
          this._lastShot = time
          return
        }
      }
    }
  }

  _mouseToWorldPosition(x, y) {
    // Set the raycaster from the camera through the mouse position
    this._raycaster.setFromCamera(new THREE.Vector2(x, y), this._camera)

    // Define a plane at y = 0.6 (player's height)
    const plane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      this._settings.bulletHeightOffset
    )

    // Get the intersection point of the ray with the plane
    const intersection = new THREE.Vector3()
    this._raycaster.ray.intersectPlane(plane, intersection)

    // Calculate the direction from the player to the intersection point
    const direction = new THREE.Vector3()
      .subVectors(intersection, this._playerBody.position)
      .normalize()

    return direction
  }

  _shootBullet(time) {
    const bulletName = `Bullet-${time}`

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
        x: position.x + this._direction.x * 2,
        y: position.y + this._settings.bulletHeightOffset,
        z: position.z + this._direction.z * 2,
      },
      this._direction
    )
    const bullet = new GameBody(bulletMesh, cannonBody, {
      name: bulletName,
      ignoreGravity: true,
    })
    this._attachCollisionEvent(cannonBody, bulletName)
    bullet.sync()
    // TODO: Calc max travel based on player's current position
    // Might need to change how shootBullet is being called too
    this._bullets.push({
      bullet,
      timeAlive: 0.0,
      maxTravel: this._config.maxTravel,
      direction: new THREE.Vector3().copy(this._direction),
    })
  }

  _createBulletBody(position, direction) {
    const cannonBody = new CANNON.Body({
      mass: 0.1,
      shape: new CANNON.Sphere(this._settings.bulletRadius),
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: new CANNON.Material(),
      collisionFilterGroup: BULLET_GROUP,
      collisionFilterMask: ENEMY_GROUP,
    })
    this._world.addBody(cannonBody)
    return cannonBody
  }

  /**
   * @param {CANNON.Body} body
   * @param {string} name
   */
  _attachCollisionEvent(body, name) {
    body.addEventListener('collide', (event) => {
      /**
       * @type {CANNON.Body}
       */
      const other = event.body
      if (other.collisionFilterGroup === ENEMY_GROUP) {
        other.velocity.setZero()
        other.angularVelocity.setZero()
        const idx = this._nameToIndex(name)
        if (idx === -1) {
          this.logger.warn(
            `Bullet ${name} collided with enemy but could not find it in the list`
          )
        }
        this._destroyedBulletIndices.push(idx)
      }
    })
  }

  _disposeOfDestroyedBullets() {
    this._destroyedBulletIndices.forEach((idx) => {
      this._disposeBullet(idx)
    })
    this._destroyedBulletIndices = []
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

  _nameToIndex(bulletName) {
    return this._bullets.findIndex((b) => b.bullet.name === bulletName)
  }

  _disposeBullet(idx) {
    if (!this._bullets[idx]) {
      return
    }
    let obj = this._bullets[idx].bullet
    obj.dispose(this._scene, this._world)
    this._bullets.splice(idx, 1)
    obj = null
  }
}
