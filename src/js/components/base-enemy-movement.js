import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'

export class BaseEnemyMovement extends Component {
  /**
   * @param {GameBody} enemy
   * @param {GameBody} player
   */
  constructor(enemy, player) {
    super()
    console.log('enemy', enemy)
    this._enemy = enemy
    this._player = player
    this._step = 0.1
  }

  update() {
    // TODO: Add movement
    // Temp movement test
    const enemyTranslation = this._enemy.rigidBody.translation()
    if (enemyTranslation.z < 20) {
      this._enemy.rigidBody.applyImpulse({ x: 0.0, y: 0.0, z: 0.1 }, true)
    } else {
    }
    const enemyPos = new THREE.Vector3(
      enemyTranslation.x,
      enemyTranslation.y,
      enemyTranslation.z
    )
    const playerTranslation = this._player.rigidBody.translation()
    const playerPos = new THREE.Vector3(
      playerTranslation.x,
      playerTranslation.y,
      playerTranslation.z
    )
    const direction = playerPos.clone().sub(enemyPos).normalize()
    const distance = playerPos.distanceTo(enemyPos)
  }
}
