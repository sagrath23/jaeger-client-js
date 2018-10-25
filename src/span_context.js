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

  get isValid() {
    return !!((this._traceId || this._traceIdStr) && (this._spanId || this._spanIdStr));
  }

  finalizeSampling() {
    this._samplingFinalized = true;
  }

  isDebugIDContainerOnly() {
    return !this.isValid && this._debugId !== '';
  }

  /**
   * @return {boolean} - returns whether or not this span context was sampled.
   **/
  isSampled() {
    return (this.flags & constants.SAMPLED_MASK) === constants.SAMPLED_MASK;
  }

  /**
   * @return {boolean} - returns whether or not this span context has a debug flag set.
   **/
  isDebug() {
    return (this.flags & constants.DEBUG_MASK) === constants.DEBUG_MASK;
  }

  withBaggageItem(key, value) {
    let newBaggage = Utils.clone(this._baggage);
    newBaggage[key] = value;
    return new SpanContext(
      this._traceId,
      this._spanId,
      this._parentId,
      this._traceIdStr,
      this._spanIdStr,
      this._parentIdStr,
      this._flags,
      newBaggage,
      this._debugId,
      this._samplingFinalized
    );
  }

  /**
   * @return {string} - returns a string version of this span context.
   **/
  toString() {
    return [this.traceIdStr, this.spanIdStr, this.parentIdStr || '0', this._flags.toString(16)].join(':');
  }

  /**
   * @param {string} serializedString - a serialized span context.
   * @return {SpanContext} - returns a span context represented by the serializedString.
   **/
  static fromString(serializedString) {
    let headers = serializedString.split(':');
    if (headers.length !== 4) {
      return null;
    }

    // Note: Number type in JS cannot represent the full range of 64bit unsigned ints,
    // so using parseInt() on strings representing 64bit hex numbers only returns
    // an approximation of the actual value. Fortunately, we do not depend on the
    // returned value, we are only using it to validate that the string is
    // a valid hex number (which is faster than doing it manually).  We cannot use
    // Int64(numberValue).toBuffer() because it throws exceptions on bad strings.
    let approxTraceId = parseInt(headers[0], 16);
    let NaNDetected =
      isNaN(approxTraceId) ||
      approxTraceId === 0 ||
      isNaN(parseInt(headers[1], 16)) ||
      isNaN(parseInt(headers[2], 16)) ||
      isNaN(parseInt(headers[3], 16));

    if (NaNDetected) {
      return null;
    }

    let parentId = null;
    if (headers[2] !== '0') {
      parentId = headers[2];
    }

    return SpanContext.withStringIds(headers[0], headers[1], parentId, parseInt(headers[3], 16));
  }

  static withBinaryIds(
    traceId,
    spanId,
    parentId,
    flags,
    baggage = {},
    debugId = ''
  ) {
    return new SpanContext(
      traceId,
      spanId,
      parentId,
      null, // traceIdStr: string,
      null, // spanIdStr: string,
      null, // parentIdStr: string,
      flags,
      baggage,
      debugId
    );
  }

  static withStringIds(
    traceIdStr,
    spanIdStr,
    parentIdStr,
    flags,
    baggage = {},
    debugId = ''
  ) {
    return new SpanContext(
      null, // traceId,
      null, // spanId,
      null, // parentId,
      traceIdStr,
      spanIdStr,
      parentIdStr,
      flags,
      baggage,
      debugId
    );
  }
}
