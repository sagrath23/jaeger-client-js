import * as constants from '../constants.js'

export default class ConstSampler {
  _decision

  constructor(decision) {
    this._decision = decision
  }

  name() {
    return 'ConstSampler'
  }

  toString() {
    return `${this.name()}(${this._decision ? 'always' : 'never'})`
  }

  get decision() {
    return this._decision
  }

  isSampled(operation, tags) {
    if (this._decision) {
      tags[constants.SAMPLER_TYPE_TAG_KEY] = constants.SAMPLER_TYPE_CONST
      tags[constants.SAMPLER_PARAM_TAG_KEY] = this._decision
    }
    return this._decision
  }

  equal(other) {
    if (!(other instanceof ConstSampler)) {
      return false
    }

    return this.decision === other.decision
  }

  close(callback) {
    if (callback) {
      callback()
    }
  }
}