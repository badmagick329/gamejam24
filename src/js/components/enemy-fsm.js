import { Component } from '../ecs/component.js'
import { GameBody } from '../game/game-body.js'
import { State } from '../game/state.js'
import { Logger, logLevels } from '../logging.js'

const KNOCKED_BACK_TIME = 450

export class EnemyFSM extends Component {
  /**
   * @param {GameBody} enemy
   */
  constructor(enemy, yThresholdToAllowMovement) {
    super()
    if (!(enemy instanceof GameBody)) {
      throw new Error('EnemyFSM must be initialized with a GameBody instance')
    }
    const initialState = this.initStates()
    this.maxTimesInState = {}
    this.currentState = initialState
    this.logger = new Logger()
    this.logger.level = logLevels.INFO
    this.throttledLogger = this.logger.getThrottledLogger(
      1000,
      'enemy fsm component'
    )
    /**
     * @type {GameBody}
     */
    this.enemy = enemy

    this.yThresholdToAllowMovement = yThresholdToAllowMovement
    this.knockedBackTime = KNOCKED_BACK_TIME
    this.closeToGround = false
  }

  initStates() {
    const idleState = new State('idle')
    const walkState = new State('walk')
    const knockedBack = new State('knockedBack')
    const stasisState = new State('stasis')

    idleState.addTransition('walk', walkState)
    idleState.addTransition('knockedBack', knockedBack)

    walkState.addTransition('idle', idleState)
    walkState.addTransition('knockedBack', knockedBack)

    knockedBack.addTransition('idle', idleState)
    knockedBack.addTransition('walk', walkState)
    knockedBack.addTransition('stasis', stasisState)
    knockedBack.addTransition('knockedBack', knockedBack)
    return idleState
  }

  transition(event) {
    const nextState = this.currentState.transitions[event]
    if (nextState) {
      this.logger.debug(
        'Transition',
        this.currentState.name,
        '->',
        nextState.name,
        'current y pos',
        this.enemy?.rigidBody?.position?.y
      )
      this.broadcast({
        topic: `state.change`,
        value: {
          source: this.enemy.name,
          previous: this.currentState.name,
          current: nextState.name,
        },
      })
      this.currentState = nextState
    }
  }

  update(time, delta) {
    this.currentState.timeSpent += delta
    this._handleStateChanges(time)
  }

  _handleStateChanges(time) {
    if (!this.enemy?.rigidBody) {
      return
    }

    if (this.currentState.name === 'knockedBack') {
      this._handleKnockedBackState()
      return
    }

    this.closeToGround =
      this.enemy.rigidBody.position.y <= this.yThresholdToAllowMovement

    if (this.closeToGround && this.currentState.name === 'idle') {
      this.transition('walk')
    } else if (!this.closeToGround) {
      this.transition('idle')
    }
  }

  _handleKnockedBackState() {
    if (this.currentState.timeSpent > this.knockedBackTime) {
      this.currentState.timeSpent = 0
      if (this.enemy.rigidBody.position.y > this.yThresholdToAllowMovement) {
        this.transition('idle')
      } else {
        this.transition('walk')
      }
    }
  }
}
