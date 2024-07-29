import * as THREE from 'three'
import { Component } from '../ecs'

export class Hud extends Component {
  constructor(config) {
    super()
    if (config?.scene === undefined) {
      throw new Error('Hud requires a scene instance')
    }
    this.scene = config.scene
    this._setDefaultFont()
  }

  init() {
    // this._writeInCenter('hi 😐')
  }

  registerHandlers() {
    this.registerHandler('mouse.direction', (m) => {
      this._writeInUpperRightCorner(
        `mouse.direction: ${m.value.direction.x.toFixed(2)}, ${m.value.direction.y.toFixed(2)} ${m.value.direction.z.toFixed(2)} ${getRandomEmoji()}`
      )
    })
  }

  _writeInUpperRightCorner(text) {
    this._clear()
    this.scene.ctx.fillText(
      text,
      this.scene.canvas.width / 1.3,
      this.scene.canvas.height / 10
    )
    this.scene.hudTexture.needsUpdate = true
  }

  _writeInCenter(text) {
    this._clear()
    this.scene.ctx.fillText(
      text,
      this.scene.canvas.width / 2,
      this.scene.canvas.height / 2
    )
    this.scene.hudTexture.needsUpdate = true
  }

  _clear() {
    const oldFillStyle = this.scene.ctx.fillStyle
    this.scene.ctx.fillStyle = 'rgba(0,0,0,0)'
    this.scene.ctx.clearRect(
      0,
      0,
      this.scene.canvas.width,
      this.scene.canvas.height
    )
    this.scene.ctx.fillStyle = oldFillStyle
  }

  _setDefaultFont() {
    this.scene.ctx.font = 'Normal 40px Arial'
    this.scene.ctx.textAlign = 'center'
    this.scene.ctx.fillStyle = 'rgba(245,245,245,1)'
  }

  _renderHUD(time, delta) {}

  update(time, delta) {
    this._renderHUD(time, delta)
  }
}

const EMOJIS = [
  '😫',
  '😃',
  '😭',
  '🥰',
  '😍',
  '🤓',
  '🤯',
  '😯',
  '🫣',
  '😤',
  '😳',
  '😬',
  '🙄',
  '👀',
  '🔥',
  '🤪',
  '😑',
]
function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
}

/**
 * @typedef {Object} HudConfig
 * @property {THREE.Scene} scene
 */
