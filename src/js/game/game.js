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
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP } from './consts.js'
import { GameBody } from './game-body.js'

const GROUND_WIDTH = 20.0
const GROUND_DEPTH = 20.0
const WALL_THICKNESS = 5.0

export class Game {
  /**
   * A lightweight container for game config and objects with some logic
   * for setting up config
   */
  constructor(settings) {
    /**
     * @type {(THREE.Scene|null)}
     */
    this.scene = null
    /**
     * @type {(THREE.PerspectiveCamera|null)}
     */
    this.camera = null
    /**
     * @type {(THREE.OrbitControls|null)}
     */
    this.controls = null
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

    if (settings === undefined) {
      throw new Error('Error loading the settings file')
    }
    /**
     * @type {import('../types').GameSettings}
     */
    this.settings = settings

    this._groundWidth = this.settings.groundWidth || GROUND_WIDTH
    this._groundDepth = this.settings.groundDepth || GROUND_DEPTH
    this._wallThickness = WALL_THICKNESS
  }

  init() {
    this._setupScene()
    this._setupControls()
    this._setupCamera()
    this._setupRenderer()
    this._setupLight()
    this._setupPhysics()
    this._setupDefenceObjective()
    this._setupDebug()
  }

  _setupScene() {
    this.scene = useScene()
    // Experimenting with fog. Feel free to change
    const color = 0x0e0e0e
    const near = 10
    const far = 180
    // turned off fog
    // this.scene.fog = new THREE.Fog(color, near, far)
  }

  _setupControls() {
    this.controls = useControls()
    // NOTE: Allow rotate during dev
    this.controls.enableRotate = true
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
    const dirLight = new THREE.DirectionalLight('#555555', 0.2)
    const ambientLight = new THREE.AmbientLight('#555555', 0.2)
    const hemiLight = new THREE.HemisphereLight('#ff0000', '#0000ff', 2)
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

    const directionLight = new THREE.DirectionalLight()
    directionLight.position.set(1, 0.25, 0)
    directionLight.color = new THREE.Color(0x00fffc)
    directionLight.intensity = 0.3
    this.scene.add(directionLight)

    // old add lights to scene
    // this.scene.add(dirLight, ambientLight, hemiLight)
    this.scene.add(hemiLight)

    if (this.settings.lightCameraHelper) {
      const directionalLightCameraHelper = new THREE.CameraHelper(
        dirLight.shadow.camera
      )
      this.scene.add(directionalLightCameraHelper)
    }
  }

  _setupPhysics() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
    })
    this.cannonDebugger = new CannonDebugger(this.scene, this.world, {
      scale: 1.02,
    })
  }

  _setupDefenceObjective() {
    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
    })
    // const defenceGroup = new THREE.Group()
    const defenceBaseGeometry = new THREE.ConeGeometry(0.5, 0.5, 16, 1)
    const defenceBaseMesh = new THREE.Mesh(defenceBaseGeometry, material)

    // alternate shape
    // const defenceTopGeometry = new THREE.SphereGeometry(1, 3, 8)
    const defenceTopGeometry = new THREE.TorusGeometry(0.05, 0.9, 11, 3)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)

    const spawnRadius = 2 + Math.random() * 2
    const spawnAngle = Math.random() * Math.PI * 2

    defenceBaseMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceTopMesh.position.x = Math.sin(spawnAngle) * spawnRadius

    defenceBaseMesh.position.y = 0.25 + 0.01
    // Sphere Geometry position
    // defenceTopMesh.position.y = 1.5 + 0.01

    // Torus Position
    defenceTopMesh.position.y = 1.5 + 0.01

    // Torus Rotation
    defenceTopMesh.rotation.x = Math.PI * 0.5

    defenceBaseMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    defenceTopMesh.position.z = Math.cos(spawnAngle) * spawnRadius

    this.scene.add(defenceBaseMesh, defenceTopMesh)

    const defenceCannonBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.8),
      mass: 5,
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })

    const defenceBody = new GameBody(
      new THREE.Mesh(defenceTopGeometry, material),
      defenceCannonBody,
      'defenceObject',
      {
        ignoreGravity: true,
        spawnRadius,
        spawnAngle,
      }
    )

    defenceCannonBody.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceCannonBody.position.y = 1.5 + 0.01
    defenceCannonBody.position.z = Math.cos(spawnAngle) * spawnRadius

    this.world.addBody(defenceCannonBody)

    this.defenceObject = defenceBody

    // defenceGroup.add(defenceBaseMesh, defenceTopMesh)
  }

  _setupDebug() {
    this.gui = useGui()
    const debugObject = {}
    debugObject.lightColour = () => {
      this.ground.material.color.set(this.settings.lightGround)
      this.player.mesh.material.color.set(this.settings.lightPlayer)
      for (const enemy of this.enemies) {
        enemy.mesh.material.color.set(this.settings.lightEnemy)
      }
    }
    this.gui.add(debugObject, 'lightColour')

    debugObject.darkColour = () => {
      this.ground.material.color.set(this.settings.darkGround)
      this.player.mesh.material.color.set(this.settings.darkPlayer)
      for (const enemy of this.enemies) {
        enemy.mesh.material.color.set(this.settings.darkEnemy)
      }
    }
    this.gui.add(debugObject, 'darkColour')
  }
}
