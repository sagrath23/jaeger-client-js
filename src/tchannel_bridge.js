import assert from 'assert'
import * as constants from './constants'
import DefaultContext from './default_context'
import Span from './span'
import SpanContext from './span_context'
import Utils from './util'
import opentracing from 'opentracing'
import Tracer from './tracer'
import TextMapCodec from './propagators/text_map_codec'

let TCHANNEL_TRACING_PREFIX = '$tracing$'

export default class TChannelBridge {
  _tracer
  _codec
  _contextFactory
  _getSpan
  _setSpan

  /**
   * @param {Object} [tracer] - Jaeger Tracer
   * @param {Object} [options] - options
   * @param {Function} [options.contextFactory] - function used to create new Context object instead of DefaultContext
   * @param {Function} [options.getSpan] - function(ctx) - used to read Span from Context object default is ctx.getSpan()
   * @param {Function} [options.setSpan] - function(ctx, span): void - used to set Span on the Context object default is ctx.setSpan(span)
   */
  constructor(tracer, options = {}) {
    this._tracer = tracer
    assert.equal('object', typeof options, 'options must be an object')
    this._codec = new TextMapCodec({
      urlEncoding: false,
      contextKey: TCHANNEL_TRACING_PREFIX + constants.TRACER_STATE_HEADER_NAME,
      baggagePrefix: TCHANNEL_TRACING_PREFIX + constants.TRACER_BAGGAGE_HEADER_PREFIX,
    })
    this._contextFactory =
      options.contextFactory ||
      function() {
        return new DefaultContext()
      }
    this._getSpan =
      options.getSpan ||
      function(ctx) {
        return ctx.getSpan()
      }
    this._setSpan =
      options.setSpan ||
      function(ctx, span) {
        return ctx.setSpan(span)
      }
  }

  _tchannelCallbackWrapper(span, callback, err, res) {
    if (err) {
      span.setTag(opentracing.Tags.ERROR, true)
      span.log('error_msg', err)
    }

    span.finish()
    return callback(err, res)
  }

  /**
   * Wraps a tchannel handler, and takes a context in order to populate the incoming context
   * with a span.
   *
   * @param {Function} [handlerFunc] - a tchannel handler function that responds to an incoming request.
   * @param {Object} [options] - options to be passed to a span on creation.
   * @returns {Function} - a function that wrapps the handler in order to automatically populate
   * a the handler's context with a span.
   **/
  tracedHandler(handlerFunc, options = {}) {
    return (perProcessOptions, request, headers, body, callback) => {
      let context = this._contextFactory()
      let operationName = options.operationName || request.arg1
      let span = this._extractSpan(operationName, headers)

      // set tags
      span.setTag(opentracing.Tags.PEER_SERVICE, request.callerName)
      let hostPort = request.remoteAddr.split(':')
      if (hostPort.length == 2) {
        span.setTag(opentracing.Tags.PEER_PORT, parseInt(hostPort[1]))
      }
      if (request.headers && request.headers.as) {
        span.setTag('as', request.headers.as)
      }

      this._setSpan(context, span)

      // remove headers prefixed with $tracing$
      let headerKeys = Object.keys(headers)
      for (let i = 0; i < headerKeys.length; i++) {
        let key = headerKeys[i]
        if (headers.hasOwnProperty(key) && Utils.startsWith(key, TCHANNEL_TRACING_PREFIX)) {
          delete headers[key]
        }
      }

      let wrappingCallback = this._tchannelCallbackWrapper.bind(null, span, callback)
      request.context = context
      handlerFunc(perProcessOptions, request, headers, body, wrappingCallback)
    }
  }

  _wrapTChannelSend(
    wrappedSend,
    channel,
    req,
    endpoint,
    headers,
    body,
    callback
  ) {
    headers = headers || {}
    let context = req.context || this._contextFactory()
    let childOf = this._getSpan(context)
    let clientSpan = this._tracer.startSpan(endpoint, {
      childOf: childOf, // ok if null, will start a new trace
    })
    clientSpan.setTag(opentracing.Tags.PEER_SERVICE, req.serviceName)
    clientSpan.setTag(opentracing.Tags.SPAN_KIND, opentracing.Tags.SPAN_KIND_RPC_CLIENT)
    this.inject(clientSpan.context(), headers)

    // wrap callback so that span can be finished as soon as the response is received
    let wrappingCallback = this._tchannelCallbackWrapper.bind(null, clientSpan, callback)

    return wrappedSend.call(channel, req, endpoint, headers, body, wrappingCallback)
  }

  _wrapTChannelRequest(channel, wrappedRequestMethod, requestOptions) {
    // We set the parent to a span with trace_id zero, so that tchannel's
    // outgoing tracing frame also has a trace id of zero.
    // This forces other tchannel implementations to rely on the headers for the trace context.
    requestOptions.parent = { span: TChannelBridge.makeFakeTChannelParentSpan() }

    let tchannelRequest = wrappedRequestMethod.call(channel, requestOptions)
    tchannelRequest.context = requestOptions.context
    return tchannelRequest
  }

  /**
   * Encode given span context as tchannel headers and store into the headers dictionary.
   * @param {Object} spanContext - Jaeger SpanContext.
   * @returns {Object} headers - a dictionary with TChannel application headers.
   */
  inject(spanContext, headers) {
    this._codec.inject(spanContext, headers)
  }

  /**
   * A function that wraps a json, or thrift encoded channel, in order to populate
   * the outgoing headers with trace context, and baggage information.
   *
   * @param {Object} channel - the encoded channel to be wrapped for tracing.
   * @returns {Object} channel - the trace wrapped channel.
   * */
  tracedChannel(channel) {
    let wrappedSend = channel.send
    let wrappedRequestMethod = channel.channel.request

    // We are patching the top level channel request method, not the encoded request method.
    channel.channel.request = this._wrapTChannelRequest.bind(this, channel.channel, wrappedRequestMethod)

    channel.send = this._wrapTChannelSend.bind(this, wrappedSend, channel)
    return channel
  }

  static makeFakeTChannelParentSpan() {
    return {
      id: [0, 0],
      traceid: [0, 0],
      parentid: [0, 0],
      flags: 0,
    }
  }

  _extractSpan(operationName, headers) {
    let traceContext = this._codec.extract(headers)
    let tags = {}
    tags[opentracing.Tags.SPAN_KIND] = opentracing.Tags.SPAN_KIND_RPC_SERVER
    let options = {
      childOf: traceContext,
      tags: tags,
    }
    let span = this._tracer.startSpan(operationName, options)
    return span
  }
}