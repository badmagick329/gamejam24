import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import Component from '../ecs/component'

const INTERVAL = 150
const MAX_TIME = 20000

export default class BulletSpawner extends Component {
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
    this._bulletSpeed = 24.0
    this._bullets = []
    this._readyToShoot = true
    this._lastShot = null
    this._interval = INTERVAL
    this._max_time = MAX_TIME
  }

  _shootBullet(direction) {
    const location = this._playerBody.translation()
    const position = { x: location.x, y: location.y, z: location.z + 1 }
    const bulletGeometry = new THREE.SphereGeometry(0.1, 16, 16)
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    this._scene.add(bulletMesh)

    const bulletBody = this._createBulletBody(position, direction)
    this._bullets.push({ mesh: bulletMesh, body: bulletBody, timeAlive: 0.0 })
  }

  _createBulletBody(position, direction) {
    let desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinvel(
        direction.x * this._bulletSpeed,
        direction.y * this._bulletSpeed,
        direction.z * this._bulletSpeed
      )
      .setGravityScale(0.0)
      .setAdditionalMass(1000)
      .setCcdEnabled(true)
    let body = this._world.createRigidBody(desc)

    let colDesc = RAPIER.ColliderDesc.ball(0.8).setFriction(0.5)
    this._world.createCollider(colDesc, body)

    return body
  }

  handleShoot() {
    this._shootBullet({ x: 0, y: 0, z: 1 })
  }

  update(time, delta) {
    if (this._lastShot === null || time - this._lastShot > this._interval) {
      for (const [key, active] of Object.entries(
        this.getComponent('InputController')._keys
      )) {
        if (key === 'space' && active) {
          this.handleShoot()
          this._lastShot = time
        }
      }
    }

    for (let i = 0; i < this._bullets.length; i++) {
      let position = this._bullets[i].body.translation()
      this._bullets[i].mesh.position.set(position.x, position.y, position.z)

      let rotation = this._bullets[i].body.rotation()
      this._bullets[i].mesh.quaternion.set(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
      )

      this._bullets[i].timeAlive += delta

      if (
        position.z > 200 ||
        position.z < -200 ||
        position.x > 200 ||
        position.x < -200 ||
        position.y > 200 ||
        position.y < -200
      ) {
        this.disposeBullet(i)
      } else if (this._bullets[i].timeAlive > this._max_time) {
        this.disposeBullet(i)
      }
    }
  }

  disposeBullet(idx) {
    // console.log('disposing', idx);
    // TODO: Ensure everything is actually getting disposed
    this._scene.remove(this._bullets[idx].mesh)
    this._world.removeRigidBody(this._bullets[idx].body)
    this._bullets.splice(idx, 1)
  }
}
