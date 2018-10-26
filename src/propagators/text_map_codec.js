import * as constants from '../constants.js'
import Metrics from '../metrics/metrics.js'
import NoopMetricFactory from '../metrics/noop/metric_factory'
import SpanContext from '../span_context.js'
import Utils from '../util.js'
import { parseCommaSeparatedBaggage } from '../propagators/baggage'

export default class TextMapCodec {
  _urlEncoding
  _contextKey
  _baggagePrefix
  _metrics

  constructor(options = {}) {
    this._urlEncoding = !!options.urlEncoding
    this._contextKey = options.contextKey || constants.TRACER_STATE_HEADER_NAME
    this._contextKey = this._contextKey.toLowerCase()
    this._baggagePrefix = options.baggagePrefix || constants.TRACER_BAGGAGE_HEADER_PREFIX
    this._baggagePrefix = this._baggagePrefix.toLowerCase()
    this._metrics = options.metrics || new Metrics(new NoopMetricFactory())
  }

  _encodeValue(value) {
    if (this._urlEncoding) {
      return encodeURIComponent(value)
    }

    return value
  }

  _decodeValue(value) {
    // only use url-decoding if there are meta-characters '%'
    if (this._urlEncoding && value.indexOf('%') > -1) {
      return this._decodeURIValue(value)
    }

    return value
  }

  _decodeURIValue(value) {
    // unfortunately, decodeURIComponent() can throw 'URIError: URI malformed' on bad strings
    try {
      return decodeURIComponent(value)
    } catch (e) {
      return value
    }
  }

  extract(carrier) {
    let spanContext = new SpanContext()
    let baggage = {}
    let debugId = ''

    for (let key in carrier) {
      if (carrier.hasOwnProperty(key)) {
        let lowerKey = key.toLowerCase()
        if (lowerKey === this._contextKey) {
          let decodedContext = SpanContext.fromString(this._decodeValue(carrier[key]))
          if (decodedContext === null) {
            this._metrics.decodingErrors.increment(1)
          } else {
            spanContext = decodedContext
          }
        } else if (lowerKey === constants.JAEGER_DEBUG_HEADER) {
          debugId = this._decodeValue(carrier[key])
        } else if (lowerKey === constants.JAEGER_BAGGAGE_HEADER) {
          parseCommaSeparatedBaggage(baggage, this._decodeValue(carrier[key]))
        } else if (Utils.startsWith(lowerKey, this._baggagePrefix)) {
          let keyWithoutPrefix = key.substring(this._baggagePrefix.length)
          baggage[keyWithoutPrefix] = this._decodeValue(carrier[key])
        }
      }
    }

    spanContext.debugId = debugId
    spanContext.baggage = baggage
    return spanContext
  }

  inject(spanContext, carrier) {
    let stringSpanContext = spanContext.toString()
    carrier[this._contextKey] = stringSpanContext // no need to encode this

    let baggage = spanContext.baggage
    for (let key in baggage) {
      if (baggage.hasOwnProperty(key)) {
        let value = this._encodeValue(spanContext.baggage[key])
        carrier[`${this._baggagePrefix}${key}`] = value
      }
    }
  }
}