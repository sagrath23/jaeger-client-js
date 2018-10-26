export default class Metrics {
  _factory
  tracesStartedSampled
  tracesStartedNotSampled
  tracesJoinedSampled
  tracesJoinedNotSampled
  spansFinished
  spansStartedSampled
  spansStartedNotSampled
  decodingErrors
  reporterSuccess
  reporterFailure
  reporterDropped
  reporterQueueLength
  samplerRetrieved
  samplerUpdated
  samplerQueryFailure
  samplerUpdateFailure
  baggageUpdateSuccess
  baggageUpdateFailure
  baggageTruncate
  throttledDebugSpans
  throttlerUpdateSuccess
  throttlerUpdateFailure

  constructor(factory) {
    this._factory = factory

    this.tracesStartedSampled = this._factory.createCounter('jaeger:traces', {
      state: 'started',
      sampled: 'y',
    })

    this.tracesStartedNotSampled = this._factory.createCounter('jaeger:traces', {
      state: 'started',
      sampled: 'n',
    })

    this.tracesJoinedSampled = this._factory.createCounter('jaeger:traces', {
      state: 'joined',
      sampled: 'y',
    })

    this.tracesJoinedNotSampled = this._factory.createCounter('jaeger:traces', {
      state: 'joined',
      sampled: 'n',
    })

    this.spansFinished = this._factory.createCounter('jaeger:finished_spans')

    this.spansStartedSampled = this._factory.createCounter('jaeger:started_spans', {
      sampled: 'y',
    })

    this.spansStartedNotSampled = this._factory.createCounter('jaeger:started_spans', {
      sampled: 'n',
    })

    this.decodingErrors = this._factory.createCounter('jaeger:span_context_decoding_errors')

    this.reporterSuccess = this._factory.createCounter('jaeger:reporter_spans', {
      result: 'ok',
    })

    this.reporterFailure = this._factory.createCounter('jaeger:reporter_spans', {
      result: 'err',
    })

    this.reporterDropped = this._factory.createCounter('jaeger:reporter_spans', {
      result: 'dropped',
    })

    this.reporterQueueLength = this._factory.createGauge('jaeger:reporter_queue_length')

    this.samplerRetrieved = this._factory.createCounter('jaeger:sampler_queries', {
      result: 'ok',
    })

    this.samplerQueryFailure = this._factory.createCounter('jaeger:sampler_queries', {
      result: 'err',
    })

    this.samplerUpdated = this._factory.createCounter('jaeger:sampler_updates', {
      result: 'ok',
    })

    this.samplerUpdateFailure = this._factory.createCounter('jaeger:sampler_updates', {
      result: 'err',
    })

    this.baggageUpdateSuccess = this._factory.createCounter('jaeger:baggage_updates', {
      result: 'ok',
    })

    this.baggageUpdateFailure = this._factory.createCounter('jaeger:baggage_updates', {
      result: 'err',
    })

    this.baggageTruncate = this._factory.createCounter('jaeger:baggage_truncations')

    this.throttledDebugSpans = this._factory.createCounter('jaeger:throttled_debug_spans')

    this.throttlerUpdateSuccess = this._factory.createCounter('jaeger:throttler_updates', {
      result: 'ok',
    })

    this.throttlerUpdateFailure = this._factory.createCounter('jaeger:throttler_updates', {
      result: 'err',
    })
  }
}