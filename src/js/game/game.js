import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import * as THREE from 'three'
import {
  useCamera,
  useControls,
  useGui,
  useRenderer,
  useRenderSize,
  useScene,
} from '../render/init.js'
import {
  ENEMY_GROUP,
  GROUND_GROUP,
  PLAYER_GROUP,
  WALL_GROUP,
} from './consts.js'

const GROUND_WIDTH = 100.0
const GROUND_DEPTH = 60.0
const WALL_THICKNESS = 5.0

export class Game {
  /**
   * A lightweight container for game config and objects with some logic
   * for setting up config
   */
  constructor() {
    /**
     * @type {(THREE.Scene|null)}
     */
    this.scene = null
    /**
     * @type {(THREE.PerspectiveCamera|null)}
     */
    this.camera = null
    /**
     * @type {(THREE.WebGLRenderer|null)}
     */
    this.renderer = null
    /**
     * @type {(GUI|null)}
     */
    this.gui = null
    /**
     * @type {(number|null)}
     */
    this.width = null
    /**
     * @type {(number|null)}
     */
    this.height = null
    /**
     * @type {(CANNON.World|null)}
     */
    this.world = null
    /**
     * @type {(THREE.Mesh|null)}
     */
    this.ground = null
    /**
     * @type {(any|null)}
     */
    this.cannonDebugger = null
    /**
     * @type {(GameBody|null)}
     */
    this.player = null
    /**
     * @type {GameBody[]}
     */
    this.enemies = []

    this._groundWidth = GROUND_WIDTH
    this._groundDepth = GROUND_DEPTH
    this._wallThickness = WALL_THICKNESS
  }

  init() {
    this._setupScene()
    this._setupControls()
    this._setupCamera()
    this._setupRenderer()
    this._setupLight()
    this._setupPhysicsWithGround()
    this._buildThatWall()
    this._setupGroundMesh()
    this._setupDebug()
  }

  _setupScene() {
    this.scene = useScene()
    // Experimenting with fog. Feel free to change
    const color = 0x0e0e0e
    const near = 10
    const far = 180
    this.scene.fog = new THREE.Fog(color, near, far)
  }

  _setupControls() {
    // NOTE: tick-manager is responsible for updating controls. No need to store this here atm
    const controls = useControls()
    // NOTE: Allow rotate during dev
    controls.enableRotate = true
  }

  _setupCamera() {
    this.camera = useCamera()
    this.camera.position.set(0, 50, 50)
  }

  _setupRenderer() {
    const { width: w, height: h } = useRenderSize()
    this.width = w
    this.height = h

    this.renderer = useRenderer()
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  _setupLight() {
    const dirLight = new THREE.DirectionalLight('#ffffff', 1)
    const ambientLight = new THREE.AmbientLight('#ffffff', 5)
    dirLight.position.y = 5
    dirLight.position.z = 5
    dirLight.position.x = 5

    dirLight.castShadow = true

    dirLight.shadow.camera.near = -38
    dirLight.shadow.camera.far = 55
    dirLight.shadow.camera.top = 35
    dirLight.shadow.camera.right = 55
    dirLight.shadow.camera.bottom = -35
    dirLight.shadow.camera.left = -55

    this.scene.add(dirLight, ambientLight)
    // const directionalLightCameraHelper = new THREE.CameraHelper(
    //   dirLight.shadow.camera
    // )
    // this.scene.add(directionalLightCameraHelper)
  }

  _setupPhysicsWithGround() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
    })
    const groundCannonBody = new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(this._groundWidth / 2.0, this._groundDepth / 2.0, 0.1)
      ),
      type: CANNON.Body.STATIC,
      material: new CANNON.Material(),
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })
    groundCannonBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(groundCannonBody)

    this.cannonDebugger = new CannonDebugger(this.scene, this.world, {
      scale: 1.02,
    })
    // const cannonDebugger = new CannonDebugger(this.scene, this.world, {
    //   scale: 1.02,
    // })
  }

  _buildThatWall() {
    const wallConfig = [
      {
        sX: 1,
        sY: 5,
        sZ: this._groundDepth / 2,
        pX: -this._groundWidth / 2,
        pY: 5,
        pZ: 0,
      },
      {
        sX: 1,
        sY: 5,
        sZ: this._groundDepth / 2,
        pX: this._groundWidth / 2,
        pY: 5,
        pZ: 0,
      },
      {
        sX: this._groundWidth / 2,
        sY: 5,
        sZ: 1,
        pX: 0,
        pY: 5,
        pZ: -this._groundDepth / 2,
      },
      {
        sX: this._groundWidth / 2,
        sY: 5,
        sZ: 1,
        pX: 0,
        pY: 5,
        pZ: this._groundDepth / 2,
      },
    ]

    wallConfig.forEach((wc) => {
      const wallCannonBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(wc.sX, wc.sY, wc.sZ)),
        material: new CANNON.Material(),
        collisionFilterGroup: WALL_GROUP,
        collisionFilterMask: PLAYER_GROUP,
      })
      wallCannonBody.position.set(wc.pX, wc.pY, wc.pZ)
      this.world.addBody(wallCannonBody)
    })
  }

  _setupGroundMesh() {
    let geo, mat
    geo = new THREE.BoxGeometry(this._groundWidth, 0.01, this._groundDepth)
    mat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
    })
    mat.flatShading = true
    this.ground = new THREE.Mesh(geo, mat)
    this.ground.position.y = 0.1
    this.scene.add(this.ground)

    this.ground.receiveShadow = true
  }

  _setupDebug() {
    this.gui = useGui()
    const debugObject = {}
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
