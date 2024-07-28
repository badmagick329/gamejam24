import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { Logger, logLevels } from '../logging'

const IDLE_COLOR = 0x7777ff
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
    this.logger = new Logger()
    this.logger.level = logLevels.DEBUG
    this.isWalking = false
    this.throttledLogger = this.logger.getThrottledLogger(
      1000,
      this._enemy._name
    )
    this.stateColors = {
      idle: new THREE.Color(IDLE_COLOR),
      walk: new THREE.Color(WALK_COLOR),
      knockedBack: new THREE.Color(KNOCKEDBACK_COLOR),
    }
  }

  registerHandlers() {
    this.registerHandler('state.change', (m) => {
      if (this._enemy.name !== m.value.source) {
        return
      }
      this.setColorBasedOnState(m.value.current)
      this.isWalking = m.value.current === 'walk' ? true : false
    })
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

    this.updateEnemyMovement(playerPosition)
  }

  updateEnemyMovement(playerPosition) {
    if (!this.isWalking) {
      return
    }
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

  setColorBasedOnState(name) {
    if (!this._enemy?.mesh?.material) {
      return
    }

    this._enemy.mesh.material.color = this.stateColors[name]
  }
}
