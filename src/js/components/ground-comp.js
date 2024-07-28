import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import {
  ENEMY_GROUP,
  PLAYER_GROUP,
  STATIC_GROUP,
  WALL_GROUP,
} from '../game/consts'
import fragmentShader from '../shaders/fragment.glsl'
import vertexShader from '../shaders/vertex.glsl'

const CONFIG = {
  groundColor: 0xaaaaaa,
  updateSpeedDivisor: 10000, // Higher number = slower updates on the time based shaders
}

export class GroundComp extends Component {
  /**
   * @param {GroundCompConfig} config
   */
  constructor(config) {
    super()
    if (config?.world === undefined) {
      throw new Error('GroundComp requires a world instance')
    }
    if (config?.scene === undefined) {
      throw new Error('GroundComp requires a scene instance')
    }
    if (config?.groundWidth === undefined) {
      throw new Error('GroundComp requires a groundWidth')
    }
    if (config?.groundDepth === undefined) {
      throw new Error('GroundComp requires a groundDepth')
    }
    /**
     * @type {GroundCompConfig}
     */
    this.config = { ...config, ...CONFIG }

    this.world = this.config.world
    this.scene = this.config.scene

    /**
     * @type {GameBody[]}
     */
    this.groundObjects = []

    /**
     * @type {(THREE.Mesh|null)}
     */
    this.groundMesh = null
    /**
     * @type {(THREE.Mesh|null)}
     */
    this.groundSideMesh = this._createGroundMesh()
    this._createGroundBody()
    this._buildThatWall()
  }

  /**
   * Returns one of the sides mesh so the material can be accessed for the shader
   * in the update tick
   * @returns {THREE.Mesh}
   */
  _createGroundMesh() {
    let geo, mat, mesh
    geo = new THREE.PlaneGeometry(
      this.config.groundWidth,
      this.config.groundDepth
    )
    mat = new THREE.MeshStandardMaterial({
      color: this.config.groundColor,
      side: THREE.DoubleSide,
      flatShading: false,
    })
    this.ground = new THREE.Mesh(geo, mat)
    this.ground.rotation.x = Math.PI * 0.5
    this.scene.add(this.ground)

    // ground sides
    geo = new THREE.PlaneGeometry(this.config.groundWidth, 2)
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
    mesh.position.z = this.config.groundDepth / 2
    this.scene.add(mesh)

    // away from camera -z
    mesh = new THREE.Mesh(geo, mat)
    mesh.position.x = 0
    mesh.position.y = -1
    mesh.position.z = -this.config.groundDepth / 2
    this.scene.add(mesh)

    geo = new THREE.PlaneGeometry(this.config.groundDepth, 2)
    // on the right +x
    mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.y = Math.PI * 0.5
    mesh.position.x = this.config.groundWidth / 2
    mesh.position.y = -1
    mesh.position.z = 0
    this.scene.add(mesh)

    // on the left -x
    mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.y = Math.PI * 0.5
    mesh.position.x = -this.config.groundWidth / 2
    mesh.position.y = -1
    mesh.position.z = 0
    this.scene.add(mesh)

    this.ground.receiveShadow = true

    return mesh
  }

  _createGroundBody() {
    const groundCannonBody = new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.config.groundWidth / 2.0,
          this.config.groundDepth / 2.0,
          0.1
        )
      ),
      type: CANNON.Body.STATIC,
      material: new CANNON.Material({
        friction: 0.5,
        restitution: 0.5,
      }),
      collisionFilterGroup: STATIC_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })
    groundCannonBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(groundCannonBody)
  }

  _buildThatWall() {
    const wallConfig = this._getWallConfig()

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

  _getWallConfig() {
    return [
      {
        sX: 1,
        sY: 5,
        sZ: this.config.groundDepth / 2,
        pX: -this.config.groundWidth / 2,
        pY: 5,
        pZ: 0,
      },
      {
        sX: 1,
        sY: 5,
        sZ: this.config.groundDepth / 2,
        pX: this.config.groundWidth / 2,
        pY: 5,
        pZ: 0,
      },
      {
        sX: this.config.groundWidth / 2,
        sY: 5,
        sZ: 1,
        pX: 0,
        pY: 5,
        pZ: -this.config.groundDepth / 2,
      },
      {
        sX: this.config.groundWidth / 2,
        sY: 5,
        sZ: 1,
        pX: 0,
        pY: 5,
        pZ: this.config.groundDepth / 2,
      },
    ]
  }

  update(time) {
    if (this.groundSideMesh) {
      this.groundSideMesh.material.uniforms.uTime.value =
        time / this.config.updateSpeedDivisor
    }
  }
}

/**
 * @typedef {Object} GroundCompConfig
 * @property {CANNON.World} world
 * @property {THREE.Scene} scene
 * @property {number} groundWidth
 * @property {number} groundDepth
 * @property {number} groundColor
 * @property {number} updateSpeedDivisor
 */
