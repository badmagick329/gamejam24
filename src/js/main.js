import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { initEngine, useRenderer, useTick } from './render/init.js'

import {
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

    const playerBody = createPlayer(game.world)
    game.bodies.push(playerBody)
    game.scene.add(playerBody.mesh)

    createEnemies(game.scene, game.world, game.bodies)

    const renderer = useRenderer()
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const offset = 0.01
    const characterController = game.world.createCharacterController(offset)
    characterController.setApplyImpulsesToDynamicBodies(true)

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
      game.camera,
      game.scene
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
    const bulletSpawner = new BulletSpawner(
      playerBody.rigidBody,
      game.scene,
      game.world
    )
    player.addComponent(bulletSpawner)
    manager.add(player)

    postprocessing(game.width, game.height, MOTION_BLUR_AMOUNT)
    const animate = (timestamp, timeDiff) => {
      manager.update(timestamp, timeDiff)
      for (const body of game.bodies) {
        body.sync()
      }
    }

    useTick(({ timestamp, timeDiff }) => {
      game.world.step()
      animate(timestamp, timeDiff)
    })
  }

  /**
   * @param {RAPIER.World} world
   * @returns {GameBody}
   */
  function createPlayer(world) {
    const playerFactory = new PlayerFactory({ world })
    const playerGameBody = playerFactory.create()
    return playerGameBody
  }

  /**
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @param {GameBody[]} bodies
   * @returns {void}
   */
  function createEnemies(scene, world, bodies) {
    const enemyFactory = new EnemyFactory({ world })
    for (let i = 1; i < boxPositions.length; i++) {
      const enemy = enemyFactory
        .setPosition(boxPositions[i].x, boxPositions[i].y, boxPositions[i].z)
        .setBaseEnemy()
        .create()
      bodies.push(enemy)
      scene.add(enemy.mesh)
    }
  }

  await initEngine()
  startApp()
}

const boxPositions = [
  {
    x: 0,
    y: 20,
    z: 0,
  },
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
