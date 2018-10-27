import Metrics from '../metrics/metrics'
import NullLogger from '../logger'
import NoopMetricFactory from '../metrics/noop/metric_factory'
import Utils from '../util'

const DEFAULT_REFRESH_INTERVAL_MS = 5000
const DEFAULT_INITIAL_DELAY_MS = 5000
const DEFAULT_THROTTLER_HOST = '0.0.0.0'
const DEFAULT_THROTTLER_PORT = 5778

// UNIT_CREDIT is the minimum amount of credits necessary to not be throttled.
// i.e. if currentCredits > UNIT_CREDIT, then the operation will not be throttled.
const UNIT_CREDIT = 1.0

export default class RemoteThrottler {
  _serviceName
  _logger
  _metrics

  _refreshIntervalMs
  _host
  _port

  _uuid
  _credits

  _initialDelayTimeoutHandle
  _refreshIntervalHandle
  _onCreditsUpdate

  /**
   * Creates a RemoteThrottler that fetches credits remotely from jaeger-agent.
   *
   * @param {string} [serviceName] - name of the current service / application, same as given to Tracer
   * @param {object} [options] - optional settings
   * @param {object} [options.logger] - optional logger, see _flow/logger.js
   * @param {object} [options.metrics] - instance of Metrics object
   * @param {number} [options.refreshIntervalMs] - interval in milliseconds that determines how often credits
   * are fetched
   * @param {number} [options.initialDelayMs] - interval in milliseconds that determines how soon after initialization
   * credits are first fetched
   * @param {string} [options.host] - host for jaeger-agent, defaults to 'localhost'
   * @param {number} [options.port] - port for jaeger-agent for /credits endpoint
   * @param {function} [options.onCreditsUpdate] - callback function once credits are updated. Used for testing.
   */
  constructor(serviceName, options = {}) {
    this._serviceName = serviceName
    this._logger = options.logger || new NullLogger()
    this._metrics = options.metrics || new Metrics(new NoopMetricFactory())
    this._refreshIntervalMs = options.refreshIntervalMs || DEFAULT_REFRESH_INTERVAL_MS
    this._host = options.host || DEFAULT_THROTTLER_HOST
    this._port = options.port || DEFAULT_THROTTLER_PORT

    this._credits = {}
    this._onCreditsUpdate = options.onCreditsUpdate

    this._initialDelayTimeoutHandle = setTimeout(
      this._afterInitialDelay.bind(this),
      options.initialDelayMs || DEFAULT_INITIAL_DELAY_MS
    )
  }

  _afterInitialDelay() {
    this._refreshCredits()
    this._refreshIntervalHandle = setInterval(this._refreshCredits.bind(this), this._refreshIntervalMs)
    this._initialDelayTimeoutHandle = null
  }

  setProcess(process) {
    this._uuid = process.uuid || ''
  }

  isAllowed(operation) {
    if (operation in this._credits) {
      return this._isAllowed(operation)
    }
    // Credits for the operation will be asynchronously fetched
    this._credits[operation] = 0
    this._metrics.throttledDebugSpans.increment(1)
    return false
  }

  _isAllowed(operation) {
    const credits = this._credits[operation] || 0
    if (credits < UNIT_CREDIT) {
      this._metrics.throttledDebugSpans.increment(1)
      return false
    }
    this._credits[operation] = credits - UNIT_CREDIT
    return true
  }

  _refreshCredits() {
    if (!this._uuid) {
      this._logger.error(`UUID must be set to fetch credits`)
      return
    }
    const keys = Object.keys(this._credits)
    if (keys.length === 0) {
      // No point fetching credits if there's no operations to fetch
      return
    }
    this._fetchCredits(keys)
  }

  _incrementCredits(creditResponses) {
    creditResponses.forEach(r => {
      this._credits[r.operation] = this._credits[r.operation] + r.balance
    })
  }

  _fetchCredits(operations) {
    const serviceName = encodeURIComponent(this._serviceName)
    const uuid = encodeURIComponent(this._uuid)
    const ops = operations.map(encodeURIComponent).join('&operations=')
    const url = `/credits?service=${serviceName}&uuid=${uuid}&operations=${ops}`

    const success = body => {
      this._parseCreditResponse(body)
    }
    const error = err => {
      this._logger.error(`Error in fetching credits: ${err}.`)
      this._metrics.throttlerUpdateFailure.increment(1)
    }
    Utils.httpGet(this._host, this._port, url, success, error)
  }

  _parseCreditResponse(body) {
    let creditResponses
    try {
      creditResponses = JSON.parse(body)
    } catch (error) {
      this._logger.error(`Error in parsing credit response: ${error}.`)
      this._metrics.throttlerUpdateFailure.increment(1)
      return
    }
    try {
      this._incrementCredits(creditResponses.balances)
      this._metrics.throttlerUpdateSuccess.increment(1)
    } catch (error) {
      this._logger.error(`Error in updating credits: ${error}.`)
      this._metrics.throttlerUpdateFailure.increment(1)
      return
    }
    if (this._onCreditsUpdate) {
      this._onCreditsUpdate(this)
    }
  }

  close(callback) {
    clearTimeout(this._initialDelayTimeoutHandle)
    clearInterval(this._refreshIntervalHandle)

    if (callback) {
      callback()
    }
  }
}