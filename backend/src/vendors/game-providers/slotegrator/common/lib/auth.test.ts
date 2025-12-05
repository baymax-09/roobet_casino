import { httpBuildQuery } from './auth'

describe('slotegrator auth helpers', () => {
  it('can truncate floats with really high precision', () => {
    const input = httpBuildQuery({
      timestamp: 1668012888.30159,
    })

    const output = 'timestamp=1668012888.3016'

    expect(input).toEqual(output)
  })

  it('can truncate floats with high precision', () => {
    const input = httpBuildQuery({
      timestamp: 1668012888.1254,
    })

    const output = 'timestamp=1668012888.1254'

    expect(input).toEqual(output)
  })

  it('can not truncate floats with low precision', () => {
    const input = httpBuildQuery({
      timestamp: 1668012888.1254,
    })

    const output = 'timestamp=1668012888.1254'

    expect(input).toEqual(output)
  })

  it('can not truncate float string with high precision', () => {
    const input = httpBuildQuery({
      timestamp: '1668012888.12387821',
    })

    const output = 'timestamp=1668012888.12387821'

    expect(input).toEqual(output)
  })

  it('encode ampersand signs', () => {
    const input = httpBuildQuery({
      category: 'Soccer & Football',
    })

    const output = 'category=Soccer+%26+Football'

    expect(input).toEqual(output)
  })

  it('encode boolean true as 1', () => {
    const input = httpBuildQuery({
      category: true,
    })

    const output = 'category=1'

    expect(input).toEqual(output)
  })

  it('encode string boolean true as 1', () => {
    const input = httpBuildQuery({
      category: 'true',
    })

    const output = 'category=1'

    expect(input).toEqual(output)
  })

  it('encode boolean false as 0', () => {
    const input = httpBuildQuery({
      category: false,
    })

    const output = 'category=0'

    expect(input).toEqual(output)
  })

  it('encode string boolean false as 0', () => {
    const input = httpBuildQuery({
      category: 'false',
    })

    const output = 'category=0'

    expect(input).toEqual(output)
  })

  it('encode spaces as +', () => {
    const input = httpBuildQuery({
      category: 'Sports and Stuff',
    })

    const output = 'category=Sports+and+Stuff'

    expect(input).toEqual(output)
  })

  it('encode single quote', () => {
    const input = httpBuildQuery({
      category: "Sports 'n' Stuff",
    })

    const output = 'category=Sports+%27n%27+Stuff'

    expect(input).toEqual(output)
  })

  it('encode left and right parens', () => {
    const input = httpBuildQuery({
      category: 'Soccer (football)',
    })

    const output = 'category=Soccer+%28football%29'

    expect(input).toEqual(output)
  })

  it('build a complex querystring from a nested object', () => {
    const input = httpBuildQuery({
      amount: 7,
      currency: 'EUR',
      sportsbook_uuid: 'd595248f-75ff-454b-8d6d-e6a232dff199',
      player_id: 'd8184d4f-c47c-4229-813a-0e4ac42d8bd8',
      session_id: 'fc331791b68a445632ac9c1d49f5f475',
      betslip_id: '636bdb58-7eeb-1d08-3d6b-800020000007',
      betslip: {
        uuid: '636bdb58-7eeb-1d08-3d6b-800020000007',
        provider_betslip_id: '2202129259915514141',
        status: 'open',
        amount: 7,
        currency: 'EUR',
        items: [
          {
            uuid: '636bdb58-7f50-1df9-30e1-800030000007',
            event_id: '2201358171908476936',
            parameters: {
              sport_id: '1',
              tournament_id: '1666080270903808000',
              category_id: '1666080270807339008',
              is_live: false,
              sport_name: 'Soccer',
              category_name: 'International Clubs',
              tournament_name: 'UEFA Champions League',
              competitor_name: ['Club Brugge', 'Benfica Lisbon'],
              market_name: 'Both teams to score',
              outcome_name: 'no',
              scheduled: 1676491200,
              odds: '2.13',
            },
          },
          {
            uuid: '636bdb58-7f5f-1d25-38a2-800030000007',
            event_id: '2201358171908476937',
            parameters: {
              sport_id: '1',
              tournament_id: '1666080270903808000',
              category_id: '1666080270807339008',
              is_live: false,
              sport_name: 'Soccer',
              category_name: 'International Clubs',
              tournament_name: 'UEFA Champions League',
              competitor_name: ['Eintracht Frankfurt', 'SSC Napoli'],
              market_name: 'Both teams to score',
              outcome_name: 'no',
              scheduled: 1677009600,
              odds: '2.26',
            },
          },
          {
            uuid: '636bdb58-7f68-1d6a-39d5-800030000007',
            event_id: '2201358171908476939',
            parameters: {
              sport_id: '1',
              tournament_id: '1666080270903808000',
              category_id: '1666080270807339008',
              is_live: false,
              sport_name: 'Soccer',
              category_name: 'International Clubs',
              tournament_name: 'UEFA Champions League',
              competitor_name: ['Liverpool FC', 'Real Madrid'],
              market_name: 'Total',
              outcome_name: 'under 2.5',
              scheduled: 1677009600,
              odds: '2.15',
            },
          },
        ],
        parameters: {
          timestamp: 1668012888.301,
          type: '3/3',
          total_odds: '10.34967',
          is_quick_bet: false,
          potential_win: 72.45,
          potential_comboboost_win: 0,
        },
      },
      transaction_id: '636bdb58-7f8c-1d64-394d-800010000007',
      action: 'bet',
    })

    const output = `amount=7
      &currency=EUR
      &sportsbook_uuid=d595248f-75ff-454b-8d6d-e6a232dff199
      &player_id=d8184d4f-c47c-4229-813a-0e4ac42d8bd8
      &session_id=fc331791b68a445632ac9c1d49f5f475
      &betslip_id=636bdb58-7eeb-1d08-3d6b-800020000007
      &betslip%5Buuid%5D=636bdb58-7eeb-1d08-3d6b-800020000007
      &betslip%5Bprovider_betslip_id%5D=2202129259915514141
      &betslip%5Bstatus%5D=open&betslip%5Bamount%5D=7
      &betslip%5Bcurrency%5D=EUR
      &betslip%5Bitems%5D%5B0%5D%5Buuid%5D=636bdb58-7f50-1df9-30e1-800030000007
      &betslip%5Bitems%5D%5B0%5D%5Bevent_id%5D=2201358171908476936
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bsport_id%5D=1
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Btournament_id%5D=1666080270903808000&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bcategory_id%5D=1666080270807339008&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bis_live%5D=0
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bsport_name%5D=Soccer
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bcategory_name%5D=International+Clubs
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Btournament_name%5D=UEFA+Champions+League&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B0%5D=Club+Brugge&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B1%5D=Benfica+Lisbon&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bmarket_name%5D=Both+teams+to+score&betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Boutcome_name%5D=no
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bscheduled%5D=1676491200
      &betslip%5Bitems%5D%5B0%5D%5Bparameters%5D%5Bodds%5D=2.13
      &betslip%5Bitems%5D%5B1%5D%5Buuid%5D=636bdb58-7f5f-1d25-38a2-800030000007
      &betslip%5Bitems%5D%5B1%5D%5Bevent_id%5D=2201358171908476937
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bsport_id%5D=1
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Btournament_id%5D=1666080270903808000&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bcategory_id%5D=1666080270807339008
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bis_live%5D=0
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bsport_name%5D=Soccer
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bcategory_name%5D=International+Clubs&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Btournament_name%5D=UEFA+Champions+League&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B0%5D=Eintracht+Frankfurt&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B1%5D=SSC+Napoli&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bmarket_name%5D=Both+teams+to+score&betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Boutcome_name%5D=no
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bscheduled%5D=1677009600
      &betslip%5Bitems%5D%5B1%5D%5Bparameters%5D%5Bodds%5D=2.26
      &betslip%5Bitems%5D%5B2%5D%5Buuid%5D=636bdb58-7f68-1d6a-39d5-800030000007
      &betslip%5Bitems%5D%5B2%5D%5Bevent_id%5D=2201358171908476939
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bsport_id%5D=1
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Btournament_id%5D=1666080270903808000
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bcategory_id%5D=1666080270807339008
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bis_live%5D=0
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bsport_name%5D=Soccer
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bcategory_name%5D=International+Clubs
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Btournament_name%5D=UEFA+Champions+League
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B0%5D=Liverpool+FC
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bcompetitor_name%5D%5B1%5D=Real+Madrid
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bmarket_name%5D=Total
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Boutcome_name%5D=under+2.5
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bscheduled%5D=1677009600
      &betslip%5Bitems%5D%5B2%5D%5Bparameters%5D%5Bodds%5D=2.15
      &betslip%5Bparameters%5D%5Btimestamp%5D=1668012888.301
      &betslip%5Bparameters%5D%5Btype%5D=3%2F3
      &betslip%5Bparameters%5D%5Btotal_odds%5D=10.34967
      &betslip%5Bparameters%5D%5Bis_quick_bet%5D=0
      &betslip%5Bparameters%5D%5Bpotential_win%5D=72.45
      &betslip%5Bparameters%5D%5Bpotential_comboboost_win%5D=0&transaction_id=636bdb58-7f8c-1d64-394d-800010000007&action=bet
    `
      .replace(/\s+/g, '')
      .replace(/\n+/g, '')

    expect(input).toEqual(output)
  })
})
