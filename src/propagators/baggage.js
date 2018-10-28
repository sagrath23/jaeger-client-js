/**
 * Parses a comma separated key=value pair list and add the results to `baggage`.
 * E.g. "key1=value1, key2=value2, key3=value3"
 * is converted to map[string]string { "key1" : "value1",
 *                                     "key2" : "value2",
 *                                     "key3" : "value3" }
 *
 * @param {any} baggage- the object container to accept the parsed key=value pairs
 * @param {string} values - the string value containing any key=value pairs
 * to parse
 */
export function parseCommaSeparatedBaggage(baggage, values) {
  values.split(',').forEach((keyVal) => {
    let splitKeyVal = keyVal.trim().split('=')
    if (splitKeyVal.length == 2) {
      baggage[splitKeyVal[0]] = splitKeyVal[1]
    }
  })
}
