import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP } from '../game/consts'

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
  }

  _getTorusMesh(material, positionParameters) {
    const defenceTopGeometry = new THREE.TorusGeometry(0.05, 0.9, 11, 3)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // torus needs rotation
    const torusRotation = Math.PI * 0.5
    defenceTopMesh.position.x = positionParameters.positionX
    defenceTopMesh.position.y = 1.5 + 0.01
    defenceTopMesh.rotation.x = torusRotation
    defenceTopMesh.position.z = positionParameters.positionZ
    return defenceTopMesh
  }

  _getSphereMesh(material, positionParameters) {
    const defenceTopGeometry = new THREE.SphereGeometry(1, 3, 8)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // sphere does not need rotation (spoiler: it does not look like a sphere)
    defenceTopMesh.position.x = positionParameters.positionX
    defenceTopMesh.position.y = 1.5 + 0.01
    defenceTopMesh.position.z = positionParameters.positionZ
    this.torus = false
    return defenceTopMesh
  }

  _getBaseMesh(material, positionParameters) {
    const defenceBaseGeometry = new THREE.ConeGeometry(0.5, 0.5, 16, 1)
    const defenceBaseMesh = new THREE.Mesh(defenceBaseGeometry, material)
    defenceBaseMesh.position.x = positionParameters.positionX
    defenceBaseMesh.position.y = 0.25 + 0.01
    defenceBaseMesh.position.z = positionParameters.positionZ
    return defenceBaseMesh
  }

  init() {
    const spawnRadius = 2 + Math.random() * 2
    const spawnAngle = Math.random() * Math.PI * 2

    // torus is default defence object
    this.torus = true

    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
    })

    const positionParameters = {
      positionX: Math.sin(spawnAngle) * spawnRadius,
      positionZ: Math.cos(spawnAngle) * spawnRadius,
    }

    // Use _getSphereMesh for an alternative defence object
    // if using sphereMesh, set this.defenceBody.mesh.rotation.z = time / 1000
    // instead to this.defenceBody.mesh.rotation.y = time / 1000

    const defenceTopMesh = this._getSphereMesh(material, positionParameters)

    // const defenceTopMesh = this._getTorusMesh(material, positionParameters)
    const defenceBaseMesh = this._getBaseMesh(material, positionParameters)

    this.scene.add(defenceBaseMesh, defenceTopMesh)

    this.defenceBody = this._createDefenceBody(
      defenceTopMesh,
      positionParameters
    )
    this.world.addBody(this.defenceBody.rigidBody)
  }

  _createDefenceBody(mesh, positionParameters) {
    const defenceCannonBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.9),
      mass: 0,
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })

    const defenceBody = new GameBody(mesh, defenceCannonBody, {
      name: 'defenceObject',
      ignoreGravity: true,
      syncMesh: false,
    })

    defenceCannonBody.position.x = positionParameters.positionX
    defenceCannonBody.position.y = 1.5 + 0.01
    defenceCannonBody.position.z = positionParameters.positionX
    return defenceBody
  }

  update(time) {
    this._rotateMesh(time)
  }

  _rotateMesh(time) {
    if (this.torus) {
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
