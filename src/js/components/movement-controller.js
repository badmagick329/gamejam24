import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'

const movementMap = {
  forward: (m) => {
    // Local forward direction (+Z in local space)
    const vector = new THREE.Vector3(0, 0, -1)
    moveTo(vector, m.value)
  },
  forwardRight: (m) => {
    const vector = new THREE.Vector3(1, 0, -1)
    moveTo(vector, m.value)
  },
  right: (m) => {
    const vector = new THREE.Vector3(1, 0, 0)
    moveTo(vector, m.value)
  },
  backwardRight: (m) => {
    const vector = new THREE.Vector3(1, 0, 1)
    moveTo(vector, m.value)
  },
  backward: (m) => {
    const vector = new THREE.Vector3(0, 0, 1)
    moveTo(vector, m.value)
  },
  backwardLeft: (m) => {
    const vector = new THREE.Vector3(-1, 0, 1)
    moveTo(vector, m.value)
  },
  left: (m) => {
    const vector = new THREE.Vector3(-1, 0, 0)
    moveTo(vector, m.value)
  },
  forwardLeft: (m) => {
    const vector = new THREE.Vector3(-1, 0, -1)
    moveTo(vector, m.value)
  },
}

export class MovementController extends Component {
  /**
   * @param {THREE.Mesh} mesh
   * @param {CANNON.Body} body
   * @param {number} speed
   */
  constructor(mesh, body, speed) {
    super()
    this._mesh = mesh
    this._body = body
    this._step = speed
  }

  registerHandlers() {
    this.registerHandler('player.movement', (m) => {
      for (const key of m.value.pressedKeys) {
        movementMap[key] && movementMap[key](m)
      }
    })
  }

  update(_, delta) {
    const pressedKeys = []
    for (const [key, active] of Object.entries(
      this.getComponent('InputController')._keys
    )) {
      if (!active) {
        continue
      }
      pressedKeys.push(key)
    }
    if (pressedKeys.length === 0) {
      return
    }
    getDiagonalPresses(pressedKeys)
    this.broadcast({
      topic: 'player.movement',
      value: {
        pressedKeys,
        body: this._body,
        step: this._step,
      },
    })
  }
}

function moveTo(vector, values) {
  /**
   * @type {CANNON.Body}
   */
  const body = values.body
  /**
   * @type {number}
   */
  const step = values.step
  const movement = new CANNON.Vec3(
    vector.x * step,
    vector.y * step,
    vector.z * step
  )

  body.velocity.set(movement.x, 0, movement.z)
}

/**
 * @param {string[]} pressedKeys
 */
function getDiagonalPresses(pressedKeys) {
  const forward = pressedKeys.includes('forward')
  const backward = pressedKeys.includes('backward')
  const left = pressedKeys.includes('left')
  const right = pressedKeys.includes('right')
  if (forward && left) {
    pressedKeys.splice('forward')
    pressedKeys.splice('left')
    pressedKeys.push('forwardLeft')
  }
  if (forward && right) {
    pressedKeys.splice('forward')
    pressedKeys.splice('right')
    pressedKeys.push('forwardRight')
  }
  if (backward && left) {
    pressedKeys.splice('backward')
    pressedKeys.splice('left')
    pressedKeys.push('backwardLeft')
  }
  if (backward && right) {
    pressedKeys.splice('backward')
    pressedKeys.splice('right')
    pressedKeys.push('backwardRight')
  }
}
