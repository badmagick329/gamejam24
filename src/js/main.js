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
import MouseMovementController from './components/mouse-movement-controller.js'
import PlayerFSM from './components/player-fsm.js'
import EntityManager from './ecs/entity-manager.js'
import Entity from './ecs/entity.js'

export default async function run() {
  const MOTION_BLUR_AMOUNT = 0.425
  let scene, camera, gui, width, height, dirLight, ambientLight

  /**
   * @type {RAPIER.World}}
   */
  let world

  /**
   * @type {RAPIER.RigidBody[]}
   */
  let bodies = []
  /**
   * @type {THREE.Mesh[]}
   */
  let meshes = []

  /**
   * @type {THREE.Mesh}
   */
  let ground = null

  /**
   * @type {RAPIER.Collider}
   */
  let playerCollider

  const startApp = async () => {
    setupScene()
    createMeshes()
    world = await initPhysics()
    createBodies(world)
    const playerMesh = meshes[0]
    const playerBody = bodies[0]

    const renderer = useRenderer()
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const offset = 0.01
    const characterController = world.createCharacterController(offset)
    characterController.setApplyImpulsesToDynamicBodies(true)

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
    const movementController = new MouseMovementController(
      playerMesh,
      playerCollider,
      playerBody,
      characterController,
      ground
    )
    player.addComponent(movementController)

    // bullets
    const bulletSpawner = new BulletSpawner(playerBody, scene, world)
    player.addComponent(bulletSpawner)
    manager.add(player)

    // register handlers
    playerFsm.registerHandler('player.movement', (m) =>
      playerFsm.handleMovement(m)
    )

    postprocessing()
    const animate = (timestamp, timeDiff) => {
      manager.update(timestamp, timeDiff)

      for (let i = 0; i < bodies.length; i++) {
        let position = bodies[i].translation()
        meshes[i].position.set(position.x, position.y, position.z)

        let rotation = bodies[i].rotation()
        meshes[i].quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
      }

      let position = bodies[0].translation()
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
    ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
    scene.add(dirLight, ambientLight)
  }

  function createMeshes() {
    let geo, mat
    geo = new THREE.BoxGeometry(100, 0.01, 100)
    mat = new THREE.MeshStandardMaterial({ color: 0x7a5100 })
    ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI
    ground.position.y = 0.1
    scene.add(ground)

    const enemyColor = 0xf9c74f // yellowish
    const playerColor = 0x43aa8b // greenish
    for (let i = 0; i < boxPositions.length; i++) {
      geo = new THREE.BoxGeometry(1, 1, 1)
      mat = new THREE.MeshStandardMaterial({
        color: i === 0 ? playerColor : enemyColor,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(boxPositions[i].x, boxPositions[i].y, boxPositions[i].z)
      scene.add(mesh)
      meshes.push(mesh)
    }
  }

  async function initPhysics() {
    await RAPIER.init()
    let gravity = { x: 0.0, y: -9.81, z: 0.0 }
    let world = new RAPIER.World(gravity)

    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0)
    world.createCollider(groundColliderDesc)

    return world
  }

  function createBodies(world) {
    let rigidBodyDesc, rigidBody
    const PLAYER_Y = 0.6

    for (let i = 0; i < boxPositions.length; i++) {
      if (i === 0) {
        // create player
        rigidBodyDesc =
          RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            boxPositions[i].x,
            // boxPositions[i].y,
            PLAYER_Y,
            boxPositions[i].z
          )
      } else {
        // create enemies
        rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
          boxPositions[i].x,
          boxPositions[i].y,
          boxPositions[i].z
        )
      }
      rigidBody = world.createRigidBody(rigidBodyDesc)
      rigidBody.setLinearDamping(0.25)

      const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
      if (i === 0) {
        playerCollider = world.createCollider(colliderDesc, rigidBody)
      } else {
        let collider = world.createCollider(colliderDesc, rigidBody)
      }
      bodies.push(rigidBody)
    }
  }

  function postprocessing() {
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
