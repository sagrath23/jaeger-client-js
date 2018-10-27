/**
 * DefaultThrottler either throttles everything or nothing.
 */
export default class DefaultThrottler {
  _throttleAll

  constructor(throttleAll) {
    this._throttleAll = throttleAll || false
  }

  isAllowed(operation) {
    return !this._throttleAll
  }

  setProcess(process) {
    // NOP
  }

  close(callback) {
    if (callback) {
      callback()
    }
  }
}