import { Component } from '../ecs'
import { GameBody, State } from '../game'
import { Logger, logLevels } from '../logging'

export class EnemyFSM extends Component {
  /**
   * @param {GameBody} enemy
   */
  constructor(enemy) {
    super()
    if (!(enemy instanceof GameBody)) {
      throw new Error('EnemyFSM must be initialized with a GameBody instance')
    }
    const initialState = this.initStates()
    this.maxTimesInState = {}
    this.currentState = initialState
    this.logger = new Logger()
    this.logger.level = logLevels.WARNING
    this.throttledLogger = this.logger.getThrottledLogger(
      1000,
      'enemy fsm component'
    )
    /**
     * @type {GameBody}
     */
    this.enemy = enemy
    this.yThresholdToAllowMovement = 1.8
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
    knockedBack.addTransition('knockback', knockedBack)

    this.maxTimesInState = [
      {
        name: 'knockBack',
        maxTime: 1000,
        nextState: 'walk',
      },
    ]
    return idleState
  }

  transition = (event) => {
    const nextState = this.currentState.transitions[event]
    if (nextState) {
      this.currentState = nextState
    }
  }

  update(time, delta) {
    this.currentState.timeSpent += delta
    this._handlePositionBasedChanges(time)
    this._handleTimeBasedChanges(time)
  }

  _handlePositionBasedChanges(time) {
    if (!this.enemy?.rigidBody) {
      return
    }
    this.throttledLogger.info(time, 'y pos', this.enemy.rigidBody.position.y)
    if (
      this.enemy.rigidBody.position.y <= this.yThresholdToAllowMovement &&
      this.currentState.name === 'idle'
    ) {
      this.transition('walk')
    }
  }

  _handleTimeBasedChanges(time) {
    if (!this.enemy?.rigidBody) {
      return
    }

    if (this.currentState.name === 'knockedBack') {
      if (this.currentState.timeSpent > 1000) {
        if (this.enemy.rigidBody.position.y > this.yThresholdToAllowMovement) {
          this.transition('idle')
        } else {
          this.transition('walk')
        }
        this.currentState.timeSpent = 0
      }
    }
  }
}
