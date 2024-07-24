import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { initEngine, useTick } from './render/init.js'

import {
  BaseEnemySpawner,
  BulletSpawner,
  InputController,
  // MouseInputController,
  MovementController,
  PlayerFSM,
} from './components'

import { Entity, EntityManager } from './ecs'
import { Game, GameBody, PlayerFactory, postprocessing } from './game'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425

  const startApp = async () => {
    const game = new Game()
    game.init()

    game.player = initPlayer(game.scene, game.world)
    const manager = initEntitiesAndComponents(
      game.renderer,
      game.camera,
      game.scene,
      game.player,
      game.world,
      game.enemies
    )

    postprocessing(game.width, game.height, MOTION_BLUR_AMOUNT)

    useTick(({ timestamp, timeDiff }) => {
      manager.update(timestamp, timeDiff)
      game.world.fixedStep()
      game.player.sync(timestamp)
      game.enemies.forEach((e) => e.sync(timestamp))
      game?.cannonDebugger?.update()
    })
  }

  /**
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   * @returns {GameBody}
   */
  function initPlayer(scene, world) {
    const playerFactory = new PlayerFactory({ world })
    const playerGameBody = playerFactory.create()
    scene.add(playerGameBody.mesh)
    return playerGameBody
  }

  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Scene} scene
   * @param {GameBody} playerBody
   * @param {CANNON.World} world
   * @param {GameBody[]} enemies
   * @returns {EntityManager}
   */
  function initEntitiesAndComponents(
    renderer,
    camera,
    scene,
    playerBody,
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
    // const mouseInputController = new MouseInputController(
    //   renderer,
    //   camera,
    //   scene
    // )
    // player.addComponent(mouseInputController)
    const movementController = new MovementController(
      playerBody.mesh,
      playerBody.rigidBody
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
      playerBody,
      enemies
    )
    enemySpawner.addComponent(baseEnemySpawner)

    manager.add(enemySpawner, 'enemySpawner')
    return manager
  }
  await initEngine()
  startApp()
}
