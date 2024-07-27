import { Component } from '../ecs'
import { GameBody } from '../game'
import { BuildingFactory } from '../game/factories/building-factory'

export class BuildingsComp extends Component {
  /**
   * @param {BuildingsCompConfig} config
   */
  constructor(config) {
    super()
    if (config?.world === undefined) {
      throw new Error('BuildingsComp requires a world instance')
    }
    if (config?.scene === undefined) {
      throw new Error('BuildingsComp requires a scene instance')
    }
    if (config?.groundWidth === undefined) {
      throw new Error('BuildingComp requires a groundWidth')
    }
    if (config?.groundDepth === undefined) {
      throw new Error('BuildingComp requires a groundDepth')
    }
    /**
     * @type {BuildingsCompConfig}
     */
    this.config = config

    /**
     * @type {GameBody[]}
     */
    this.buildings = []
    const buildingFactory = new BuildingFactory({
      world: config.world,
      groundWidth: config.groundWidth,
      groundDepth: config.groundDepth,
    })

    this.buildings = buildingFactory.create()
    this.buildings.forEach((b) => {
      this.config.scene.add(b.mesh)
      this.config.world.addBody(b.rigidBody)
    })
  }

  update(time) {
    this.buildings.forEach((b) => b.sync(time))
  }
}

/**
 * @typedef {Object} BuildingsCompConfig
 * @property {CANNON.World} world
 * @property {THREE.Scene} scene
 * @property {number} groundWidth
 * @property {number} groundDepth
 */
