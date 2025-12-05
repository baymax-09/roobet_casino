import { indexBy, mapObjectToTypes, sortBy } from './array'

const nestedObj = {
  col1: { name: 'objA' },
  col2: { name: 'objB' },
  col3: { name: 'objC' },
}

describe('indexBy', () => {
  it('can re-index an object by the value of the key argument', () => {
    expect(indexBy(nestedObj, 'name')).toMatchObject({
      objA: { name: 'objA' },
      objB: { name: 'objB' },
      objC: { name: 'objC' },
    })
  })
})

describe('mapObjectToTypes', () => {
  it('can map an object to a pseudo-interface based on type attrs', () => {
    expect(
      mapObjectToTypes({
        attrA: { type: 'string' },
        attrB: { type: 'number' },
        attrC: { type: 'boolean' },
      }),
    ).toMatchObject({
      attrA: 'string',
      attrB: 'number',
      attrC: 'boolean',
    })
  })
  it('will interpret unspecified types as strings', () => {
    expect(mapObjectToTypes(nestedObj)).toMatchObject({
      col1: 'string',
      col2: 'string',
      col3: 'string',
    })
  })
})

describe('sortBy', () => {
  it('will return a sort function', () => {
    expect(sortBy('name')).toBeInstanceOf(Function)
  })
  it('can be used to sort a list by key', () => {
    const [obj1, obj2, obj3] = [
      { name: 'Foo', type: 'string' },
      { name: 'Bar', type: 'number' },
      { name: 'Fizz', type: 'Buzz' },
    ]
    expect([obj1, obj2, obj3].sort(sortBy('name'))).toStrictEqual([
      obj2,
      obj3,
      obj1,
    ])
    expect([obj1, obj1, obj2].sort(sortBy('name'))).toStrictEqual([
      obj2,
      obj1,
      obj1,
    ])
    expect([obj1, obj2, obj3].sort(sortBy('type'))).toStrictEqual([
      obj3,
      obj2,
      obj1,
    ])
  })
})
