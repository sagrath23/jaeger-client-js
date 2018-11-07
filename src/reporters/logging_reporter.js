import Span from '../span.js'
import NullLogger from '../logger.js'

export default class LoggingReporter {
  _logger

  constructor(logger) {
    this._logger = logger || new NullLogger()
  }

  report(span) {
    this._logger.info(`Reporting span ${span.context().toString()}`)
  }

  name(){
    return 'LoggingReporter'
  }

  close(callback = () => {}) {
    if (callback) {
      callback()
    }
  }

  setProcess(serviceName, tags) {}
}