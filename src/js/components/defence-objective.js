import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP } from '../game/consts'

export class DefenceObjective extends Component {
  constructor(config) {
    super()
    if (config?.world === undefined) {
      throw new Error('GroundComp requires a world instance')
    }
    if (config?.scene === undefined) {
      throw new Error('GroundComp requires a scene instance')
    }
    this.world = config.world
    this.scene = config.scene

    /**
     * @type {(GameBody|null)}
     */
    this.defenceBody = null
  }

  _getTorusMesh(material, spawnAngle, spawnRadius) {
    const topGeometry = new THREE.TorusGeometry(0.05, 0.9, 11, 3)
    const topMesh = new THREE.Mesh(topGeometry, material)
    topMesh.position.y = 1.5 + 0.01
    topMesh.rotation.x = Math.PI * 0.5
    topMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    return topMesh
  }

  _getSphereMesh(material, spawnAngle, spawnRadius) {
    const defenceTopGeometry = new THREE.SphereGeometry(1, 3, 8)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    defenceTopMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceTopMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    return defenceTopMesh
  }

  init() {
    const spawnRadius = 2 + Math.random() * 2
    const spawnAngle = Math.random() * Math.PI * 2

    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
    })
    // const defenceGroup = new THREE.Group()
    const defenceBaseGeometry = new THREE.ConeGeometry(0.5, 0.5, 16, 1)
    const defenceBaseMesh = new THREE.Mesh(defenceBaseGeometry, material)
    const defenceTopMesh = this._getTorusMesh(material, spawnAngle, spawnRadius)

    // alternate shape
    // const defenceTopGeometry = new THREE.SphereGeometry(1, 3, 8)
    // const defenceTopGeometry = new THREE.TorusGeometry(0.05, 0.9, 11, 3)
    // const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)

    defenceBaseMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    // defenceTopMesh.position.x = Math.sin(spawnAngle) * spawnRadius

    defenceBaseMesh.position.y = 0.25 + 0.01
    // Sphere Geometry position
    // defenceTopMesh.position.y = 1.5 + 0.01

    // Torus Position
    // defenceTopMesh.position.y = 1.5 + 0.01

    // Torus Rotation
    // defenceTopMesh.rotation.x = Math.PI * 0.5

    defenceBaseMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    // defenceTopMesh.position.z = Math.cos(spawnAngle) * spawnRadius

    this.scene.add(defenceBaseMesh, defenceTopMesh)

    console.log('defencetopmesh', defenceTopMesh)
    this.defenceBody = this._createDefenceBody(
      defenceTopMesh.geometry,
      material,
      spawnRadius,
      spawnAngle
    )

    this.world.addBody(this.defenceBody.rigidBody)
  }

  _createDefenceBody(defenceTopGeometry, material, spawnRadius, spawnAngle) {
    const defenceCannonBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.8),
      mass: 0,
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
    return defenceBody
  }

  update(time) {
    this._rotateMesh(time)
  }

  _rotateMesh(time) {
    //TODO:
  }
}

/**
 * @typedef {Object} DefenceObjectiveConfig
 * @property {CANNON.World} world
 * @property {THREE.Scene} scene
 */
