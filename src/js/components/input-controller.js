import { Component } from '../ecs'

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
    switch (event.key) {
      case 'w':
        this._keys.forward = true
        break
      case 'a':
        this._keys.left = true
        break
      case 's':
        this._keys.backward = true
        break
      case 'd':
        this._keys.right = true
        break
      case ' ':
        this._keys.space = true
        break
    }
  }

  _onKeyUp(event) {
    switch (event.key) {
      case 'w':
        this._keys.forward = false
        break
      case 'a':
        this._keys.left = false
        break
      case 's':
        this._keys.backward = false
        break
      case 'd':
        this._keys.right = false
        break
      case ' ':
        this._keys.space = false
        break
    }
  }
}
