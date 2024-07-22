import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { initEngine, useTick } from './render/init.js'

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

    initPlayer(game.scene, game.world, game.bodies)
    initEnemies(game.scene, game.world, game.bodies)
    initEntitiesAndComponents(
      game.renderer,
      game.camera,
      game.scene,
      game.playerBody,
      game.characterController,
      game.world
    )

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
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @param {GameBody[]} bodies
   * @returns {void}
   */
  function initPlayer(scene, world, bodies) {
    const playerFactory = new PlayerFactory({ world })
    const playerGameBody = playerFactory.create()
    bodies.push(playerGameBody)
    scene.add(playerBody.mesh)
  }

  /**
   * @param {THREE.Scene} scene
   * @param {RAPIER.World} world
   * @param {GameBody[]} bodies
   * @returns {void}
   */
  function initEnemies(scene, world, bodies) {
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

  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Scene} scene
   * @param {GameBody} playerBody
   * @param {RAPIER.KinematicCharacterController} characterController
   * @param {RAPIER.World} world
   * @returns {void}
   */
  function initEntitiesAndComponents(
    renderer,
    camera,
    scene,
    playerBody,
    characterController,
    world
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
    manager.add(player)
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
