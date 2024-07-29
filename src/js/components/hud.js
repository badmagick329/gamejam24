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
    // this.registerHandler('mouse.direction', (m) => {
    //   this._writeInUpperRightCorner(
    //     `mouse.direction: x: ${m.value.direction.x.toFixed(2)} y: ${m.value.direction.y.toFixed(2)} z: ${m.value.direction.z.toFixed(2)} ${getRandomEmoji()}`
    //   )
    // })
  }

  _writeInUpperRightCorner(text) {
    this._clear()
    this.scene.ctx.fillText(
      text,
      this.scene.canvas.width * 0.7,
      this.scene.canvas.height * 0.1
    )
    this.scene.hudTexture.needsUpdate = true
  }

  _writeInCenter(text) {
    this._clear()
    this.scene.ctx.fillText(
      text,
      this.scene.canvas.width * 0.5,
      this.scene.canvas.height * 0.5
    )
    this.scene.hudTexture.needsUpdate = true
  }

  // temporary info
  playerInfo = {
    healthFull: 100,
    healthHalf: 50,
    healthEmpty: 0,
    healthCurrent: 85,
    healthLow: 20,
    HealthThird: 33,
    HealthTwoThirds: 66,
    scoreHigh: 9876543,
    scoreMedium: 475486,
    scoreLow: 347,
    scoreZero: 0,
  }

  _ui() {
    const score = this.playerInfo.scoreHigh
    const health = this.playerInfo.healthLow
    this._clear()
    this._showScore(score)
    this._showHealth(health)
  }

  _showScore(score) {
    this.scene.ctx.font = 'Normal 40px Arial'
    this.scene.ctx.textAlign = 'left'
    this.scene.ctx.fillStyle = 'rgba(245,245,245,1)'
    this.scene.ctx.fillText(
      `${score}`,
      this.scene.canvas.width * 0.12,
      this.scene.canvas.height * 0.95
    )
    this.scene.ctx.font = 'Normal 20px Arial'
    this.scene.ctx.fillText(
      `score`,
      this.scene.canvas.width * 0.1,
      this.scene.canvas.height * 0.97
    )
    this.scene.hudTexture.needsUpdate = true
  }

  _showHealth(health) {
    this.scene.ctx.textAlign = 'right'
    this.scene.ctx.fillStyle = 'rgba(245,245,245,1)'
    this.scene.ctx.font = 'Normal 20px Arial'
    this.scene.ctx.fillText(
      `hp`,
      this.scene.canvas.width * 0.92,
      this.scene.canvas.height * 0.97
    )
    const percentageHealth = health / this.playerInfo.healthFull
    const barStartX = this.scene.canvas.width * 0.8
    const barStartY = this.scene.canvas.height * 0.93
    var barWidth = this.scene.canvas.width - this.scene.canvas.width * 0.9
    barWidth = barWidth * percentageHealth
    const red = Math.floor(Math.min(255, 255 * (1.2 - percentageHealth)))
    const green = Math.floor(255 * (percentageHealth / 1.5))
    const blue = Math.floor(255 * (percentageHealth / 3.5))
    this.scene.ctx.fillStyle = `rgba(${red},${green},${blue},1)`
    const barHeight = this.scene.canvas.height - this.scene.canvas.height * 0.98
    this.scene.ctx.fillRect(barStartX, barStartY, barWidth, barHeight)

    // this.scene.ctx.fillText(
    //   `[debug text] rgb: ${red}, ${green}, ${blue}`,
    //   this.scene.canvas.width * 0.92,
    //   this.scene.canvas.height * 0.86
    // )
    // this.scene.ctx.fillText(
    //   `[debug text] health: ${health}`,
    //   this.scene.canvas.width * 0.92,
    //   this.scene.canvas.height * 0.88
    // )
    // this.scene.ctx.fillText(
    //   `[debug text] barWidth: ${barWidth.toFixed(2)}`,
    //   this.scene.canvas.width * 0.92,
    //   this.scene.canvas.height * 0.9
    // )
    // this.scene.ctx.fillText(
    //   `[debug text] percentageHealth: ${percentageHealth.toFixed(2)}`,
    //   this.scene.canvas.width * 0.92,
    //   this.scene.canvas.height * 0.92
    // )

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

  _renderHUD(time, delta) {
    this._ui()
  }

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
