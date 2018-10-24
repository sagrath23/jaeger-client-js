import Utils from '../src/util'

describe('Utils class tests', () => {
  describe('getRandom64 function tests', () => {
    it('should return a Buffer object', () => {
      const result = Utils.getRandom64()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('startsWith function tests', () =>{
    it('should return true when a text starts with a prefix', () => {
      expect(Utils.startsWith('prefix-rest-of-the-string','prefix-')).toBeTruthy()
    })

    it('should return false when a text do not starts with a prefix', () => {
      expect(Utils.startsWith('rest-of-the-string','prefix-')).toBeFalsy()
    })
  })

  describe('endsWith function tests', () =>{
    it('should return true when a text ends with a prefix', () => {
      expect(Utils.endsWith('rest-of-the-string-suffix','-suffix')).toBeTruthy()
    })

    it('should return false when a text do not ends with a prefix', () => {
      expect(Utils.endsWith('rest-of-the-string','-suffix')).toBeFalsy()
    })
  })
})