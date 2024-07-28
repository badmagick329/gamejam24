import * as THREE from 'three'
import { Component } from '../ecs'

export class Hud extends Component {
  constructor(config) {
    super()
    if (config?.scene === undefined) {
      throw new Error('Hud requires a scene instance')
    }
    this.scene = config.scene
    this.init()
  }

  init() {
    // const sky = new Sky()
    this.scene.hudBitmap.clearRect(
      0,
      0,
      this.scene.renderWidth,
      this.scene.renderHeight
    )
    this.scene.hudBitmap.fillText(
      'hello',
      this.scene.renderWidth / 2,
      this.scene.renderHeight / 2
    )
    this.scene.hudTexture.needsUpdate = true
    // this.scene.add(sky)
  }

  _renderHUD() {} // dunno if I need this?!

  update(time) {
    this._updateHUD(time)
  }

  _updateHUD(time) {
    this._renderHUD()
  }
}

/**
 * @typedef {Object} HudConfig
 * @property {THREE.Scene} scene
 */
