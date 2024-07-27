import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { Logger, logLevels } from '../logging'

const IDLE_COLOR = 0x9999ff
const WALK_COLOR = 0xa0b04a
const KNOCKEDBACK_COLOR = 0xeeeeee

export class BaseEnemyMovement extends Component {
  /**
   * @param {GameBody} enemy
   * @param {GameBody} player
   * @param {number} yThresholdToAllowMovement
   */
  constructor(enemy, player, yThresholdToAllowMovement) {
    super()
    this._enemy = enemy
    this._player = player
    this.yThresholdToAllowMovement = yThresholdToAllowMovement
    this._step = 15
    this._dead = false
    this._fsm = null
    this.logger = new Logger()
    this.logger.level = logLevels.WARNING
    this.throttledLogger = this.logger.getThrottledLogger(
      1000,
      this._enemy._name
    )
  }

  update(time) {
    if (this._dead) {
      return
    }
    const playerPosition = this._player.rigidBody.position
    if (!this._enemy?.rigidBody?.position) {
      // body has been cleaned up, no need to proceed
      // TODO: Ensure this isn't continuously running after the body has been removed
      this._dead = true
      return
    }

    if (!this._fsm) {
      this._fsm = this.getComponent('EnemyFSM')
    }

    this.setColorBasedOnState()

    const movementDisable =
      this._fsm.currentState.name === 'idle' ||
      this._fsm.currentState.name === 'knockedBack'
    if (movementDisable) {
      return
    }

    this.updateEnemyMovement(playerPosition)
  }

  updateEnemyMovement(playerPosition) {
    const enemyPosition = this._enemy.rigidBody.position

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

  setColorBasedOnState() {
    if (this._fsm.currentState.name === 'idle') {
      this._enemy.mesh.material.color = new THREE.Color(IDLE_COLOR)
    } else if (this._fsm.currentState.name === 'walk') {
      this._enemy.mesh.material.color = new THREE.Color(WALK_COLOR)
    } else if (this._fsm.currentState.name === 'knockedBack') {
      this._enemy.mesh.material.color = new THREE.Color(KNOCKEDBACK_COLOR)
    }
  }
}
