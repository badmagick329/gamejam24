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
