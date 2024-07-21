import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import Component from '../ecs/component'

export default class MouseMovementController extends Component {
  /**
   * @param {THREE.Mesh} mesh
   * @param {RAPIER.Collider} collider
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.KinematicCharacterController} controller
   * @param {THREE.Mesh} ground
   */
  constructor(mesh, collider, body, controller, ground) {
    super()
    this._mesh = mesh
    this._collider = collider
    this._body = body
    this._controller = controller
    this._ground = ground
    this._fsm = null
    this._gravity = new RAPIER.Vector3(0, -9.81, 0)
    this._velocity = new RAPIER.Vector3(0, 0, 0)
    this._step = 0.2
  }

  update(_, delta) {
    if (!this._fsm) {
      this._fsm = this.getComponent('PlayerFSM')
      this.registerHandler('mouse.movement', (m) => {
        if (m.value.buttons !== 1) {
          return
        }
        this.broadcast({
          topic: 'player.movement',
          value: {
            ...m.value,
            moveCallback: (m) => this.moveToMousePosition(m),
            ground: this._ground,
            body: this._body,
            controller: this._controller,
            collider: this._collider,
            mesh: this._mesh,
            step: this._step,
          },
        })
      })
    }
  }

  moveToMousePosition(m) {
    let ground
    for (const intersect of m.value.intersects) {
      if (intersect.object.id === m.value.ground.id) {
        ground = intersect
      }
    }
    if (!ground) {
      return
    }

    const playerPosition = m.value.body.translation()
    const targetVector = ground.point.clone().sub(playerPosition)
    const vector = new THREE.Vector3(targetVector.x, 0.0, targetVector.z)
    this._moveTo(vector.normalize(), m.value)
  }

  _moveTo(normalisedVector, values) {
    const { controller, collider, body, mesh, step } = values

    const movement = new RAPIER.Vector3(
      normalisedVector.x * step,
      normalisedVector.y * step,
      normalisedVector.z * step
    )

    controller.computeColliderMovement(collider, movement)
    const effectiveMovement = controller.computedMovement()
    const newPosition = body.translation()
    newPosition.x += effectiveMovement.x
    newPosition.y += effectiveMovement.y
    newPosition.z += effectiveMovement.z
    body.setNextKinematicTranslation(newPosition)

    mesh.position.copy(newPosition)
  }
}
