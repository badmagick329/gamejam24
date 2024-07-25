import * as CANNON from 'cannon-es'
import { Component } from '../ecs'
import { GameBody } from '../game'

export class BaseEnemyMovement extends Component {
  /**
   * @param {GameBody} enemy
   * @param {GameBody} player
   */
  constructor(enemy, player) {
    super()
    this._enemy = enemy
    this._player = player
    this._step = 15
    this._dead = false
  }

  update() {
    if (this._dead) {
      return
    }
    const playerPosition = this._player.rigidBody.position
    if (!this._enemy?.rigidBody?.position) {
      this._dead = true
      return
    }
    const enemyPosition = this._enemy.rigidBody.position
    if (enemyPosition.y > 1.8) {
      return
    }
    const direction = new CANNON.Vec3(
      playerPosition.x,
      playerPosition.y,
      playerPosition.z
    )
    playerPosition.vsub(enemyPosition, direction)
    direction.normalize()

    this._enemy.rigidBody.velocity.set(
      direction.x * this._step,
      this._enemy.rigidBody.velocity.y,
      direction.z * this._step
    )
  }
}
