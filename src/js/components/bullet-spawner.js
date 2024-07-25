import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { BULLET_GROUP, ENEMY_GROUP } from '../game/consts'

const config = {
  intervalBetweenShots: 110,
  maxTimeAlive: 10000,
  maxTravel: 50,
  triggerKey: 'space',
  bulletSpeed: 50.0,
  bulletRadius: 0.3,
  playerZOffset: 3,
}

export class BulletSpawner extends Component {
  /**
   * @param {CANNON.Body} playerBody
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   */
  constructor(playerBody, scene, world) {
    super()
    this._playerBody = playerBody
    this._scene = scene
    this._world = world
    this._bullets = []
    this._lastShot = null
    this._config = config
  }

  update(time, delta) {
    for (let i = 0; i < this._bullets.length; i++) {
      this._bullets[i].bullet.rigidBody.velocity.set(
        0,
        0,
        -this._config.bulletSpeed
      )
      this._bullets[i].bullet.sync()
      this._bullets[i].timeAlive += delta
      this._handleDisposal(this._bullets[i], i)
    }

    this._handleShoot(time)
  }

  _shootBullet(direction) {
    const position = this._playerBody.position
    const bulletGeometry = new THREE.SphereGeometry(
      this._config.bulletRadius,
      16,
      16
    )
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    this._scene.add(bulletMesh)

    const cannonBody = this._createBulletBody(
      {
        x: position.x,
        y: position.y,
        z: position.z - this._config.playerZOffset,
      },
      direction
    )
    const bullet = new GameBody(bulletMesh, cannonBody, {
      ignoreGravity: true,
    })
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
      shape: new CANNON.Sphere(this._config.bulletRadius),
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: new CANNON.Material(),
      velocity: new CANNON.Vec3(
        direction.x * this._config.bulletSpeed,
        direction.y * this._config.bulletSpeed,
        direction.z * this._config.bulletSpeed
      ),
      collisionFilterGroup: BULLET_GROUP,
      collisionFilterMask: ENEMY_GROUP,
    })
    this._world.addBody(cannonBody)
    return cannonBody
  }

  _handleShoot(time) {
    if (
      this._lastShot === null ||
      time - this._lastShot > this._config.intervalBetweenShots
    ) {
      for (const [key, active] of Object.entries(
        this.getComponent('InputController')._keys
      )) {
        if (key === this._config.triggerKey && active) {
          this._shootBullet({ x: 0, y: 0, z: -1.0 })
          this._lastShot = time
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
