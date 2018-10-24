import xorshift from 'xorshift'

export default class Utils {
  /**
 * Determines whether a string contains a given prefix.
 *
 * @param {string} text - the string for to search for a prefix
 * @param {string} prefix - the prefix to search for in the text given.
 * @return {boolean} - boolean representing whether or not the
 * string contains the prefix.
 **/
  static startsWith(text, prefix) {
    return text.indexOf(prefix) === 0
  }

  /**
   * Determines whether a string contains a given suffix.
   *
   * @param {string} text - the string for to search for a suffix
   * @param {string} suffix - the suffix to search for in the text given.
   * @return {boolean} - boolean representing whether or not the
   * string contains the suffix.
   **/
  static endsWith(text, suffix) {
    return text.lastIndexOf(suffix) === text.length - suffix.length
  }

  /**
   * Generate a Buffer that represents a random 64 bit number.
   *
   * @return {Buffer}  - returns a buffer representing a random 64 bit
   * number.
   **/
  static getRandom64() {
    const randint = xorshift.randomint()
    const buff = new Buffer(8)

    buff.writeUInt32BE(randint[0], 0)
    buff.writeUInt32BE(randint[1], 4)

    return buff
  }

  /**
   * Encode a number in base64
   * 
   * @param {string|number} numberValue - a string or number to be encoded
   * as a 64 bit byte array.
   * @return {Buffer} - returns a buffer representing the encoded string, or number.
   **/
  static encodeInt64(numberValue) {
    return new Int64(numberValue).toBuffer();
  }

   /**
   * Convert an IP address into a int 
   * @param {string} ip - a string representation of an ip address.
   * @return {number} - a 32-bit number where each byte represents an
   * octect of an ip address.
   **/
  static ipToInt(ip) {
    let ipl = 0;
    let parts = ip.split('.');
    if (parts.length != 4) {
      return null;
    }

    for (let i = 0; i < parts.length; i++) {
      ipl <<= 8;
      ipl += parseInt(parts[i], 10);
    }

    let signedLimit = 0x7fffffff;
    if (ipl > signedLimit) {
      return (1 << 32) - ipl;
    }
    return ipl;
  }
}