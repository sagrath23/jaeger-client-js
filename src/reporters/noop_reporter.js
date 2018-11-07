import Span from '../span.js'

export default class NoopReporter {
  name() {
    return 'NoopReporter'
  }

  report(span) {}

  close(callback = () => {}) {
    if (callback) {
      callback()
    }
  }

  setProcess(serviceName, tags) {}
}