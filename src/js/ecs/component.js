import { Entity } from './entity'

export class Component {
  constructor() {
    /**
     * @type {(Entity|null)}
     */
    this._parent = null
  }

  /**
   * @param {Entity} p
   * @returns {void}
   */
  setParent(p) {
    if (!(p instanceof Entity)) {
      throw new Error('Parent must be an instance of Entity')
    }
    this._parent = p
  }

  initComponent() {}

  /**
   * @param {string} n
   * @returns {(Component|undefined)}
   */
  getComponent(n) {
    return this._parent.getComponent(n)
  }

  /**
   * @param {string} n
   * @returns {(Entity|undefined)}
   */
  findEntity(n) {
    return this._parent.findEntity(n)
  }

  /**
   * This method is called every frame. Override it to add custom logic
   * @param {number} timeElapsed
   * @param {number} timeDiff
   * @returns {void}
   */
  update(timeElapsed, timeDiff) {}

  /**
   * @param {string} n
   * @param {Function} h
   * @returns {void}
   */
  registerHandler(n, h) {
    this._parent.registerHandler(n, h)
  }

  /**
   * @param {import('../types').Message} m
   * @returns {void}
   */
  broadcast(m) {
    this._parent.broadcast(m)
  }
}
