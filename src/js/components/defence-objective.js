import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { ENEMY_GROUP, PLAYER_GROUP, STATIC_GROUP } from '../game/consts'

export class DefenceObjective extends Component {
  constructor(config) {
    super()
    if (config?.world === undefined) {
      throw new Error('DefenceObjective requires a world instance')
    }
    if (config?.scene === undefined) {
      throw new Error('DefenceObjective requires a scene instance')
    }
    this.world = config.world
    this.scene = config.scene

    /**
     * @type {(GameBody|null)}
     */
    this.defenceBody = null

    /**
     * @type {(boolean)}
     */
    this.usingTorus = false

    /**
     * @type {(THREE.Mesh)}
     */
    this.defenceTopMesh = null
  }

  _getTorusMesh(material, positionParameters) {
    const defenceTopGeometry = new THREE.TorusGeometry(0.3, 3, 11, 3)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // torus needs rotation
    const torusRotation = Math.PI * 0.5
    defenceTopMesh.position.x = positionParameters.positionX
    defenceTopMesh.position.y = 4 + 0.01
    defenceTopMesh.rotation.x = torusRotation
    defenceTopMesh.position.z = positionParameters.positionZ
    return defenceTopMesh
  }

  _getSphereMesh(material, positionParameters) {
    const defenceTopGeometry = new THREE.SphereGeometry(3, 3, 8)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // sphere does not need rotation (spoiler: it does not look like a sphere)
    defenceTopMesh.position.x = positionParameters.positionX
    defenceTopMesh.position.y = 4 + 0.01
    defenceTopMesh.position.z = positionParameters.positionZ
    return defenceTopMesh
  }

  _getBaseMesh(material, positionParameters) {
    const defenceBaseGeometry = new THREE.ConeGeometry(1, 1, 16, 1)
    const defenceBaseMesh = new THREE.Mesh(defenceBaseGeometry, material)
    defenceBaseMesh.position.x = positionParameters.positionX
    defenceBaseMesh.position.y = 0.5 + 0.01
    defenceBaseMesh.position.z = positionParameters.positionZ
    return defenceBaseMesh
  }

  init() {
    const spawnRadius = 2 + Math.random() * 5
    const spawnAngle = Math.random() * Math.PI * 5

    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
    })
    const positionX = Math.sin(spawnAngle) * spawnRadius
    const positionZ = Math.cos(spawnAngle) * spawnRadius

    const positionParameters = {
      positionX,
      positionZ,
    }

    if (this.usingTorus) {
      this.defenceTopMesh = this._getTorusMesh(material, positionParameters)
    } else {
      this.defenceTopMesh = this._getSphereMesh(material, positionParameters)
    }
    const defenceBaseMesh = this._getBaseMesh(material, positionParameters)

    this.scene.add(defenceBaseMesh, this.defenceTopMesh)

    this.defenceBody = this._createDefenceBody(
      this.defenceTopMesh,
      positionParameters
    )
    this.world.addBody(this.defenceBody.rigidBody)
  }

  _createDefenceBody(mesh, positionParameters) {
    const defenceCannonBody = new CANNON.Body({
      shape: new CANNON.Sphere(2.9),
      mass: 0,
      collisionFilterGroup: STATIC_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })

    const defenceBody = new GameBody(mesh, defenceCannonBody, {
      name: 'defenceObjective',
      ignoreGravity: true,
      syncMesh: false,
    })

    defenceCannonBody.position.x = positionParameters.positionX
    defenceCannonBody.position.y = 4 + 0.01
    defenceCannonBody.position.z = positionParameters.positionZ
    return defenceBody
  }

  update(time) {
    this._rotateMesh(time)
  }

  _rotateMesh(time) {
    if (this.usingTorus) {
      this.defenceBody.mesh.rotation.z = time / 1000
    } else {
      this.defenceBody.mesh.rotation.y = time / 1000
    }
  }
}

/**
 * @typedef {Object} DefenceObjectiveConfig
 * @property {CANNON.World} world
 * @property {THREE.Scene} scene
 */
