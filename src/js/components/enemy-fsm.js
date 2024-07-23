import { Component } from '../ecs'
import { State } from '../game'

export class EnemyFSM extends Component {
  constructor() {
    super()
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
    this.currentState = idleState
  }

  transition(event) {
    const nextState = this.currentState.transitions[event]
    if (nextState) {
      this.currentState = nextState
    }
  }
}
