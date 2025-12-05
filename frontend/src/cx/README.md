# CellXpert Tracking Pixel

## Usage

To use this tracking script, include the following async script tag in the `<head>` of your page:

```html
<script async src="//roobet.com/cx/p.js"></script>
```

_Note: You may need to adjust the host portion of the URL based on your environment._

## Implementation

The CellXpert tracking pixel is implemented as a script that can be included via GTM (Google Tag Manager), or traditional inclusion methods.

### The `p.js` file

The scripts file `p.js` looks for query parameters `cxAffId` and `cxd`. If they are present, the script creates a hidden `iframe` that loads `p.html`.

#### Self Reuse

The `p.html` file also sources the `p.js` to reuse the URL search parsing. This is done by `p.html` passing a `roobet-framed` query parameter to `p.js`. If `roobet-framed` is present and truthy, `p.js` will not create the `iframe`. The query parser assigns a `true` value to any key without an explicit value.

### The `p.html` file

When rendered with `cxAffId` and `cxd` in the query parameters, uses the `setCellxpertLocalStorage` function to store the values in local storage

### The `test.htm` file

This is a special test file that simulates the end use case. It includes the `p.js` script, and passes the query parameters `cxAffId` and `cxd` to the script. To load this file, use something like a [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

_THIS FILE IS NEITHER BUNDLED NOR DEPLOYED!!_

## Original Request

The original request came thru [PD-3047](https://roobetapp.atlassian.net/browse/PD-3047) from Chris Kanze, and contained the following:

> We need a hosted script (js file) that does the following:
>
> - If cxAffId & cxd are in the query parameters
>
>   - Render a hidden iframe (For example: .com/cxp.html?cxAffId=example123&cxd=example123)
>   - cxp.html:
>
>     - Stores the cxd + cxAffId inside local storage of .com for 30 days
>
>       - Use the existing setCellxpertLocalStorage (cellxpert.ts in FE Repo)
>
> When a player comes to .com now with these query params we already save them in local storage for 30 days. When a player comes back within 30 days and signs up, the parameters get attributed to the account. Creating this new tracking pixel will enable us to do the same cross-domain.
