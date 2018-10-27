import opentracing from 'opentracing'
import Span from './span'
import Utils from './util'

export default class TestUtils {
  static hasTags(span, expectedTags) {
    // TODO(oibe) make this work for duplicate tags
    let actualTags = {}
    for (let i = 0; i < span._tags.length; i++) {
      let key = span._tags[i].key
      actualTags[key] = span._tags[i].value
    }

    for (let tag in expectedTags) {
      if (expectedTags.hasOwnProperty(tag) && actualTags.hasOwnProperty(tag)) {
        if (actualTags[tag] !== expectedTags[tag]) {
          console.log('expected tag:', expectedTags[tag], ', actual tag: ', actualTags[tag])
          return false
        }
      } else {
        // mismatch in tag keys
        return false
      }
    }

    return true
  }

  /**
   * Returns tags stored in the span. If tags with the same key are present,
   * only the last tag is returned.
   * @param {Object} span - span from which to read the tags.
   * @param {Array} [keys] - if specified, only tags with these keys are returned.
   */
  static getTags(span, keys) {
    let actualTags = {}
    for (let i = 0; i < span._tags.length; i++) {
      let key = span._tags[i].key
      actualTags[key] = span._tags[i].value
    }
    if (keys) {
      let filteredTags = {}
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        if (actualTags.hasOwnProperty(key)) {
          filteredTags[key] = actualTags[key]
        }
      }
      return filteredTags
    }
    return actualTags
  }
}