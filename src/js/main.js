import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import {
  addPass,
  initEngine,
  useCamera,
  useControls,
  useGui,
  useRenderer,
  useRenderSize,
  useScene,
  useTick,
} from './render/init.js'

import BulletSpawner from './components/bullet-spawner.js'
import InputController from './components/input-controller.js'
import MouseInputController from './components/mouse-input-controller.js'
import MovementController from './components/movement-controller.js'
import PlayerFSM from './components/player-fsm.js'
import EntityManager from './ecs/entity-manager.js'
import Entity from './ecs/entity.js'
import EnemyFactory from './game/factories/enemy-factory.js'
import PlayerFactory from './game/factories/player-factory.js'
import GameBody from './game/game-body.js'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425
  let scene, camera, gui, width, height, dirLight, ambientLight

  /**
   * @type {RAPIER.World}}
   */
  let world

  /**
   * @type {GameBody[]}
   */
  let bodies = []

  /**
   * @type {THREE.Mesh}
   */
  let ground = null

  const startApp = async () => {
    setupScene()
    world = await initPhysicsWithGround()

    const playerBody = createPlayer()
    bodies.push(playerBody)
    scene.add(playerBody.mesh)

    createEnemies(world)
    createGroundMeshAndDebugStuffRefactorThisLater()

    const renderer = useRenderer()
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const offset = 0.01
    const characterController = world.createCharacterController(offset)
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

    postprocessing(width, height, MOTION_BLUR_AMOUNT)
    const animate = (timestamp, timeDiff) => {
      manager.update(timestamp, timeDiff)
      for (const body of bodies) {
        body.sync()
      }
    }

    useTick(({ timestamp, timeDiff }) => {
      world.step()
      animate(timestamp, timeDiff)
    })
  }

  function setupScene() {
    scene = useScene()
    const controls = useControls()
    controls.enableRotate = false
    camera = useCamera()
    camera.position.set(0, 30, -30)
    gui = useGui()
    const { width: w, height: h } = useRenderSize()
    width = w
    height = h

    dirLight = new THREE.DirectionalLight('#ffffff', 1)
    ambientLight = new THREE.AmbientLight('#ffffff', 5)
    ambientLight.position.x = 5
    ambientLight.position.y = 5
    ambientLight.position.z = 5

    scene.add(dirLight, ambientLight)
  }

  /**
   * @returns {GameBody}
   */
  function createPlayer() {
    const playerFactory = new PlayerFactory({ world })
    const playerGameBody = playerFactory.create()
    return playerGameBody
  }

  /**
   * @returns {void}
   */
  function createEnemies() {
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
  function createGroundMeshAndDebugStuffRefactorThisLater() {
    // debug Oject for debug menu
    const debugObject = {}
    debugObject.groundColor = 0x555555
    debugObject.playerColor = 0x55aa55
    debugObject.enemyColor = 0xa0b04a

    let geo, mat
    geo = new THREE.BoxGeometry(100, 0.01, 100)
    mat = new THREE.MeshStandardMaterial({ color: debugObject.groundColor })
    // mat = new THREE.MeshNormalMaterial()
    mat.flatShading = true
    ground = new THREE.Mesh(geo, mat)
    ground.position.y = 0.1
    scene.add(ground)

    debugObject.lightColour = () => {
      ground.material.color.set(0x999999)
      bodies[0].mesh.material.color.set(0x43aa8b)
      for (let i = 1; i < bodies.length; i++) {
        bodies[i].mesh.material.color.set(0xf9c74f)
      }
    }
    gui.add(debugObject, 'lightColour')

    debugObject.darkColour = () => {
      ground.material.color.set(0x555555)
      bodies[0].mesh.material.color.set(0x55aa55)
      for (let i = 1; i < bodies.length; i++) {
        bodies[i].mesh.material.color.set(0xa0b04a)
      }
    }
    gui.add(debugObject, 'darkColour')
  }

  async function initPhysicsWithGround() {
    await RAPIER.init()
    let gravity = { x: 0.0, y: -9.81, z: 0.0 }
    let world = new RAPIER.World(gravity)

    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0)
    world.createCollider(groundColliderDesc)

    return world
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

function postprocessing(width, height, MOTION_BLUR_AMOUNT) {
  // postprocessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
  }

  // save pass
  const savePass = new SavePass(
    new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
  )

  // blend pass
  const blendPass = new ShaderPass(BlendShader, 'tDiffuse1')
  blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture
  blendPass.uniforms['mixRatio'].value = MOTION_BLUR_AMOUNT

  // output pass
  const outputPass = new ShaderPass(CopyShader)
  outputPass.renderToScreen = true

  // adding passes to composer
  addPass(blendPass)
  addPass(savePass)
  addPass(outputPass)
}
