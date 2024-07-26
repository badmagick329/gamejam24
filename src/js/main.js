import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { settings } from '../../.game-settings.js'
import { ThirdPersonCamera } from './components'
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
import { Logger, logLevels } from './logging.js'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425

  const startApp = async () => {
    const logger = new Logger()
    logger.level = logLevels.DEBUG
    const throttledLogger = logger.getThrottledLogger(1000, 'camera')
    const game = new Game(settings)

    game.init()

    game.player = initPlayer(game.scene, game.world, game.settings)
    const manager = initEntitiesAndComponents(
      game.renderer,
      game.camera,
      game.scene,
      game.player,
      game.world,
      game.enemies,
      game.settings
    )

    postprocessing(game.width, game.height, MOTION_BLUR_AMOUNT)

    useTick(({ timestamp, timeDiff }) => {
      if (!settings.thirdPerson) {
        manager.update(timestamp, timeDiff)
      }
      game.world.fixedStep()
      game.defenceObject.sync(timestamp)
      game.player.sync(timestamp)
      game.enemies.forEach((e) => e.sync(timestamp))
      if (settings.thirdPerson) {
        manager.update(timestamp, timeDiff)
      }
      if (game.settings.cannonDebugger) {
        game?.cannonDebugger?.update()
      }

      // TODO: Temporary stuff. move/remove after testing
      if (settings.thirdPerson) {
        game.controls.target.copy(game.player.mesh.position)
      }
      // ----------------

      // console.log('game.planesidemesh', game.groundSideMesh)
      game.groundSideMesh.material.uniforms.uTime.value = timestamp / 10000
    })
  }

  /**
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   * @param {Object} settings
   * @returns {GameBody}
   */
  function initPlayer(scene, world, settings) {
    const playerFactory = new PlayerFactory({ world, settings })
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
   * @param {Object} settings
   * @returns {EntityManager}
   */
  function initEntitiesAndComponents(
    renderer,
    camera,
    scene,
    playerBody,
    world,
    enemies,
    settings
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
      playerBody.rigidBody,
      settings.playerSpeed
    )
    player.addComponent(movementController)

    // camera
    if (settings.thirdPerson) {
      const thirdPersonCamera = new ThirdPersonCamera()
      player.addComponent(thirdPersonCamera)
      thirdPersonCamera.setTarget(playerBody.mesh)
    }

    // bullets
    const bulletSpawner = new BulletSpawner(
      playerBody.rigidBody,
      scene,
      world,
      settings
    )
    player.addComponent(bulletSpawner)
    manager.add(player, 'player')

    // enemies
    const enemySpawner = new Entity()
    const baseEnemySpawner = new BaseEnemySpawner(
      manager,
      scene,
      world,
      playerBody,
      enemies,
      settings
    )
    enemySpawner.addComponent(baseEnemySpawner)

    manager.add(enemySpawner, 'enemySpawner')
    return manager
  }
  await initEngine()
  startApp()
}
