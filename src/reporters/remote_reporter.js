import NullLogger from '../logger'
import ThriftUtils from '../thrift'
import Metrics from '../metrics/metrics'
import NoopMetricFactory from '../metrics/noop/metric_factory'

const DEFAULT_BUFFER_FLUSH_INTERVAL_MILLIS = 1000

export default class RemoteReporter {
  _bufferFlushInterval
  _logger
  _sender
  _intervalHandle
  _process
  _metrics

  constructor(sender, options = {}) {
    if (!sender) {
      throw new Error('RemoteReporter must be given a Sender.')
    }

    this._bufferFlushInterval = options.bufferFlushInterval || DEFAULT_BUFFER_FLUSH_INTERVAL_MILLIS
    this._logger = options.logger || new NullLogger()
    this._sender = sender
    this._intervalHandle = setInterval(() => {
      this.flush()
    }, this._bufferFlushInterval)
    this._metrics = options.metrics || new Metrics(new NoopMetricFactory())
  }

  name() {
    return 'RemoteReporter'
  }

  report(span) {
    const thriftSpan = ThriftUtils.spanToThrift(span)
    this._sender.append(thriftSpan, this._appendCallback)
  }

  _appendCallback = (numSpans, err) => {
    if (err) {
      this._logger.error(`Failed to append spans in reporter: ${err}`)
      this._metrics.reporterDropped.increment(numSpans)
    } else {
      this._metrics.reporterSuccess.increment(numSpans)
    }
  }

  _invokeCallback(callback = () => {}) {
    if (callback) {
      callback()
    }
  }

  flush(callback = () => {}) {
    if (this._process === undefined) {
      this._logger.error('Failed to flush since process is not set.')
      this._invokeCallback(callback)
      return
    }
    this._sender.flush((numSpans, err) => {
      if (err) {
        this._logger.error(`Failed to flush spans in reporter: ${err}`)
        this._metrics.reporterFailure.increment(numSpans)
      } else {
        this._metrics.reporterSuccess.increment(numSpans)
      }
      this._invokeCallback(callback)
    })
  }

  close(callback = () => {}) {
    clearInterval(this._intervalHandle)
    this.flush(() => {
      this._sender.close()
      this._invokeCallback(callback)
    })
  }

  setProcess(serviceName, tags) {
    this._process = {
      serviceName: serviceName,
      tags: ThriftUtils.getThriftTags(tags),
    }

    this._sender.setProcess(this._process)
  }
}
