# Smarty

## International Address Autocomplete API V2

[Documentation](https://www.smarty.com/docs/cloud/international-address-autocomplete-api)

We search address via a search string from the user. We use this to fetch potential results.
Smarty initially returns "summary" results, each with an `address_id`. This `address_id` can be used to search further down that tree of addresses.
If you search by `address_id` on a "summary" result with 1 entry, it returns a "detailed" result.

When a users searches in the KYC form we eagerly retrieve detailed results for any "summary" results with 1 entry.
