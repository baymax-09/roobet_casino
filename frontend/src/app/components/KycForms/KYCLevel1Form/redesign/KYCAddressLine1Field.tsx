import { useDebounce } from 'react-use'
import React from 'react'
import {
  type FormikState,
  type FormikHelpers,
  type FormikHandlers,
} from 'formik'
import { useMutation } from '@apollo/client'
import {
  Autocomplete,
  TextField,
  ListItemText,
  InputLabel,
} from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { countries } from 'app/util/countries'
import {
  AddressLookupMutation,
  type AddressLookupResult,
  type AddressLookupInput,
  type DetailedAddressCandidate,
  type SummaryAddressCandidate,
} from 'app/gql/kyc'

import { type Level1FormValues } from '../constants'

interface KYCAddressLine1FieldProps {
  formik: FormikState<Level1FormValues> &
    FormikHelpers<Level1FormValues> &
    FormikHandlers
  submitting: boolean
}

// GQL Mutation is rate limited to 2/sec.
const DEBOUNCE_TIME_MS = 500

type AddressCandidate = DetailedAddressCandidate | SummaryAddressCandidate

const formatAddressCandidate = (candidate: AddressCandidate) => {
  if ('street' in candidate) {
    const { street, locality, administrative_area, postal_code } = candidate
    return `${street} ${locality}${
      administrative_area ? ` ${administrative_area}` : ''
    }${postal_code ? `, ${postal_code}` : ''}`
  }

  return candidate.address_text
}

interface SearchCriteria {
  searchTerm: string | null
  addressId: string | null
}

const renderAddressCandidate = (props, candidate: AddressCandidate) => {
  const formatted = formatAddressCandidate(candidate)
  return (
    <ListItemText {...props} key={formatted}>
      {formatted}
    </ListItemText>
  )
}

export const KYCAddressLine1Field: React.FC<KYCAddressLine1FieldProps> = ({
  formik,
  submitting,
}) => {
  const translate = useTranslate()

  // Apollo resets the data property when re-calling the mutation, which causes
  // content flashing. Store results ourselves to prevent this.
  const [results, setResults] = React.useState<AddressCandidate[]>([])
  // So we can keep autocomplete dropdown open while loading a refinement
  const [open, setOpen] = React.useState<boolean>(false)
  // So we can not show an autocomplete dropdown right after the user has selected an address
  const [searchCriteria, setSearchCriteria] = React.useState<SearchCriteria>({
    searchTerm: null,
    addressId: null,
  })

  /** Set all address fields when autocomplete option is selected. */
  const fillAddressFields = (result: DetailedAddressCandidate) => {
    formik.setValues(values => ({
      ...values,
      addressLine1: result.street,
      addressCity: result.locality,
      addressPostalCode: result.postal_code ?? '',
      addressState: result.administrative_area ?? '',
    }))
    setOpen(false)
    setSearchCriteria({ searchTerm: null, addressId: null })
  }

  const [fetchResults, { loading }] = useMutation<
    AddressLookupResult,
    AddressLookupInput
  >(AddressLookupMutation, {
    onCompleted: data => {
      if (data.addressLookup) {
        if (data.addressLookup.detailedCandidates.length > 0) {
          fillAddressFields(data.addressLookup.detailedCandidates[0])
          setResults([])
          setOpen(false)
        } else {
          const candidates: AddressCandidate[] =
            data.addressLookup.detailedCandidates
          const allCandidates = candidates.concat(
            data.addressLookup.summaryCandidates,
          )
          setResults(allCandidates)
        }
      }
    },
  })

  const lookupAddress = React.useCallback(() => {
    const country = countries.find(
      ({ code }) => code === formik.values.addressCountry,
    )

    const searchTerm = searchCriteria.searchTerm
    const addressId = searchCriteria.addressId
    if (!country || (!searchTerm && !addressId)) {
      setResults([])
      return
    }

    const countryCode = country.iso3
    fetchResults({
      variables: {
        data: {
          country: countryCode,
          search: searchTerm,
          addressId,
        },
      },
    })
  }, [
    searchCriteria.addressId,
    searchCriteria.searchTerm,
    formik.values.addressCountry,
    fetchResults,
  ])

  // Debounce Smarty request to every 500ms.
  useDebounce(
    () => {
      lookupAddress()
    },
    DEBOUNCE_TIME_MS,
    [lookupAddress],
  )

  return (
    <Autocomplete
      loading={loading}
      open={open}
      disableCloseOnSelect
      freeSolo
      fullWidth
      disableClearable
      options={results}
      getOptionLabel={() => formik.values.addressLine1}
      renderOption={renderAddressCandidate}
      value={formik.values.addressLine1}
      size="small"
      disabled={submitting || !formik.values.addressCountry}
      onInputChange={(_, value) => {
        formik.setFieldValue('addressLine1', value)
        setSearchCriteria(prev => ({ ...prev, searchTerm: value }))
      }}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={() => {
        setOpen(false)
      }}
      onChange={(_, addressCandidate) => {
        if (typeof addressCandidate === 'object') {
          if (addressCandidate.__typename === 'SummaryAddressResult') {
            setSearchCriteria({
              addressId: addressCandidate.address_id,
              searchTerm: null,
            })
            // set address line 1 field to new search text
            formik.setValues(values => ({
              ...values,
              addressLine1: addressCandidate.address_text,
            }))
            if (addressCandidate.entries === 1) {
              setOpen(false)
            }
          }
          setResults([])
        }
      }}
      // Do not do any client-side filtering.
      filterOptions={options => options}
      renderInput={props => (
        <>
          <InputLabel>{translate('kycLevel1Form.addressLine1')}</InputLabel>
          <TextField
            {...props}
            color="secondary"
            margin="none"
            required
            name="addressLine1"
            placeholder={translate('kycLevel1Form.addressLine1')}
            error={!!formik.errors.addressLine1}
            inputProps={{ ...props.inputProps, minLength: 2 }}
          />
          {/* TODO add bottom message here for `formik.errors.addressLine1` */}
        </>
      )}
    />
  )
}
