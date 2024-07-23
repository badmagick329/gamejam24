import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import {
  useCamera,
  useControls,
  useGui,
  useRenderer,
  useRenderSize,
  useScene,
} from '../render/init.js'

/**
 * @class
 * @implements {GameClassAttributes}
 */
export class Game {
  /**
   * A lightweight container for game config and objects with some logic
   * for setting up config
   */
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.gui = null
    this.width = null
    this.height = null
    this.world = null
    this.characterController = null
    this.ground = null
    this.player = null
    this.enemies = []
  }

  async init() {
    this._setupScene()
    await this._initPhysicsWithGround()
    this._createGroundMeshAndDebugStuffRefactorThisLater()

    const offset = 0.01
    this.characterController = this.world.createCharacterController(offset)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
  }

  _setupScene() {
    this.scene = useScene()
    // Experimenting with fog. Feel free to change
    const color = 0x0e0e0e
    const near = 10
    const far = 180
    this.scene.fog = new THREE.Fog(color, near, far)

    const controls = useControls()
    controls.enableRotate = false
    this.camera = useCamera()
    this.camera.position.set(0, 50, -50)

    this.gui = useGui()
    const { width: w, height: h } = useRenderSize()
    this.width = w
    this.height = h

    const dirLight = new THREE.DirectionalLight('#ffffff', 1)
    const ambientLight = new THREE.AmbientLight('#ffffff', 5)
    ambientLight.position.x = 5
    ambientLight.position.y = 5
    ambientLight.position.z = 5

    this.renderer = useRenderer()
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene.add(dirLight, ambientLight)
  }

  async _initPhysicsWithGround() {
    await RAPIER.init()
    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new RAPIER.World(gravity)

    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0)
    this.world.createCollider(groundColliderDesc)
  }

  // TODO: Refactor
  _createGroundMeshAndDebugStuffRefactorThisLater() {
    // debug Object for debug menu
    const debugObject = {}
    debugObject.groundColor = 0x555555
    debugObject.playerColor = 0x55aa55
    debugObject.enemyColor = 0xa0b04a

    let geo, mat
    geo = new THREE.BoxGeometry(100, 0.01, 100)
    mat = new THREE.MeshStandardMaterial({ color: debugObject.groundColor })
    // mat = new THREE.MeshNormalMaterial()
    mat.flatShading = true
    this.ground = new THREE.Mesh(geo, mat)
    this.ground.position.y = 0.1
    this.scene.add(this.ground)

    debugObject.lightColour = () => {
      this.ground.material.color.set(0x999999)
      this.player.mesh.material.color.set(0x43aa8b)
      for (const enemy of this.enemies) {
        enemy.mesh.material.color.set(0xf9c74f)
      }
    }
    this.gui.add(debugObject, 'lightColour')

    debugObject.darkColour = () => {
      this.ground.material.color.set(0x555555)
      this.player.mesh.material.color.set(0x55aa55)
      for (const enemy of this.enemies) {
        enemy.mesh.material.color.set(0xa0b04a)
      }
    }
    this.gui.add(debugObject, 'darkColour')
  }
}
