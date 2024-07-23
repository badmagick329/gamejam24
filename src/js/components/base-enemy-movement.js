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
    this._step = 0.1
  }

  update() {
    // TODO: Add movement
  }
}
