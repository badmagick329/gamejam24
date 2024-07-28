import * as THREE from 'three'
import { Component } from '../ecs'

export class Hud extends Component {
  constructor(config) {
    super()
    if (config?.scene === undefined) {
      throw new Error('Hud requires a scene instance')
    }
    this.scene = config.scene
  }

  _renderHUD(time, delta) {
    this.scene.ctx.fillStyle = 'rgba(0,0,0,0)'
    this.scene.ctx.clearRect(
      0,
      0,
      this.scene.canvas.width,
      this.scene.canvas.height
    )
    this.scene.ctx.font = 'Normal 40px Arial'
    this.scene.ctx.textAlign = 'center'
    this.scene.ctx.fillStyle = 'rgba(245,245,245,1)'
    this.scene.ctx.fillText(
      `${time.toFixed(2)}     ${delta.toFixed(2)}`,
      this.scene.renderWidth / 2,
      this.scene.renderHeight / 2
    )
    this.scene.hudTexture.needsUpdate = true
  }

  update(time, delta) {
    this._renderHUD(time, delta)
  }
}

/**
 * @typedef {Object} HudConfig
 * @property {THREE.Scene} scene
 */
