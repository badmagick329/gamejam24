import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'

const config = {
  intervalBetweenShots: 150,
  maxTimeAlive: 20000,
  maxTravel: 50,
  triggerKey: 'space',
  bulletSpeed: 24.0,
}

export class BulletSpawner extends Component {
  /**
   * @param {RAPIER.RigidBody} playerBody
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
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
    this._handleShoot(time)

    for (let i = 0; i < this._bullets.length; i++) {
      this._bullets[i].bullet.sync()
      this._handleDisposal(this._bullets[i], this._bullets[i].timeAlive, i)
    }
  }

  _shootBullet(direction) {
    const location = this._playerBody.translation()
    const position = { x: location.x, y: location.y, z: location.z + 1 }
    const bulletGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    this._scene.add(bulletMesh)

    const bulletBodyAndCollider = this._createBulletBodyAndCollider(
      position,
      direction
    )
    const bullet = new GameBody(
      bulletMesh,
      bulletBodyAndCollider.rigidBody,
      bulletBodyAndCollider.collider
    )
    // TODO: Calc max travel based on player's current position
    // Might need to change how shootBullet is being called too
    this._bullets.push({
      bullet,
      timeAlive: 0.0,
      maxTravel: this._config.maxTravel,
    })
  }

  _createBulletBodyAndCollider(position, direction) {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinvel(
        direction.x * this._config.bulletSpeed,
        direction.y * this._config.bulletSpeed,
        direction.z * this._config.bulletSpeed
      )
      .setGravityScale(0.0)
      .setAdditionalMass(1000)
      .setCcdEnabled(true)
    const rigidBody = this._world.createRigidBody(desc)

    const colDesc = RAPIER.ColliderDesc.ball(0.8).setFriction(0.5)
    const collider = this._world.createCollider(colDesc, rigidBody)

    return { rigidBody, collider }
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
          this._shootBullet({ x: 0, y: 0, z: 1 })
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
    const position = bullet.bullet.rigidBody.translation()
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
    // TODO: Ensure everything is actually getting disposed
    this._scene.remove(this._bullets[idx].bullet.mesh)
    this._world.removeRigidBody(this._bullets[idx].bullet.rigidBody)
    this._bullets.splice(idx, 1)
  }
}
