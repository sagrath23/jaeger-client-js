import Restriction from './restriction'

export const DEFAULT_MAX_VALUE_LENGTH = 2048;

/**
 * Creates a BaggageRestrictionManager that allows any baggage key.
 */
export default class DefaultBaggageRestrictionManager {
  _restriction

  constructor(maxValueLength) {
    let length = maxValueLength || DEFAULT_MAX_VALUE_LENGTH
    this._restriction = new Restriction(true, length)
  }

  getRestriction(service, key) {
    return this._restriction;
  }
}