/**
 * Seon Account Details
 * These are not user accounts -- this is part of the Seon's API Response
 */
interface SeonBaseDetailAccount {
  registered: boolean
  about: string | null
  created_at: string | null
  first_name: string | null
  identity_verified: string | null
  location: string | null
  image: string | null
  reviewee_count: string | null
  trips: number | null
  work: string | null
  id: string | null
  photo: string | null
  url: string | null
  name: string | null
  company: string | null
  title: string | null
  website: string | null
  twitter: string | null
  country: string | null
  city: string | null
  /** 1 = Male; 2 = Female */
  gender: string | null
  age: string | null
  language: string | null
  state: string | null
  bio: string | null
  handle: string | null
  date_joined: string | null
  last_seen: string | null
}

type StandardAccount = Pick<SeonBaseDetailAccount, 'registered'>

interface SeonAccountDetails {
  airbnb: Pick<
    SeonBaseDetailAccount,
    | 'registered'
    | 'about'
    | 'created_at'
    | 'first_name'
    | 'identity_verified'
    | 'location'
    | 'image'
    | 'reviewee_count'
    | 'trips'
    | 'work'
  >
  facebook: Pick<SeonBaseDetailAccount, 'registered' | 'photo' | 'url' | 'name'>
  google: Pick<SeonBaseDetailAccount, 'registered' | 'photo'>
  ok: Pick<SeonBaseDetailAccount, 'registered' | 'city' | 'age' | 'date_joined'>
  skype: Pick<
    SeonBaseDetailAccount,
    | 'registered'
    | 'country'
    | 'city'
    | 'gender'
    | 'name'
    | 'id'
    | 'handle'
    | 'bio'
    | 'age'
    | 'language'
    | 'state'
    | 'photo'
  >
  linkedin: Pick<
    SeonBaseDetailAccount,
    | 'registered'
    | 'photo'
    | 'url'
    | 'name'
    | 'company'
    | 'title'
    | 'location'
    | 'website'
    | 'twitter'
  >
  line: Pick<SeonBaseDetailAccount, 'registered' | 'photo' | 'name'>
  telegram: Pick<SeonBaseDetailAccount, 'registered' | 'photo' | 'last_seen'>
  whatsapp: Pick<
    SeonBaseDetailAccount,
    'registered' | 'photo' | 'last_seen' | 'about'
  >
  viber: Pick<
    SeonBaseDetailAccount,
    'registered' | 'photo' | 'last_seen' | 'name'
  >

  apple: StandardAccount
  twitter: StandardAccount
  microsoft: StandardAccount
  yahoo: StandardAccount
  ebay: StandardAccount
  gravatar: StandardAccount
  instagram: StandardAccount
  spotify: StandardAccount
  tumblr: StandardAccount
  weibo: StandardAccount
  github: StandardAccount
  vimeo: StandardAccount
  flickr: StandardAccount
  foursquare: StandardAccount
  lastfm: StandardAccount
  myspace: StandardAccount
  pinterest: StandardAccount
  discord: StandardAccount
  kakao: StandardAccount
  booking: StandardAccount
  amazon: StandardAccount
  qzone: StandardAccount
  zalo: StandardAccount
  snapchat: StandardAccount
}

export type SeonEmailAccountDetails = Pick<
  SeonAccountDetails,
  | 'facebook'
  | 'google'
  | 'apple'
  | 'twitter'
  | 'microsoft'
  | 'yahoo'
  | 'ebay'
  | 'gravatar'
  | 'instagram'
  | 'spotify'
  | 'tumblr'
  | 'linkedin'
  | 'weibo'
  | 'github'
  | 'vimeo'
  | 'flickr'
  | 'foursquare'
  | 'lastfm'
  | 'myspace'
  | 'pinterest'
  | 'skype'
  | 'discord'
  | 'ok'
  | 'kakao'
  | 'booking'
  | 'airbnb'
  | 'amazon'
  | 'qzone'
>
export type SeonPhoneAccountDetails = Pick<
  SeonAccountDetails,
  | 'facebook'
  | 'google'
  | 'instagram'
  | 'twitter'
  | 'yahoo'
  | 'telegram'
  | 'whatsapp'
  | 'viber'
  | 'kakao'
  | 'ok'
  | 'zalo'
  | 'line'
  | 'microsoft'
  | 'snapchat'
  | 'skype'
>
