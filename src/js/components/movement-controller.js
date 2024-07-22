import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { Component } from '../ecs'

const movementMap = {
  forward: (m) => {
    // Local forward direction (+Z in local space)
    const vector = new THREE.Vector3(0, 0, 1)
    moveTo(vector, m.value)
  },
  forwardRight: (m) => {
    const vector = new THREE.Vector3(-1, 0, 1)
    moveTo(vector, m.value)
  },
  right: (m) => {
    const vector = new THREE.Vector3(-1, 0, 0)
    moveTo(vector, m.value)
  },
  backwardRight: (m) => {
    const vector = new THREE.Vector3(-1, 0, -1)
    moveTo(vector, m.value)
  },
  backward: (m) => {
    const vector = new THREE.Vector3(0, 0, -1)
    moveTo(vector, m.value)
  },
  backwardLeft: (m) => {
    const vector = new THREE.Vector3(1, 0, -1)
    moveTo(vector, m.value)
  },
  left: (m) => {
    const vector = new THREE.Vector3(1, 0, 0)
    moveTo(vector, m.value)
  },
  forwardLeft: (m) => {
    const vector = new THREE.Vector3(1, 0, 1)
    moveTo(vector, m.value)
  },
}

export class MovementController extends Component {
  /**
   * @param {THREE.Mesh} mesh
   * @param {RAPIER.Collider} collider
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.KinematicCharacterController} controller
   */
  constructor(mesh, collider, body, controller) {
    super()
    this._mesh = mesh
    this._collider = collider
    this._body = body
    this._controller = controller
    this._fsm = null
    this._step = 0.1
  }

  update(_, delta) {
    // NOTE: this has to be initialised here to ensure that all components have been added
    // before this
    if (!this._fsm) {
      this._fsm = this.getComponent('PlayerFSM')
      this.registerHandler('player.movement', (m) => {
        for (const key of m.value.pressedKeys) {
          movementMap[key] && movementMap[key](m)
        }
        this._fsm.handleMovement(m)
      })
    }

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
        movementMap,
        mesh: this._mesh,
        body: this._body,
        collider: this._collider,
        controller: this._controller,
        step: this._step,
        delta,
      },
    })
  }
}

function moveTo(vector, values) {
  const { controller, collider, body, mesh, step } = values
  const movement = new RAPIER.Vector3(
    vector.x * step,
    vector.y * step,
    vector.z * step
  )

  // 1. Apply the movement to the character controller
  controller.computeColliderMovement(collider, movement)

  // 2. Get the effective movement from the controller
  const effectiveMovement = controller.computedMovement()

  // 3. Update the rigid body position
  const newPosition = body.translation()
  newPosition.x += effectiveMovement.x
  newPosition.y += effectiveMovement.y
  newPosition.z += effectiveMovement.z
  body.setNextKinematicTranslation(newPosition)

  // 4. Update mesh position
  mesh.position.copy(newPosition)
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
