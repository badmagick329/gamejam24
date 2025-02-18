import * as CANNON from 'cannon-es'
import { Component } from '../ecs/component.js'
import { EntityManager } from '../ecs/entity-manager.js'
import { Entity } from '../ecs/entity.js'
import { BULLET_GROUP } from '../game/consts.js'
import { EnemyFactory } from '../game/factories/enemy-factory.js'
import { GameBody } from '../game/game-body.js'
import { Logger, logLevels } from '../logging.js'
import { addVariance } from '../utils.js'
import { BaseEnemyMovement } from './base-enemy-movement.js'
import { EnemyAttributes } from './enemy-attributes.js'
import { EnemyFSM } from './enemy-fsm.js'

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
    /**
     * @type {EntityManager}
     */
    this._manager = entityManager
    this._scene = scene
    this._world = world
    this._player = player
    this._enemies = enemies
    /**
     * @type {Entity[]}
     */
    this._enemyEntities = []
    this._lastSpawn = null
    this._enemyFactory = new EnemyFactory({ world, settings })
    this.logger = new Logger()
    this.logger.level = logLevels.WARNING
    this.throttledLogger = this.logger.getThrottledLogger(1000, 'enemy spawner')
    // TODO: a temp stop button for spawning for testing. make it a toggleable in debug?
    this._maxEnemies = 10
    this._numberOfSpawns = 0
  }

  registerHandlers() {
    this.registerHandler('enemy.died', (m) => {
      this._numberOfSpawns--
      for (let ee of this._enemyEntities) {
        if (ee.name === m.value.source) {
          this._manager.remove(ee.name)
          ee = null
        }
      }
      this._enemyEntities = this._enemyEntities.filter(
        (entity) => entity !== null
      )
    })
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
    const { movement, enemyFSM } = this._initComponents(enemy)
    this._attachCollisionEvents(enemy, enemyFSM)
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

    // TODO: This approach of removing in place is flawed. Refer to issues
    for (let i = 0; i < toRemove.length; i++) {
      this._enemies.splice(toRemove[i], 1)
    }
    if (toRemove.length > 0) {
      this._numberOfSpawns -= toRemove.length
    }
  }

  /**
   * @param {GameBody} enemy
   * @returns {boolean}
   */
  _isOutOfBounds(enemy) {
    if (!enemy?.rigidBody) {
      return
    }
    return (
      enemy.rigidBody?.position?.y < -5 ||
      enemy.rigidBody?.position?.z < -550 ||
      enemy.rigidBody?.position?.z > 550 ||
      enemy.rigidBody?.position?.x < -600 ||
      enemy.rigidBody?.position?.x > 600
    )
  }

  /**
   * @param {GameBody} enemy
   * @returns {{movement: BaseEnemyMovement|undefined, enemy: EnemyFSM|undefined}}
   */
  _initComponents(enemy) {
    const enemyEntity = new Entity()
    this._manager.add(enemyEntity, enemy.name)
    let movement, enemyFSM
    if (this._settings.enemyMovement) {
      movement = new BaseEnemyMovement(
        enemy,
        this._player,
        this._settings.freezeEnemyGravityAt
      )
      enemyFSM = new EnemyFSM(enemy, this._settings.freezeEnemyGravityAt)
      const enemyAttributes = new EnemyAttributes(
        enemy,
        this._scene,
        this._world
      )
      enemyEntity.addComponent(movement)
      enemyEntity.addComponent(enemyFSM)
      enemyEntity.addComponent(enemyAttributes)
      movement.registerHandlers()
      enemyAttributes.registerHandlers()
    }
    this._enemyEntities.push(enemyEntity)

    return {
      movement,
      enemyFSM,
    }
  }

  /**
   * @param {GameBody} enemy
   * @param {(EnemyFSM|undefined)} enemyFSM
   */
  _attachCollisionEvents(enemy, enemyFSM) {
    if (!enemyFSM) {
      console.log(
        'no fsm initialisd, possibly due to movement being disabled. skipping collision events'
      )
      return
    }

    enemy.rigidBody.addEventListener('collide', (event) => {
      const other = event.body
      // TODO: Change this to knockback weapon when that is added
      if (other.collisionFilterGroup === BULLET_GROUP) {
        enemyFSM.transition('knockedBack')
        const message = {
          topic: 'enemy.hurt',
          value: {
            damage: this._settings.bulletDamage,
            source: enemy.name,
          },
        }
        this.broadcast(message)
      }
    })
  }
}
