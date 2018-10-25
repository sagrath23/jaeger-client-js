export default class DefaultContext {
  _span

  setSpan(span) {
    this._span = span
  }

  getSpan() {
    return this._span
  }
}