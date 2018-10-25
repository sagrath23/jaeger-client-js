import * as constants from './constants'
import Utils from './util'

export default class SpanContext {
  _traceId;
  _spanId;
  _parentId;
  _traceIdStr;
  _spanIdStr;
  _parentIdStr;
  _flags;
  _baggage;
  _debugId;

  /**
   * This field exists to help distinguish between when a span can have a properly
   * correlated operation name -> sampling rate mapping, and when it cannot.
   * Adaptive sampling uses the operation name of a span to correlate it with
   * a sampling rate.  If an operation name is set on a span after the span's creation
   * then adaptive sampling cannot associate the operation name with the proper sampling rate.
   * In order to correct this we allow a span to be written to, so that we can re-sample
   * it in the case that an operation name is set after span creation. Situations
   * where a span context's sampling decision is finalized include:
   * - it has inherited the sampling decision from its parent
   * - its debug flag is set via the sampling.priority tag
   * - it is finish()-ed
   * - setOperationName is called
   * - it is used as a parent for another span
   * - its context is serialized using injectors
   * */
  _samplingFinalized;

  constructor(
    traceId,
    spanId,
    parentId,
    traceIdStr,
    spanIdStr,
    parentIdStr,
    flags = 0,
    baggage = {},
    debugId = '',
    samplingFinalized = false
  ) {
    this._traceId = traceId;
    this._spanId = spanId;
    this._parentId = parentId;
    this._traceIdStr = traceIdStr;
    this._spanIdStr = spanIdStr;
    this._parentIdStr = parentIdStr;
    this._flags = flags;
    this._baggage = baggage;
    this._debugId = debugId;
    this._samplingFinalized = samplingFinalized;
  }

  get traceId() {
    return this._traceId;
  }
  set traceId(value) {
    this._traceId = value;
  }

  get spanId() {
    return this._spanId;
  }
  set spanId(value) {
    this._spanId = value;
  }

  get parentId() {
    return this._parentId;
  }
  set parentId(value) {
    this._parentId = value;
  }

  get traceIdStr() {
    return this._traceIdStr;
  }

  set traceIdStr(value) {
    this._traceIdStr = value;
  }

  get spanIdStr() {
    return this._spanIdStr;
  }

  set spanIdStr(value) {
    this._spanIdStr = value;
  }
  
  get parentIdStr() {
    return this._parentIdStr;
  }
  
  set parentIdStr(value) {
    this._parentIdStr = value;
  }
  
  get flags() {
    return this._flags;
  }
  
  set flags(value) {
    this._flags = value;
  }
  
  get baggage() {
    return this._baggage;
  }
  
  set baggage(value) {
    this._baggage = value;
  }
  
  get debugId() {
    return this._debugId;
  }
  
  set debugId(value) {
    this._debugId = value;
  }
}
