import { Component, EntityManager } from '../ecs'
import { EnemyFactory } from '../game'
import { addVariance } from '../utils'

const SPAWN_INTERVAL = 3000

export class BaseEnemySpawner extends Component {
  /**
   * @param {EntityManager} entityManger
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @param {GameBody[]} enemies
   */
  constructor(entityManager, scene, world, enemies) {
    super()
    this._manager = entityManager
    this._scene = scene
    this._world = world
    this._enemies = enemies
    this._lastSpawn = null
    this._enemyFactory = new EnemyFactory({ world })
    // TODO: a temp stop button for spawning for testing. make it a toggleable in debug?
    this._maxEnemies = 20
    this._numberOfSpawns = 0
  }

  update(timeElapsed, timeDiff) {
    if (this._numberOfSpawns > this._maxEnemies) {
      return
    }
    // Delay first spawn, or do something else with it
    if (this._lastSpawn === null && timeElapsed > SPAWN_INTERVAL * 3) {
      this._spawn(timeElapsed)
    }
    if (this._lastSpawn && timeElapsed - this._lastSpawn > SPAWN_INTERVAL) {
      this._spawn(timeElapsed)
    }

    this._removeOutOfBoundsEnemies()
  }

  _spawn(timeElapsed) {
    this._lastSpawn = timeElapsed
    const x = addVariance(0, 30, 30)
    const y = addVariance(40, 30, 10)
    const z = addVariance(0, 10, 30)
    const enemy = this._enemyFactory
      .setPosition(x, y, z)
      .setBaseEnemy()
      .create()
    this._enemies.push(enemy)
    this._scene.add(enemy.mesh)
    this._numberOfSpawns++
  }

  _removeOutOfBoundsEnemies() {
    const toRemove = []
    for (let i = 0; i < this._enemies.length; i++) {
      if (!this._isOutOfBounds(this._enemies[i])) {
        continue
      }

      this._enemies[i].dispose(this._scene, this._world)
      toRemove.push(i)
      this._enemies[i] = null
    }

    // Important: remove from array in place
    for (let i = 0; i < toRemove.length; i++) {
      this._enemies.splice(toRemove[i], 1)
    }
    if (toRemove.length > 0) {
      // console.log('enemies array now is', this._enemies)
    }
  }

  /**
   * @param {GameBody} enemy
   */
  _isOutOfBounds(enemy) {
    const pos = enemy.rigidBody.translation()
    return pos.y < -30
  }
}
