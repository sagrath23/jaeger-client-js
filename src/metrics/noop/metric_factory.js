import NoopCounter from './counter'
import NoopTimer from './timer'
import NoopGauge from './gauge'

export default class NoopMetricFactory {
  createCounter(name, tags) {
    return new NoopCounter()
  }

  createTimer(name, tags) {
    return new NoopTimer()
  }

  createGauge(name, tags) {
    return new NoopGauge()
  }
}