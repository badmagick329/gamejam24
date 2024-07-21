import Component from '../ecs/component'
import { State } from '../state'

export default class PlayerFSM extends Component {
  constructor() {
    super()
    const idleState = new State('idle')
    const walkState = new State('walk')
    const jumpState = new State('jump')
    idleState.addTransition('walk', walkState)
    idleState.addTransition('jump', jumpState)

    walkState.addTransition('idle', idleState)
    walkState.addTransition('jump', jumpState)

    jumpState.addTransition('idle', idleState)
    jumpState.addTransition('walk', walkState)
    this.currentState = idleState
  }
  transition(event) {
    const nextState = this.currentState.transitions[event]
    if (nextState) {
      this.currentState = nextState
    }
  }

  handleMovement(m) {
    // NOTE: going through state machine to update states when/if needed
  }

  update(_, keys) {}
}
