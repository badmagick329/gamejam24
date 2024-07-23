import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { initEngine, useTick } from './render/init.js'

import {
  BaseEnemySpawner,
  BulletSpawner,
  InputController,
  MouseInputController,
  MovementController,
  PlayerFSM,
} from './components'

import { Entity, EntityManager } from './ecs'
import {
  EnemyFactory,
  Game,
  GameBody,
  PlayerFactory,
  postprocessing,
} from './game'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425

  const startApp = async () => {
    const game = new Game()
    await game.init()

    game.player = initPlayer(game.scene, game.world)
    initEnemies(game.scene, game.world, game.enemies)
    const manager = initEntitiesAndComponents(
      game.renderer,
      game.camera,
      game.scene,
      game.player,
      game.characterController,
      game.world,
      game.enemies
    )

    postprocessing(game.width, game.height, MOTION_BLUR_AMOUNT)

    useTick(({ timestamp, timeDiff }) => {
      game.world.step()
      manager.update(timestamp, timeDiff)
      game.player.sync()
      for (const enemy of game.enemies) {
        enemy.sync()
      }
    })
  }

  /**
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @returns {GameBody}
   */
  function initPlayer(scene, world) {
    const playerFactory = new PlayerFactory({ world })
    const playerGameBody = playerFactory.create()
    scene.add(playerGameBody.mesh)
    return playerGameBody
  }

  /**
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @param {GameBody[]} enemies
   * @returns {void}
   */
  function initEnemies(scene, world, enemies) {
    const enemyFactory = new EnemyFactory({ world })
    for (const pos of boxPositions) {
      const enemy = enemyFactory
        .setPosition(pos.x, pos.y, pos.z)
        .setBaseEnemy()
        .create()
      enemies.push(enemy)
      scene.add(enemy.mesh)
    }
  }

  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Scene} scene
   * @param {GameBody} playerBody
   * @param {RAPIER.KinematicCharacterController} characterController
   * @param {RAPIER.World} world
   * @param {GameBody[]} enemies
   * @returns {EntityManager}
   */
  function initEntitiesAndComponents(
    renderer,
    camera,
    scene,
    playerBody,
    characterController,
    world,
    enemies
  ) {
    // Create entities and components
    const manager = new EntityManager()
    const player = new Entity()
    // player state machine
    const playerFsm = new PlayerFSM()
    player.addComponent(playerFsm)

    // inputs and movement
    const inputController = new InputController()
    player.addComponent(inputController)
    const mouseInputController = new MouseInputController(
      renderer,
      camera,
      scene
    )
    player.addComponent(mouseInputController)
    const movementController = new MovementController(
      playerBody.mesh,
      playerBody.collider,
      playerBody.rigidBody,
      characterController
    )
    player.addComponent(movementController)

    // bullets
    const bulletSpawner = new BulletSpawner(playerBody.rigidBody, scene, world)
    player.addComponent(bulletSpawner)
    manager.add(player, 'player')

    // enemies
    const enemySpawner = new Entity()
    const baseEnemySpawner = new BaseEnemySpawner(
      manager,
      scene,
      world,
      enemies
    )
    enemySpawner.addComponent(baseEnemySpawner)

    manager.add(enemySpawner, 'enemySpawner')
    return manager
  }
  await initEngine()
  startApp()
}

const boxPositions = [
  {
    x: 0,
    y: 20,
    z: 3,
  },
  {
    x: 0,
    y: 20,
    z: -3,
  },
  {
    x: 3,
    y: 20,
    z: 0,
  },
  {
    x: -3,
    y: 20,
    z: 0,
  },
]
