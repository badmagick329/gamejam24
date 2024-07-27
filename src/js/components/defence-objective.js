import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Component } from '../ecs'
import { GameBody } from '../game'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP } from '../game/consts'
import { log } from 'three/examples/jsm/nodes/Nodes.js'

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

  _getTorusMesh(material, spawnAngle, spawnRadius) {
    const defenceTopGeometry = new THREE.TorusGeometry(0.05, 0.9, 11, 3)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // torus needs rotation
    const torusRotation = Math.PI * 0.5
    defenceTopMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceTopMesh.position.y = 1.5 + 0.01
    defenceTopMesh.rotation.x = torusRotation
    defenceTopMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    return defenceTopMesh
  }

  _getSphereMesh(material, spawnAngle, spawnRadius) {
    const defenceTopGeometry = new THREE.SphereGeometry(1, 3, 8)
    const defenceTopMesh = new THREE.Mesh(defenceTopGeometry, material)
    // sphere does not need rotation (spoiler: it does not look like a sphere)
    defenceTopMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceTopMesh.position.y = 1.5 + 0.01
    defenceTopMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    return defenceTopMesh
  }

  _getBaseMesh(material, spawnAngle, spawnRadius) {
    const defenceBaseGeometry = new THREE.ConeGeometry(0.5, 0.5, 16, 1)
    const defenceBaseMesh = new THREE.Mesh(defenceBaseGeometry, material)
    defenceBaseMesh.position.x = Math.sin(spawnAngle) * spawnRadius
    defenceBaseMesh.position.y = 0.25 + 0.01
    defenceBaseMesh.position.z = Math.cos(spawnAngle) * spawnRadius
    return defenceBaseMesh
  }

  init() {
    const spawnRadius = 2 + Math.random() * 2
    const spawnAngle = Math.random() * Math.PI * 2

    const positionX = Math.sin(spawnAngle) * spawnRadius
    const positionY = 0
    const positionZ = Math.cos(spawnAngle) * spawnRadius

    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
    })

    const positionParameters = {}

    // Use _getSphereMesh for an alternative defence object
    const defenceTopMesh = this._getSphereMesh(
      material,
      spawnAngle,
      spawnRadius
    )

    // const defenceTopMesh = this._getTorusMesh(material, spawnAngle, spawnRadius)
    const defenceBaseMesh = this._getBaseMesh(material, spawnAngle, spawnRadius)

    this.scene.add(defenceBaseMesh, defenceTopMesh)

    this.defenceBody = this._createDefenceBody(
      defenceTopMesh.geometry,
      material,
      spawnRadius,
      spawnAngle
    )
    // console.log(this.defenceBody)
    this.world.addBody(this.defenceBody.rigidBody)
  }

  _createDefenceBody(defenceTopGeometry, material, spawnRadius, spawnAngle) {
    const defenceCannonBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.9),
      mass: 0,
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })

    const defenceBody = new GameBody(
      new THREE.Mesh(defenceTopGeometry, material),
      defenceCannonBody,
      {
        name: 'defenceObject',
        ignoreGravity: true,
        syncMesh: false,
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

  _rotateMesh(time) {}
}

/**
 * @typedef {Object} DefenceObjectiveConfig
 * @property {CANNON.World} world
 * @property {THREE.Scene} scene
 */
