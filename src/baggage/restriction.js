/**
 * Restriction determines whether a baggage key is allowed and contains any
 * restrictions on the baggage value.
 */
export default class Restriction {
  _keyAllowed
  _maxValueLength

  constructor(keyAllowed, maxValueLength) {
    this._keyAllowed = keyAllowed
    this._maxValueLength = maxValueLength
  }

  get keyAllowed() {
    return this._keyAllowed
  }

  get maxValueLength() {
    return this._maxValueLength
  }
}