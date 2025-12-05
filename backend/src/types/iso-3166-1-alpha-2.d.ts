declare module 'iso-3166-1-alpha-2' {
  // Lookup country by code.
  export function getCountry(code: string): string

  // Lookup code by country.
  export function getCode(country: string): string

  // Get array of all country codes (["AF","AX","AL",...]).
  export function getCodes(): string[]

  // Get array of all country names (["Afghanistan","Åland Islands","Albania",...]).
  export function getCountries(): string[]

  // Get Object with code (key) to country (value) mappings ({ "AF" : "Afghanistan", .... }).
  export function getData(): Record<string, string>
}
