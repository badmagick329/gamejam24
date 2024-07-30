import { Entity } from './entity'

export class EntityManager {
  constructor() {
    /**
     * @type {number}
     */
    this._ids = 0
    /**
     * @type {Object.<string, Entity>}
     */
    this._entitiesMap = {}
    /**
     * @type {Entity[]}
     */
    this._entities = []
    /**
     * @type {Object.<string, Function[]>}
     */
    this._handlers = {}
  }

  /**
   * @param {string} n
   * @returns {string}
   */
  _generateName() {
    this._ids += 1

    return '__name__' + this._ids
  }

  /**
   * @param {string} n
   * @returns {(Entity|undefined)}
   */
  get(n) {
    return this._entitiesMap[n]
  }

  /**
   * @param {Function} cb
   * @returns {Entity[]}
   */
  filter(cb) {
    return this._entities.filter(cb)
  }

  /**
   * @param {Entity} e
   * @param {string} n
   * @returns {void}
   */
  add(e, n) {
    if (!n) {
      n = this._generateName()
    }

    this._entitiesMap[n] = e
    this._entities.push(e)

    e.setParent(this)
    e.setName(n)
  }

  /**
   * @param {string} n
   */
  remove(n) {
    let e = this._entitiesMap[n]
    if (!e) {
      return
    }

    delete this._entitiesMap[n]
    const idx = this._entities.indexOf(e)
    if (idx !== -1) {
      this._entities.splice(idx, 1)
    }
    e = null
  }

  /**
   * Responsible for calling updates on all entities
   * @param {number} timeElapsed
   * @param {number} timeDiff
   * @returns {void}
   */
  update(timeElapsed, timeDiff) {
    for (const e of this._entities) {
      e.update(timeElapsed, timeDiff)
    }
  }

  /**
   * Register a handler for a given topic
   * @param {string} n
   * @param {Function} h
   * @returns {void}
   */
  registerHandler(n, h) {
    if (!(n in this._handlers)) {
      this._handlers[n] = []
    }
    this._handlers[n].push(h)
  }

  /**
   * Broadcast a message to all entities registered on a topic
   * @param {import('../types').Message} m
   * @returns {void}
   */
  broadcast(msg) {
    if (!(msg.topic in this._handlers)) {
      return
    }

    for (let curHandler of this._handlers[msg.topic]) {
      curHandler(msg)
    }
  }
}
