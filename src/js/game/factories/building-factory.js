import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import fragmentShader from '../../shaders/fragment.glsl'
import vertexShader from '../../shaders/vertex.glsl'
import { ENEMY_GROUP, GROUND_GROUP, PLAYER_GROUP } from '../consts'
import { GameBody } from '../game-body'

export class BuildingFactory {
  /**
   * @param {BuildingFactoryConfig} config
   */
  constructor(config) {
    if (config?.groundWidth === undefined) {
      throw new Error('BuildingFactory requires a groundWidth')
    }
    if (config?.groundDepth === undefined) {
      throw new Error('BuildingFactory requires a groundDepth')
    }
    this.groundWidth = config.groundWidth
    this.groundDepth = config.groundDepth
    this._id = 0
  }

  /**
   * @param {THREE.MeshStandardMaterial} standardMaterial
   * @param {THREE.ShaderMaterial} shaderMaterial
   * @param {THREE.MeshBasicMaterial} basicMaterial
   * @param {BuildingDimensions} [dims]
   */
  _createRandomBuilding(standardMaterial, shaderMaterial, basicMaterial, dims) {
    dims = dims ?? {
      minW: 1.5,
      maxW: 4,
      minH: 3,
      maxH: 10,
      minD: 2,
      maxD: 4,
    }
    const buildingWidth = this._ceilRandomWithMin(dims.maxW, dims.minW)
    const buildingHeight = this._ceilRandomWithMin(dims.maxH, dims.minH)
    const buildingDepth = this._ceilRandomWithMin(dims.maxD, dims.minD)

    const { buildingMesh, angle } = this._createMeshAndAngle(
      buildingWidth,
      buildingHeight,
      buildingDepth,
      shaderMaterial,
      standardMaterial,
      basicMaterial
    )

    const buildingCannonBody = this._createCannonBody(
      buildingWidth,
      buildingHeight,
      buildingDepth,
      angle
    )
    buildingCannonBody.position.set(
      buildingMesh.position.x,
      buildingMesh.position.y,
      buildingMesh.position.z
    )

    return new GameBody(buildingMesh, buildingCannonBody, {
      name: `Building-${this._id++}`,
    })
  }

  /**
   * @param {number} buildingWidth
   * @param {number} buildingHeight
   * @param {number} buildingDepth
   * @param {number} angle
   */
  _createCannonBody(buildingWidth, buildingHeight, buildingDepth, angle) {
    const buildingCannonBody = new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(
          buildingWidth * 0.5,
          buildingHeight * 0.5,
          buildingDepth * 0.5
        )
      ),
      type: CANNON.Body.STATIC,
      collisionFilterGroup: GROUND_GROUP,
      collisionFilterMask: PLAYER_GROUP | ENEMY_GROUP,
    })
    buildingCannonBody.quaternion.setFromEuler(0, angle, 0)
    return buildingCannonBody
  }

  /**
   * @param {number} buildingWidth
   * @param {number} buildingHeight
   * @param {number} buildingDepth
   * @param {THREE.ShaderMaterial} shaderMaterial
   * @param {THREE.MeshStandardMaterial} standardMaterial
   * @param {THREE.MeshBasicMaterial} basicMaterial
   * @returns {{ buildingMesh: THREE.Mesh, angle: number }}
   */
  _createMeshAndAngle(
    buildingWidth,
    buildingHeight,
    buildingDepth,
    shaderMaterial,
    standardMaterial,
    basicMaterial
  ) {
    const geometry = new THREE.BoxGeometry(
      buildingWidth,
      buildingHeight,
      buildingDepth
    )
    const materials = [
      shaderMaterial, // -X
      shaderMaterial, // X
      standardMaterial, // Y
      basicMaterial, // -Y
      shaderMaterial, // Z
      shaderMaterial, // -Z
    ]

    const buildingMesh = new THREE.Mesh(geometry, materials)
    buildingMesh.position.y = buildingHeight * 0.5 + 0.01

    const { x, z } = this._getRandomXAndZ(buildingWidth, buildingDepth)
    buildingMesh.position.x = x
    buildingMesh.position.z = z

    const angle = Math.random() * Math.PI * 0.5
    buildingMesh.rotation.y = angle
    return { buildingMesh, angle }
  }

  create() {
    this._id = 0
    const material = new THREE.MeshStandardMaterial()
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 0.5 },
      },
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader,
    })
    const buildings = []
    const numberOfBuildings = this._ceilRandom(4)

    for (let i = 0; i < numberOfBuildings; i++) {
      buildings.push(
        this._createRandomBuilding(
          material,
          shaderMaterial,
          new THREE.MeshBasicMaterial()
        )
      )
    }

    return buildings
  }

  _ceilRandom(n) {
    return Math.ceil(Math.random() * n)
  }

  _ceilRandomWithMin(n, min) {
    return Math.ceil(Math.random() * n + min)
  }

  _getRandomXAndZ(buildingWidth, buildingDepth) {
    let x, z
    do {
      x = (this.groundWidth - buildingWidth * 2) * (Math.random() - 0.5)
      z = (this.groundDepth - buildingDepth * 2) * (Math.random() - 0.5)
    } while (
      x < this.groundWidth / 2 - buildingWidth * 2 &&
      x > -(this.groundWidth / 2 - buildingWidth * 2) &&
      z < this.groundDepth / 2 - buildingDepth * 2 &&
      z > -(this.groundDepth / 2 - buildingDepth * 2)
    )
    return {
      x,
      z,
    }
  }
}

/**
 * @typedef {Object} BuildingFactoryConfig
 * @property {number} groundWidth
 * @property {number} groundDepth
 */

/**
 * @typedef {Object} BuildingDimensions
 * @property {number} minW
 * @property {number} maxW
 * @property {number} minH
 * @property {number} maxH
 * @property {number} minD
 * @property {number} maxD
 */
