import { createSoftswissId, parseSoftswissId } from './currencies'
import { v4 as uuidv4 } from 'uuid'

describe('module/game-providers/softswiss/lib/util', function () {
  describe('#createSoftswissId', function () {
    const UIDarray = [uuidv4(), uuidv4(), uuidv4(), uuidv4()]
    const simpleTestCases = [
      {
        desc: 'should return a valid SoftswissID',
        args: [UIDarray[0], 'btc'],
        expected: `${UIDarray[0]}_BTC`,
      },
      {
        desc: 'should return a valid SoftswissID',
        args: [UIDarray[1], 'usd'],
        expected: `${UIDarray[1]}_USD`,
      },
      {
        desc: 'should return a valid SoftswissID',
        args: [UIDarray[2], 'jpy'],
        expected: `${UIDarray[2]}_JPY`,
      },
      {
        desc: 'should return a valid SoftswissID',
        args: [UIDarray[3], 'ltc'],
        expected: `${UIDarray[3]}_LTC`,
      },
    ]
    it.each(simpleTestCases)('$desc', function ({ args, expected }) {
      expect(createSoftswissId(args[0], args[1])).toBe(expected)
    })
  })

  describe('#parseSoftswissId', function () {
    const SoftswissIdArray = [
      createSoftswissId(uuidv4(), 'btc'),
      createSoftswissId(uuidv4(), 'usd'),
      createSoftswissId(uuidv4(), 'jpy'),
      createSoftswissId(uuidv4(), 'ltc'),
    ]
    const simpleTestCases = [
      {
        desc: 'should return a valid UserID',
        args: [SoftswissIdArray[0]],
        expected: SoftswissIdArray[0].split('_')[0],
      },
      {
        desc: 'should return a valid UserID',
        args: [SoftswissIdArray[1]],
        expected: SoftswissIdArray[1].split('_')[0],
      },
      {
        desc: 'should return a valid UserID',
        args: [SoftswissIdArray[2]],
        expected: SoftswissIdArray[2].split('_')[0],
      },
      {
        desc: 'should return a valid UserID',
        args: [SoftswissIdArray[3]],
        expected: SoftswissIdArray[3].split('_')[0],
      },
    ]
    it.each(simpleTestCases)('$desc', function ({ args, expected }) {
      expect(parseSoftswissId(args[0])).toEqual(expected)
    })
  })
})
