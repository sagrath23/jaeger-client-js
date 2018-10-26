import * as constants from '../constants.js'

export default class ProbabilisticSampler {
  _samplingRate

  constructor(samplingRate) {
    if (samplingRate < 0.0 || samplingRate > 1.0) {
      throw new Error(
        `The sampling rate must be less than 0.0 and greater than 1.0. Received ${samplingRate}`
      )
    }

    this._samplingRate = samplingRate
  }

  name() {
    return 'ProbabilisticSampler'
  }

  toString() {
    return `${this.name()}(samplingRate=${this._samplingRate})`
  }

  get samplingRate() {
    return this._samplingRate
  }

  isSampled(operation, tags) {
    let decision = this.random() < this._samplingRate
    if (decision) {
      tags[constants.SAMPLER_TYPE_TAG_KEY] = constants.SAMPLER_TYPE_PROBABILISTIC
      tags[constants.SAMPLER_PARAM_TAG_KEY] = this._samplingRate
    }
    return decision
  }

  random() {
    return Math.random()
  }

  equal(other) {
    if (!(other instanceof ProbabilisticSampler)) {
      return false
    }

    return this.samplingRate === other.samplingRate
  }

  close(callback) {
    if (callback) {
      callback()
    }
  }
}