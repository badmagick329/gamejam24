import * as CANNON from 'cannon-es'
import { Component, Entity, EntityManager } from '../ecs'
import { EnemyFactory, GameBody } from '../game'
import { addVariance } from '../utils'
import { BaseEnemyMovement } from './base-enemy-movement'
// import { EnemyFSM } from './enemy-fsm'

export class BaseEnemySpawner extends Component {
  /**
   * @param {EntityManager} entityManger
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   * @param {GameBody} player
   * @param {GameBody[]} enemies
   * @param {import('../types').GameSettings} settings
   */
  constructor(entityManager, scene, world, player, enemies, settings) {
    super()
    this._settings = settings
    this._manager = entityManager
    this._scene = scene
    this._world = world
    this._player = player
    this._enemies = enemies
    this._lastSpawn = null
    this._enemyFactory = new EnemyFactory({ world, settings })
    // TODO: a temp stop button for spawning for testing. make it a toggleable in debug?
    this._maxEnemies = 5
    this._numberOfSpawns = 0
  }

  update(timeElapsed, timeDiff) {
    this._removeOutOfBoundsEnemies()
    if (this._numberOfSpawns >= this._maxEnemies) {
      return
    }
    // Delay first spawn, or do something else with it
    if (
      this._lastSpawn === null &&
      timeElapsed > this._settings.baseEnemySpawnInterval * 1
    ) {
      this._spawn(timeElapsed)
    }
    if (
      this._lastSpawn &&
      timeElapsed - this._lastSpawn > this._settings.baseEnemySpawnInterval
    ) {
      this._spawn(timeElapsed)
    }
  }

  _spawn(timeElapsed) {
    this._lastSpawn = timeElapsed
    const x = addVariance(0, 30, 30)
    const y = addVariance(40, 30, 10)
    const z = addVariance(0, 30, 10)
    const enemy = this._enemyFactory
      .setPosition(x, y, z)
      .setBaseEnemy()
      .create(`enemy-${timeElapsed}`)
    this._enemies.push(enemy)
    this._scene.add(enemy.mesh)
    this._numberOfSpawns++
    this._initComponents(enemy)
  }

  /**
   * @returns {void}
   */
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
      // console.log('enemies array length now is', this._enemies.length)
    }
  }

  /**
   * @param {GameBody} enemy
   * @returns {boolean}
   */
  _isOutOfBounds(enemy) {
    return (
      enemy.rigidBody?.position?.y < -30 ||
      enemy.rigidBody?.position?.z < -50 ||
      enemy.rigidBody?.position?.z > 50
    )
  }

  /**
   * @param {GameBody} enemy
   * @returns {void}
   */
  _initComponents(enemy) {
    const enemyEntity = new Entity()
    if (this._settings.enemyMovement) {
      const movement = new BaseEnemyMovement(enemy, this._player)
      // const enemyFSM = new EnemyFSM()
      enemyEntity.addComponent(movement)
      // enemyEntity.addComponent(enemyFSM)
    }
    this._manager.add(enemyEntity)
  }
}
