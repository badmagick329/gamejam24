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
import fragmentShader from '../shaders/fragment.glsl'
import vertexShader from '../shaders/vertex.glsl'
import {
  ENEMY_GROUP,
  GROUND_GROUP,
  PLAYER_GROUP,
  WALL_GROUP,
} from './consts.js'
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

    /**
     * @type {THREE.Mesh}
     */
    this.groundSideMesh = null

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
    this._setupPhysicsWithGround()
    this._buildThatWall()
    this.groundSideMesh = this._setupGroundMesh()
    this._setupBuildings()
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

    // old add lights to scene
    this.scene.add(dirLight, ambientLight, hemiLight)
    if (this.settings.lightCameraHelper) {
      const directionalLightCameraHelper = new THREE.CameraHelper(
        dirLight.shadow.camera
      )
      this.scene.add(directionalLightCameraHelper)
    }
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
      material: new CANNON.Material({
        friction: 0.1,
        restitution: 0,
      }),
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })
    groundCannonBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(groundCannonBody)

    this.cannonDebugger = new CannonDebugger(this.scene, this.world, {
      scale: 1.02,
    })
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

  /**
   * Returns one of the sides mesh so the material can be accessed for the shader
   * in the update tick
   * @returns {THREE.Mesh}
   */
  _setupGroundMesh() {
    let geo, mat, mesh
    geo = new THREE.PlaneGeometry(this._groundWidth, this._groundDepth)
    mat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      side: THREE.DoubleSide,
      flatShading: false,
    })
    this.ground = new THREE.Mesh(geo, mat)
    // this.ground.position.y = 0.1
    this.ground.rotation.x = Math.PI * 0.5
    this.scene.add(this.ground)

    // ground sides
    geo = new THREE.PlaneGeometry(this._groundWidth, 2)
    mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 0.5 },
      },
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader,
    })
    // towards camera +z
    mesh = new THREE.Mesh(geo, mat)
    mesh.position.x = 0
    mesh.position.y = -1
    mesh.position.z = this._groundDepth / 2
    this.scene.add(mesh)

    // away from camera -z
    mesh = new THREE.Mesh(geo, mat)
    mesh.position.x = 0
    mesh.position.y = -1
    mesh.position.z = -this._groundDepth / 2
    this.scene.add(mesh)

    geo = new THREE.PlaneGeometry(this._groundDepth, 2)
    // on the right +x
    mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.y = Math.PI * 0.5
    mesh.position.x = this._groundWidth / 2
    mesh.position.y = -1
    mesh.position.z = 0
    this.scene.add(mesh)

    // on the left -x
    mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.y = Math.PI * 0.5
    mesh.position.x = -this._groundWidth / 2
    mesh.position.y = -1
    mesh.position.z = 0
    this.scene.add(mesh)

    this.ground.receiveShadow = true

    return mesh
  }

  _setupBuildings() {
    const material = new THREE.MeshStandardMaterial()
    const numberOfBuildings = Math.ceil(Math.random() * 4)
    for (let i = 0; i < numberOfBuildings; i++) {
      const buildingwidth = 1 + Math.random() * 2
      const buildingHeight = 1 + Math.random() * 2
      const buildingDepth = 1 + Math.random() * 2
      const geometry = new THREE.BoxGeometry(
        buildingwidth,
        buildingHeight,
        buildingDepth
      )
      const building = new THREE.Mesh(geometry, material)
      building.position.y = buildingHeight * 0.5 + 0.01
      do {
        building.position.x = (this._groundWidth - 4) * (Math.random() - 0.5)
        building.position.z = (this._groundDepth - 4) * (Math.random() - 0.5)
      } while (
        building.position.x < this._groundWidth / 2 - 4 &&
        building.position.x > -(this._groundWidth / 2 - 4) &&
        building.position.z < this._groundDepth / 2 - 4 &&
        building.position.z > -(this._groundDepth / 2 - 4)
      )
      const angle = Math.random() * Math.PI * 0.5
      building.rotation.y = angle
      this.scene.add(building)

      const buildingCannonBody = new CANNON.Body({
        shape: new CANNON.Box(
          new CANNON.Vec3(
            buildingwidth * 0.5,
            buildingHeight * 0.5,
            buildingDepth * 0.5
          )
        ),
        type: CANNON.Body.STATIC,
        collisionFilterGroup: GROUND_GROUP,
        collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
      })
      buildingCannonBody.position.x = building.position.x
      buildingCannonBody.position.y = building.position.y
      buildingCannonBody.position.z = building.position.z
      buildingCannonBody.quaternion.setFromEuler(0, angle, 0)

      this.world.addBody(buildingCannonBody)
    }
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
