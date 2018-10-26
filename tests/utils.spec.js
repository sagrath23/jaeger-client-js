import Utils from '../src/util'

describe('Utils class tests', () => {
  describe('getRandom64 function tests', () => {
    it('should return a Buffer object', () => {
      const result = Utils.getRandom64()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('startsWith function tests', () => {
    it('should return true when a text starts with a prefix', () => {
      expect(Utils.startsWith('prefix-rest-of-the-string', 'prefix-')).toBeTruthy()
    })

    it('should return false when a text do not starts with a prefix', () => {
      expect(Utils.startsWith('rest-of-the-string', 'prefix-')).toBeFalsy()
    })
  })

  describe('endsWith function tests', () => {
    it('should return true when a text ends with a prefix', () => {
      expect(Utils.endsWith('rest-of-the-string-suffix', '-suffix')).toBeTruthy()
    })

    it('should return false when a text do not ends with a prefix', () => {
      expect(Utils.endsWith('rest-of-the-string', '-suffix')).toBeFalsy()
    })
  })

  describe('ipToInt function tests', () => {
    it('should convert malformed IP to null', () => {
      expect(Utils.ipToInt('127.0')).toBeNull()
    })

    it('should convert an ip less than 2^32 to an unsigned number', () => {
      expect(Utils.ipToInt('127.0.0.1')).toEqual((127 << 24) | 1)
    })

    it('should convert an ip greater than 2^32 to a negative number', () => {
      expect(Utils.ipToInt('255.255.255.255')).toEqual(-1)
    })
  })


  describe('removeLeadingZeros function tests', () => {
    it('should leave single 0 digit intact', () => {
      expect(Utils.removeLeadingZeros('0')).toEqual('0')
    })

    it('should leave single non-0 digit intact', () => {
      expect(Utils.removeLeadingZeros('1')).toEqual('1')
    })

    it('should strip leading zeros', () => {
      expect(Utils.removeLeadingZeros('0001')).toEqual('1')
    })

    it('should convert all zeros to a single 0', () => {
      expect(Utils.removeLeadingZeros('0000')).toEqual('0')
    })
  })
})
