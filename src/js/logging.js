const DEBUG = 4
const INFO = 3
const WARNING = 2
const ERROR = 1
const CRITICAL = 0

const logLevels = {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
  CRITICAL,
}

let logger = null

/**
 * @returns {Logger}
 */
const getLogger = () => {
  if (logger) {
    return logger
  }
  logger = new Logger()
  return logger
}

/**
 * By default log level is set to INFO. This means that INFO, WARNING, ERROR and CRITICAL messages will be shown
 * but DEBUG messages will not be shown. To change the log level, set the level property to one of the log levels
 * defined in the logLevels object.
 *
 * ### Examples
 *
 * ```js
 * const logger = getLogger()
 * logger.level = logLevels.DEBUG
 * logger.debug('This is a debug message') // This message would not be shown if level was left at the default INFO
 *
 * logger.level = logLevels.ERROR // Log only CRITICAL or ERROR messages
 * logger.info('This is an info message') // This message will not be shown
 * ```
 *
 * ### Throttled logger example
 *
 * ```js
 * const logger = getLogger()
 * const throttledLogger = logger.getThrottledLogger(1000, 'my object')
 *
 * throttledLogger.info(0, 'This message will be shown')
 * throttledLogger.info(500, 'This message will not be shown')
 * throttledLogger.info(1500, 'This message will be shown')
 * ```
 */
class Logger {
  constructor() {
    this._level = INFO
  }

  /**
   * @returns {number} - Log level
   * @default 3 INFO
   */
  get level() {
    return this._level
  }

  /**
   * @param {number} level - Log level
   */
  set level(level) {
    if (level < CRITICAL || level > DEBUG) {
      throw new Error('Invalid log level. Must be between 0 and 4')
    }
    this._level = level
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  debug(...args) {
    if (this._level <= DEBUG) {
      console.log(this._timestamp(), ...args)
    }
  }

  /**
   * @param {number} level - Log level
   */
  set level(level) {
    if (level < CRITICAL || level > DEBUG) {
      throw new Error('Invalid log level. Must be between 0 and 4')
    }
    this._level = level
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  debug(...args) {
    if (this._level >= DEBUG) {
      console.log(this._timestamp(), ...args)
    }
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  info(...args) {
    if (this._level >= INFO) {
      console.log(this._timestamp(), ...args)
    }
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  warning(...args) {
    if (this._level >= WARNING) {
      console.warn(this._timestamp(), ...args)
    }
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  error(...args) {
    if (this._level >= ERROR) {
      console.error(this._timestamp(), ...args)
    }
  }

  /**
   * @param  {...any} args - Arguments to pass onto console.log
   */
  critical(...args) {
    if (this._level >= CRITICAL) {
      console.error(this._timestamp(), ...args)
    }
  }

  /**
   * @param {number} ignoreTime
   * @param {string} source
   */
  getThrottledLogger(ignoreTime, source) {
    let lastLog = null
    source = source !== undefined ? `[${source.toUpperCase()}]` : '[N/A]'

    return {
      /**
       * @param {number} time - Time elapsed since start of program
       * @param  {...any} args - Arguments to pass onto console.log
       */
      debug: (time, ...args) => {
        if (!lastLog || time - lastLog > ignoreTime) {
          this.debug(source, ...args)
          lastLog = time
        }
      },
      /**
       * @param {number} time - Time elapsed since start of program
       * @param  {...any} args - Arguments to pass onto console.log
       */
      info: (time, ...args) => {
        if (!lastLog || time - lastLog > ignoreTime) {
          this.info(source, ...args)
          lastLog = time
        }
      },
      /**
       * @param {number} time - Time elapsed since start of program
       * @param  {...any} args - Arguments to pass onto console.log
       */
      warning: (time, ...args) => {
        if (!lastLog || time - lastLog > ignoreTime) {
          this.warning(source, ...args)
          lastLog = time
        }
      },
      /**
       * @param {number} time - Time elapsed since start of program
       * @param  {...any} args - Arguments to pass onto console.log
       */
      error: (time, ...args) => {
        if (!lastLog || time - lastLog > ignoreTime) {
          this.error(source, ...args)
          lastLog = time
        }
      },
      /**
       * @param {number} time - Time elapsed since start of program
       * @param  {...any} args - Arguments to pass onto console.log
       */
      critical: (time, ...args) => {
        if (!lastLog || time - lastLog > ignoreTime) {
          this.critical(source, ...args)
          lastLog = time
        }
      },
    }
  }

  _timestamp() {
    return new Date().toISOString().replace('T', ' [').replace('Z', ']')
  }
}

export { getLogger, logLevels }
