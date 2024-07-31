import { Component } from '../ecs/component.js'

const keyMap = {
  w: 'forward',
  a: 'left',
  s: 'backward',
  d: 'right',
  ' ': 'space',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'backward',
}

export class InputController extends Component {
  constructor() {
    super()
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
    }
    this._init()
  }

  _init() {
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false)
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false)
  }

  _onKeyDown(event) {
    if (keyMap[event.key] === undefined) {
      return
    }
    this._keys[keyMap[event.key]] = true
  }

  _onKeyUp(event) {
    if (keyMap[event.key] === undefined) {
      return
    }
    this._keys[keyMap[event.key]] = false
  }
}
