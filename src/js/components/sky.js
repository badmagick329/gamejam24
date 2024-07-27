import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { Component } from '../ecs'

export class SkyBox extends Component {
  constructor(config) {
    super()
    if (config?.scene === undefined) {
      throw new Error('Sky requires a scene instance')
    }
    this.scene = config.scene
    this.init()
  }

  init() {
    const sky = new Sky()
    sky.scale.setScalar(200)
    sky.material.uniforms['turbidity'].value = 10
    sky.material.uniforms['rayleigh'].value = 3
    sky.material.uniforms['mieCoefficient'].value = 0.1
    sky.material.uniforms['mieDirectionalG'].value = 0.95
    sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95)
    this.scene.add(sky)
  }
}

/**
 * @typedef {Object} SkyBoxConfig
 * @property {THREE.Scene} scene
 */
