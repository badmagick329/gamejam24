import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { settings } from '../../game-settings.js'
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

import { BuildingsComp } from './components/buildings-comp.js'
import { DefenceObjective } from './components/defence-objective.js'
import { GroundComp } from './components/ground-comp.js'
import { Hud } from './components/hud.js'
import { SkyBox } from './components/sky.js'
import { Entity, EntityManager } from './ecs'
import { Game, GameBody, PlayerFactory, postprocessing } from './game'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425

  const startApp = async () => {
    const game = new Game(settings)

    game.init()

    game.player = initPlayer(game.scene, game.world, game.settings)
    const manager = initEntitiesAndComponents(
      game.renderer,
      game.camera,
      game.scene,
      game.sceneHUD,
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
    sceneHUD,
    playerBody,
    world,
    enemies,
    settings
  ) {
    // Create entities and components
    const manager = new EntityManager()
    const player = new Entity()
    manager.add(player, 'player')
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
    movementController.registerHandlers()

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

    // environment
    const environment = new Entity()
    const buildingsComp = new BuildingsComp({
      world,
      scene,
      groundWidth: settings.groundWidth,
      groundDepth: settings.groundDepth,
    })
    environment.addComponent(buildingsComp)
    const sky = new SkyBox({ scene })
    environment.addComponent(sky)
    const hud = new Hud({ scene: sceneHUD })
    environment.addComponent(hud)
    const groundComp = new GroundComp({
      world,
      scene,
      groundWidth: settings.groundWidth,
      groundDepth: settings.groundDepth,
    })
    environment.addComponent(groundComp)
    const defenceObjective = new DefenceObjective({ world, scene })
    defenceObjective.init()
    environment.addComponent(defenceObjective)

    manager.add(environment)

    return manager
  }
  await initEngine()
  startApp()
}
