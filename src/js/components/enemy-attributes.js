import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'

export class EnemyAttributes extends Component {
  /**
   * @param {GameBody} enemy
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   */
  constructor(enemy, scene, world) {
    super()
    this._health = 10
    this._enemy = enemy
    this._scene = scene
    this._world = world
    this._died = false
  }

  get health() {
    return this._health
  }

  registerHandlers() {
    this.registerHandler('enemy.hurt', (m) => {
      if (m.value.source !== this._enemy._name) {
        return
      }
      this._health -= m.value.damage
    })
  }

  update(time, delta) {
    if (this.health <= 0 && !this._died) {
      this.broadcast({
        topic: 'enemy.died',
        value: {
          source: this._enemy._name,
        },
      })
      this._enemy.dispose(this._scene, this._world)
      this._died = true
    }
  }
}
