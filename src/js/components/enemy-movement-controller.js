import { Component } from '../ecs'
import { GameBody } from '../game'

export class EnemyMovementController extends Component {
  /**
   * @param {GameBody} player
   */
  constructor(player) {
    super()
    this._player = player
    this._step = 0.1
  }
}
