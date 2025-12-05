/** Temporary for my sanity while migrating overrides. */
export const humanReadableProvider = (providerInternal: string) => {
  const providerInternalToProviderMap = new Map(
    Object.entries({
      bgaming: 'BGaming',
      bigtimegaming: 'Big Time Gaming',
      pushgaming: 'Push Gaming',
      yggdrasil: 'Yggdrasil',
      nolimit: 'Nolimit City',
      mascot: 'Mascot Gaming',
      evolution: 'Evolution',
      bsg: 'Betsoft',
      playson: 'Playson',
      gamingcorps: 'Gaming Corps',
      spinza: 'Spinza',
      spinomenal: 'Spinomenal',
      wazdan: 'Wazdan',
      gamzix: 'Gamzix',
      popiplay: 'Popiplay',
      truelab: 'Truelab',
      vibragaming: 'Vibra Gaming',
      printstudios: 'Print Studios',
      bluegurugames: 'Blue Guru Games',
      fourleafgaming: 'Four Leaf Gaming',
      fantasma: 'Fantasma',
      electricelephant: 'Electric Elephant',
      quickspin: 'Quickspin',
      // TODO AS-344 Hub88 also has SpinPlay but the "provider" is "PGSoft" whereas for Softswiss it is "pgsoft"
      pgsoft: 'PG Soft',
      netent: 'Netent',
      relax: 'Relax',
      thunderkick: 'Thunderkick',
      elk: 'Elk',
      reelplay: 'Reelplay',
      igrosoft: 'Igrosoft',
      bet2tech: 'Bet2tech',
      avatarux: 'Avatarux',
      amatic: 'Amatic',
      retrogaming: 'Retrogaming',
      // TODO AS-344 Hub88 also has SpinPlay but the "provider" is "SpinPlay Games" whereas for Softswiss it is "spinplay"
      spinplay: 'SpinPlay Games',
      alchemygaming: 'Alchemy Gaming',
      backseatgaming: 'Backseat Gaming',
      switchstudios: 'Switch Studios',
      jftw: 'Just For The Win',
      neonvalley: 'Neon Valley Studios',
      stormcraft: 'Stormcraft',
      // TODO AS-344 Hub88 also has Slingshot but the "provider" is "Slingshot" whereas for Softswiss it is "slingshot"
      slingshot: 'Slingshot Studios',
      redtiger: 'Red Tiger',
    }),
  )

  return providerInternalToProviderMap.get(providerInternal) ?? providerInternal
}
