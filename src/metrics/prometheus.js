class CounterPromWrapper {
  _counter

  constructor(counter) {
    this._counter = counter
  }

  increment(delta) {
    this._counter.inc(delta)
  }
}

class GaugePromWrapper {
  _gauge

  constructor(gauge) {
    this._gauge = gauge
  }

  update(value) {
    this._gauge.set(value)
  }
}

export default class PrometheusMetricsFactory {
  _cache = {}
  _namespace
  _promClient

  /**
   * Construct metrics factory for Prometheus
   *
   * To instantiate, prom-client needs to be passed like this:
   *
   *    var PrometheusMetricsFactory = require('jaeger-client').PrometheusMetricsFactory
   *    var promClient = require('prom-client')
   *
   *    var namespace = 'your-namespace'
   *    var metrics = new PrometheusMetricsFactory(promClient, namespace)
   *
   * @param {Object} promClient - prom-client object.
   * @param {String} namespace - Optional a namespace that prepends to each metric name.
   */
  constructor(promClient, namespace) {
    if (!promClient || !promClient.Counter || !promClient.Gauge) {
      throw new Error('prom-client must be provided')
    }
    this._promClient = promClient
    this._namespace = namespace
  }

  _createMetric(metric, name, labels) {
    let labelNames = []
    let labelValues = []
    for (let key in labels) {
      labelNames.push(key)
      labelValues.push(labels[key])
    }
    let key = name + ',' + labelNames.toString()
    let help = name
    if (this._namespace) {
      name = this._namespace + '_' + name
    }
    if (!(key in this._cache)) {
      this._cache[key] = new metric({ name, help, labelNames })
    }
    return labelValues.length > 0 ? this._cache[key].labels(...labelValues) : this._cache[key]
  }

  /**
   * Create a counter metric
   * @param {string} name - metric name
   * @param {any} tags - labels
   * @returns {Counter} - created counter metric
   */
  createCounter(name, tags) {
    return new CounterPromWrapper(this._createMetric(this._promClient.Counter, name, tags))
  }

  /**
   * Create a gauge metric
   * @param {string} name - metric name
   * @param {any} tags - labels
   * @returns {Gauge} - created gauge metric
   */
  createGauge(name, tags) {
    return new GaugePromWrapper(this._createMetric(this._promClient.Gauge, name, tags))
  }
}