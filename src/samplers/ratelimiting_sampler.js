import * as constants from '../constants'
import RateLimiter from '../rate_limiter'

export default class RateLimitingSampler {
  _rateLimiter
  _maxTracesPerSecond

  constructor(maxTracesPerSecond, initBalance) {
    this._init(maxTracesPerSecond, initBalance)
  }

  update(maxTracesPerSecond) {
    let prevMaxTracesPerSecond = this._maxTracesPerSecond
    this._init(maxTracesPerSecond)
    return this._maxTracesPerSecond !== prevMaxTracesPerSecond
  }

  _init(maxTracesPerSecond, initBalance) {
    if (maxTracesPerSecond < 0) {
      throw new Error(`maxTracesPerSecond must be greater than 0.0.  Received ${maxTracesPerSecond}`)
    }
    let maxBalance = maxTracesPerSecond < 1.0 ? 1.0 : maxTracesPerSecond

    this._maxTracesPerSecond = maxTracesPerSecond
    if (this._rateLimiter) {
      this._rateLimiter.update(maxTracesPerSecond, maxBalance)
    } else {
      this._rateLimiter = new RateLimiter(maxTracesPerSecond, maxBalance, initBalance)
    }
  }

  name() {
    return 'RateLimitingSampler'
  }

  toString() {
    return `${this.name()}(maxTracesPerSecond=${this._maxTracesPerSecond})`
  }

  get maxTracesPerSecond() {
    return this._maxTracesPerSecond
  }

  isSampled(operation, tags) {
    let decision = this._rateLimiter.checkCredit(1.0)
    if (decision) {
      tags[constants.SAMPLER_TYPE_TAG_KEY] = constants.SAMPLER_TYPE_RATE_LIMITING
      tags[constants.SAMPLER_PARAM_TAG_KEY] = this._maxTracesPerSecond
    }
    return decision
  }

  equal(other) {
    if (!(other instanceof RateLimitingSampler)) {
      return false
    }

    return this.maxTracesPerSecond === other.maxTracesPerSecond
  }

  close(callback) {
    if (callback) {
      callback()
    }
  }
}