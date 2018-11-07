import Span from '../span.js'

export default class CompositeReporter {
  _reporters

  constructor(reporters) {
    this._reporters = reporters
  }

  name() {
    return 'CompositeReporter'
  }

  report(span) {
    this._reporters.forEach(r => {
      r.report(span)
    })
  }

  _compositeCallback(limit, callback) {
    let count = 0
    return () => {
      count++
      if (count >= limit) {
        callback()
      }
    }
  }

  close(callback) {
    const modifiedCallback = callback
      ? this._compositeCallback(this._reporters.length, callback)
      : function() {}
    this._reporters.forEach(r => {
      r.close(modifiedCallback)
    })
  }

  setProcess(serviceName, tags) {
    this._reporters.forEach(r => {
      if (r.setProcess) {
        r.setProcess(serviceName, tags)
      }
    });
  }
}