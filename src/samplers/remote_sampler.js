import ProbabilisticSampler from './probabilistic_sampler'
import RateLimitingSampler from './ratelimiting_sampler'
import PerOperationSampler from './per_operation_sampler'
import Metrics from '../metrics/metrics'
import NullLogger from '../logger'
import NoopMetricFactory from '../metrics/noop/metric_factory'
import Utils from '../util'

const DEFAULT_INITIAL_SAMPLING_RATE = 0.001
const DEFAULT_REFRESH_INTERVAL = 60000
const DEFAULT_MAX_OPERATIONS = 2000
const DEFAULT_SAMPLING_HOST = '0.0.0.0'
const DEFAULT_SAMPLING_PORT = 5778
const PROBABILISTIC_STRATEGY_TYPE = 'PROBABILISTIC'
const RATELIMITING_STRATEGY_TYPE = 'RATE_LIMITING'

export default class RemoteControlledSampler {
  _serviceName
  _sampler
  _logger
  _metrics

  _refreshInterval
  _host
  _port
  _maxOperations

  _onSamplerUpdate

  _initialDelayTimeoutHandle
  _refreshIntervalHandle

  /**
   * Creates a sampler remotely controlled by jaeger-agent.
   *
   * @param {string} [serviceName] - name of the current service / application, same as given to Tracer
   * @param {object} [options] - optional settings
   * @param {object} [options.sampler] - initial sampler to use prior to retrieving strategies from Agent
   * @param {object} [options.logger] - optional logger, see _flow/logger.js
   * @param {object} [options.metrics] - instance of Metrics object
   * @param {number} [options.refreshInterval] - interval in milliseconds before sampling strategy refreshes (0 to not refresh)
   * @param {string} [options.host] - host for jaeger-agent, defaults to 'localhost'
   * @param {number} [options.port] - port for jaeger-agent for SamplingManager endpoint
   * @param {number} [options.maxOperations] - max number of operations to track in PerOperationSampler
   * @param {function} [options.onSamplerUpdate]
   */
  constructor(serviceName, options = {}) {
    this._serviceName = serviceName
    this._sampler = options.sampler || new ProbabilisticSampler(DEFAULT_INITIAL_SAMPLING_RATE)
    this._logger = options.logger || new NullLogger()
    this._metrics = options.metrics || new Metrics(new NoopMetricFactory())
    this._refreshInterval = options.refreshInterval || DEFAULT_REFRESH_INTERVAL
    this._host = options.host || DEFAULT_SAMPLING_HOST
    this._port = options.port || DEFAULT_SAMPLING_PORT
    this._maxOperations = options.maxOperations || DEFAULT_MAX_OPERATIONS

    this._onSamplerUpdate = options.onSamplerUpdate

    if (options.refreshInterval !== 0) {
      let randomDelay = Math.random() * this._refreshInterval
      this._initialDelayTimeoutHandle = setTimeout(this._afterInitialDelay.bind(this), randomDelay)
    }
  }

  name() {
    return 'RemoteSampler'
  }

  toString() {
    return `${this.name()}(serviceName=${this._serviceName})`
  }

  _afterInitialDelay() {
    this._refreshIntervalHandle = setInterval(
      this._refreshSamplingStrategy.bind(this),
      this._refreshInterval
    )
    this._initialDelayTimeoutHandle = null
  }

  _refreshSamplingStrategy() {
    let serviceName = encodeURIComponent(this._serviceName)
    const success = (body) => {
      this._parseSamplingServerResponse(body)
    }
    const error = (err) => {
      this._logger.error(`Error in fetching sampling strategy: ${err}.`)
      this._metrics.samplerQueryFailure.increment(1)
    }
    Utils.httpGet(this._host, this._port, `/sampling?service=${serviceName}`, success, error)
  }

  _parseSamplingServerResponse(body) {
    this._metrics.samplerRetrieved.increment(1)
    let strategy
    try {
      strategy = JSON.parse(body)
      if (!strategy) {
        throw 'Malformed response: ' + body
      }
    } catch (error) {
      this._logger.error(`Error in parsing sampling strategy: ${error}.`)
      this._metrics.samplerUpdateFailure.increment(1)
      return
    }
    try {
      if (this._updateSampler(strategy)) {
        this._metrics.samplerUpdated.increment(1)
      }
    } catch (error) {
      this._logger.error(`Error in updating sampler: ${error}.`)
      this._metrics.samplerUpdateFailure.increment(1)
      return
    }
    if (this._onSamplerUpdate) {
      this._onSamplerUpdate(this._sampler)
    }
  }

  _updateSampler(response) {
    if (response.operationSampling) {
      if (this._sampler instanceof PerOperationSampler) {
        let sampler = this._sampler
        return sampler.update(response.operationSampling)
      }
      this._sampler = new PerOperationSampler(response.operationSampling, this._maxOperations)
      return true
    }
    let newSampler
    if (response.strategyType === PROBABILISTIC_STRATEGY_TYPE && response.probabilisticSampling) {
      let samplingRate = response.probabilisticSampling.samplingRate
      newSampler = new ProbabilisticSampler(samplingRate)
    } else if (response.strategyType === RATELIMITING_STRATEGY_TYPE && response.rateLimitingSampling) {
      let maxTracesPerSecond = response.rateLimitingSampling.maxTracesPerSecond
      if (this._sampler instanceof RateLimitingSampler) {
        let sampler = this._sampler
        return sampler.update(maxTracesPerSecond)
      }
      this._sampler = new RateLimitingSampler(maxTracesPerSecond)
      return true
    } else {
      throw 'Malformed response: ' + JSON.stringify(response)
    }

    if (this._sampler.equal(newSampler)) {
      return false
    }
    this._sampler = newSampler
    return true
  }

  isSampled(operation, tags) {
    return this._sampler.isSampled(operation, tags)
  }

  close(callback) {
    clearTimeout(this._initialDelayTimeoutHandle)
    clearInterval(this._refreshIntervalHandle)

    if (callback) {
      callback()
    }
  }
}