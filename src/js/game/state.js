export class State {
  constructor(name, transitions = {}) {
    /**
     * @type {string}
     */
    this.name = name
    /**
     * @type {Object.<string, State>}
     */
    this.transitions = transitions
    /**
     * @type {number}
     */
    this.timeSpent = 0
  }

  /**
   * @param {string} event
   * @param {State} state
   * @returns {void}
   */
  addTransition(event, state) {
    this.transitions[event] = state
  }
}
