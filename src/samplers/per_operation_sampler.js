import assert from 'assert'
import ProbabilisticSampler from './probabilistic_sampler.js'
import GuaranteedThroughputSampler from './guaranteed_throughput_sampler.js'

// PerOperationSampler keeps track of all operation names it is asked to sample
// and uses GuaranteedThroughputSampler for each operation name to ensure
// that all endpoints are represented in the sampled traces. If the number
// of distinct operation names exceeds maxOperations, all other names are
// sampled with a default probabilistic sampler.
export default class PerOperationSampler {
  _maxOperations
  _samplersByOperation
  _defaultSampler
  _defaultLowerBound

  constructor(strategies, maxOperations) {
    this._maxOperations = maxOperations
    this._samplersByOperation = Object.create(null)
    this.update(strategies)
  }

  update(strategies) {
    assert(
      typeof strategies.defaultLowerBoundTracesPerSecond === 'number',
      'expected strategies.defaultLowerBoundTracesPerSecond to be number'
    )
    assert(
      typeof strategies.defaultSamplingProbability === 'number',
      'expected strategies.defaultSamplingProbability to be number'
    )

    let updated = this._defaultLowerBound !== strategies.defaultLowerBoundTracesPerSecond
    this._defaultLowerBound = strategies.defaultLowerBoundTracesPerSecond
    strategies.perOperationStrategies.forEach(strategy => {
      let operation = strategy.operation
      let samplingRate = strategy.probabilisticSampling.samplingRate
      let sampler = this._samplersByOperation[operation]
      if (sampler) {
        if (sampler.update(this._defaultLowerBound, samplingRate)) {
          updated = true
        }
      } else {
        sampler = new GuaranteedThroughputSampler(this._defaultLowerBound, samplingRate)
        this._samplersByOperation[operation] = sampler
        updated = true
      }
    })
    let defaultSamplingRate = strategies.defaultSamplingProbability
    if (!this._defaultSampler || this._defaultSampler.samplingRate != defaultSamplingRate) {
      this._defaultSampler = new ProbabilisticSampler(defaultSamplingRate)
      updated = true
    }
    return updated
  }

  name() {
    return 'PerOperationSampler'
  }

  toString() {
    return `${this.name()}(maxOperations=${this._maxOperations})`
  }

  isSampled(operation, tags) {
    let sampler = this._samplersByOperation[operation]
    if (!sampler) {
      if (Object.keys(this._samplersByOperation).length >= this._maxOperations) {
        return this._defaultSampler.isSampled(operation, tags)
      }
      sampler = new GuaranteedThroughputSampler(this._defaultLowerBound, this._defaultSampler.samplingRate)
      this._samplersByOperation[operation] = sampler
    }
    return sampler.isSampled(operation, tags)
  }

  close(callback) {
    // all nested samplers are of simple types, so we do not need to Close them
    if (callback) {
      callback()
    }
  }
}