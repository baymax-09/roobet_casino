import {
  buildGroup,
  seedToBytes,
  bytesToNumbers,
  shuffleGroup,
} from './shuffle'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/game/lib/shuffle', function () {
  describe('#buildGroup', function () {
    it('converts a string to an array of numbers', function () {
      const seed = 'dynamoMonkey'
      const groupSize = 25
      const result = buildGroup(groupSize, seed)
      expect(result).toStrictEqual([
        19, 18, 16, 4, 6, 13, 22, 8, 2, 0, 12, 5, 15, 11, 23, 17, 21, 24, 14,
        10, 20, 9, 1, 7, 3,
      ])
    })
  })

  describe('#seedToBytes', function () {
    it('converts a hash string to an array of numbers', function () {
      const hash =
        'd2fb78101357d92a938ea5ef9bb2328aa84e00e6c4b7c0f24df1eaed64aa2a4d'
      const expected = [
        210, 251, 120, 16, 19, 87, 217, 42, 147, 142, 165, 239, 155, 178, 50,
        138, 168, 78, 0, 230, 196, 183, 192, 242, 77, 241, 234, 237, 100, 170,
        42, 77,
      ]
      const result = seedToBytes(hash)
      expect(result).toEqual(expected)
    })
  })

  describe('#bytesToNumbers', function () {
    it('converts an arry of numbers to an array of numbers a fourth of the length', function () {
      const byteArr = [
        210, 251, 120, 16, 19, 87, 217, 42, 147, 142, 165, 239, 155, 178, 50,
        138, 168, 78, 0, 230, 196, 183, 192, 242, 77, 241, 234, 237, 100, 170,
        42, 77,
      ]
      const expected = [
        0.8241496123373508, 0.0755592086352408, 0.5763953884597868,
        0.6081878268159926, 0.657440239097923, 0.7684288588352501,
        0.3044726208318025, 0.3932215154636651,
      ]
      const result = bytesToNumbers(byteArr, 256)
      expect(result).toEqual(expected)
    })
  })

  describe('#shuffleGroup', function () {
    it('shuffles group', function () {
      const randomNumbers = [
        0.8241496123373508, 0.0755592086352408, 0.5763953884597868,
        0.6081878268159926, 0.657440239097923, 0.7684288588352501,
        0.3044726208318025, 0.3932215154636651, 0.16810891893692315,
        0.03460179385729134, 0.5833790905307978, 0.4457463000435382,
        0.14334643981419504, 0.8733642590232193, 0.09722381201572716,
        0.1969863618724048, 0.43125984841026366, 0.5473855379968882,
        0.9525688895955682, 0.4338742217514664, 0.6747577874921262,
        0.5656280759721994, 0.9937879119534045, 0.10116001684218645,
      ]
      const expected = [
        9, 19, 17, 18, 14, 16, 24, 4, 3, 11, 12, 10, 23, 6, 8, 0, 2, 7, 5, 15,
        21, 22, 13, 1, 20,
      ]
      const result = shuffleGroup(randomNumbers, 25)
      expect(result).toEqual(expected)
    })
  })
})
