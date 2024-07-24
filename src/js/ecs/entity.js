import { Component } from './component'
import { EntityManager } from './entity-manager'

export class Entity {
  constructor() {
    // NOTE: _name will be treated as a unique identifier. Make sure this is not duplicated
    /**
     * @type {string}
     */
    this._name = null
    /**
     * @type {Object.<string, Component>}
     */
    this._components = {}

    /**
     * @type {(EntityManager|null)}
     */
    this._parent = null
  }

  /**
   * @param {EntityManager} p
   * @returns {void}
   */
  setParent(p) {
    if (!(p instanceof EntityManager)) {
      throw new Error('Parent must be an instance of EntityManager')
    }
    this._parent = p
  }

  /**
   * @param {string} n
   * @returns {void}
   */
  setName(n) {
    this._name = n
  }

  /**
   * @returns {string}
   */
  get name() {
    return this._name
  }

  /**
   * @param {Component} c
   * @returns {void}
   */
  addComponent(c) {
    c.setParent(this)
    // NOTE: Entities cannot have multiple components of the same type
    this._components[c.constructor.name] = c
    c.initComponent()
  }

  /**
   * @param {string} n
   * @returns {(Component|undefined)}
   */
  getComponent(n) {
    return this._components[n]
  }

  /**
   * @param {string} n
   * @returns {(Entity|undefined)}
   */
  findEntity(n) {
    return this._parent.get(n)
  }

  /**
   * @param {Entity} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Entity)) {
      return false
    }
    return this.name === other.name
  }

  /**
   * Responsible for calling updates on all components
   * @param {number} timeElapsed
   * @param {number} timeDiff
   * @returns {void}
   */
  update(timeElapsed, timeDiff) {
    for (const k in this._components) {
      this._components[k].update(timeElapsed, timeDiff)
    }
  }

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
