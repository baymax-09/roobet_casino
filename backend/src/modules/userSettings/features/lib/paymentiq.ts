import { permittedCountries } from 'src/vendors/paymentiq'

export const isUserGrantedPaymentiq = async (countryCode: string) => {
  return permittedCountries.includes(countryCode)
}
