import * as constants from '../constants'
import ProbabilisticSampler from './probabilistic_sampler'
import RateLimitingSampler from './ratelimiting_sampler'

// GuaranteedThroughputProbabilisticSampler is a sampler that leverages both probabilisticSampler and
// rateLimitingSampler. The rateLimitingSampler is used as a guaranteed lower bound sampler such that
// every operation is sampled at least once in a time interval defined by the lowerBound. ie a lowerBound
// of 1.0 / (60 * 10) will sample an operation at least once every 10 minutes.
//
// The probabilisticSampler is given higher priority when tags are emitted, ie. if IsSampled() for both
// samplers return true, the tags for probabilisticSampler will be used.
export default class GuaranteedThroughputSampler {
  _probabilisticSampler
  _lowerBoundSampler
  _tagsPlaceholder

  constructor(lowerBound, samplingRate) {
    this._probabilisticSampler = new ProbabilisticSampler(samplingRate)
    this._lowerBoundSampler = new RateLimitingSampler(lowerBound)
    // we never let the lowerBoundSampler return its real tags, so avoid allocations
    // by reusing the same placeholder object
    this._tagsPlaceholder = {}
  }

  name() {
    return 'GuaranteedThroughputSampler'
  }

  toString() {
    return `${this.name()}(samplingRate=${this._probabilisticSampler.samplingRate}, lowerBound=${
      this._lowerBoundSampler.maxTracesPerSecond
    })`
  }

  isSampled(operation, tags) {
    if (this._probabilisticSampler.isSampled(operation, tags)) {
      // make rate limiting sampler update its budget
      this._lowerBoundSampler.isSampled(operation, this._tagsPlaceholder)
      return true
    }
    let decision = this._lowerBoundSampler.isSampled(operation, this._tagsPlaceholder)
    if (decision) {
      tags[constants.SAMPLER_TYPE_TAG_KEY] = constants.SAMPLER_TYPE_LOWER_BOUND
      tags[constants.SAMPLER_PARAM_TAG_KEY] = this._probabilisticSampler.samplingRate
    }
    return decision
  }

  equal(other) {
    if (!(other instanceof GuaranteedThroughputSampler)) {
      return false
    }
    return (
      this._probabilisticSampler.equal(other._probabilisticSampler) &&
      this._lowerBoundSampler.equal(other._lowerBoundSampler)
    )
  }

  close(callback) {
    // neither probabilistic nor rate limiting samplers allocate resources,
    // so their close methods are effectively no-op. We do not need to
    // pass the callback to them (if we did we'd need to wrap it).
    this._probabilisticSampler.close(() => {})
    this._lowerBoundSampler.close(() => {})
    if (callback) {
      callback()
    }
  }

  update(lowerBound, samplingRate) {
    let updated = false
    if (this._probabilisticSampler.samplingRate != samplingRate) {
      this._probabilisticSampler = new ProbabilisticSampler(samplingRate)
      updated = true
    }
    if (this._lowerBoundSampler.maxTracesPerSecond != lowerBound) {
      updated = this._lowerBoundSampler.update(lowerBound)
    }
    return updated
  }
}