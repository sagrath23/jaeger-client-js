import Span from '../span'
import SpanContext from '../span_context'
import Metrics from '../metrics/metrics'

/**
 * BaggageSetter is a class that sets a baggage key:value and the associated
 * logs on a Span.
 */
export default class BaggageSetter {
  _restrictionManager
  _metrics

  constructor(restrictionManager, metrics) {
    this._restrictionManager = restrictionManager
    this._metrics = metrics
  }

  /**
   * Sets the baggage key:value on the span and the corresponding logs.
   * A SpanContext is returned with the new baggage key:value set.
   *
   * @param {Span} span - The span to set the baggage on.
   * @param {string} key - The baggage key to set.
   * @param {string} baggageValue - The baggage value to set.
   * @return {SpanContext} - The SpanContext with the baggage set if applicable.
   */
  setBaggage(span, key, baggageValue) {
    let value = baggageValue
    let truncated = false
    let prevItem = ''
    let restriction = this._restrictionManager.getRestriction(span.serviceName, key)
    if (!restriction.keyAllowed) {
      this._logFields(span, key, value, prevItem, truncated, restriction.keyAllowed)
      this._metrics.baggageUpdateFailure.increment(1)
      return span.context()
    }
    if (value.length > restriction.maxValueLength) {
      truncated = true
      value = value.substring(0, restriction.maxValueLength)
      this._metrics.baggageTruncate.increment(1)
    }
    prevItem = span.getBaggageItem(key)
    this._logFields(span, key, value, prevItem, truncated, restriction.keyAllowed)
    this._metrics.baggageUpdateSuccess.increment(1)
    return span.context().withBaggageItem(key, value)
  }

  _logFields(span, key, value, prevItem, truncated, valid) {
    if (!span.context().isSampled()) {
      return
    }
    let fields= {
      event: 'baggage',
      key: key,
      value: value,
    }
    if (prevItem) {
      fields.override = 'true'
    }
    if (truncated) {
      fields.truncated = 'true'
    }
    if (!valid) {
      fields.invalid = 'true'
    }
    span.log(fields)
  }
}