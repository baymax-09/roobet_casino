(async () => {
  // Parse the document and script `search` parameters
  const scriptUrl = new URL(document.querySelector('script[src*="/cx/p.js"]').src);
  const scriptSearch = scriptUrl.search;
  const searchDict = (() => {
    const search = `${document.location.search || ''}${
      scriptSearch && scriptSearch.length ? `&${scriptSearch.substring(1)}` : ''
    }`;
    if (search.length > 0) {
      const searchDictionary = new URLSearchParams(search.substring(1));
      for (const entry of searchDictionary) {
        searchDictionary[entry[0].toLowerCase()] = entry[1];
      }
      searchDictionary['roobet-framed'] = searchDictionary.has('roobet-framed');
      window.rootbetAffParams = searchDictionary;
    } else {
      window.rootbetAffParams = {};
    }
    window.rootbetAffParams['roobetHost'] = scriptUrl.host;
    return window.rootbetAffParams;
  })();

  const runOrDefer = async (func) => {
    if (window.document.readyState !== 'loading') {
      await func();
    } else {
      document.addEventListener('DOMContentLoaded', async () => {
        document.removeEventListener('DOMContentLoaded', func);
        await func();
      });
    }
  };

  const setCellxpertLocalStorage = (cxd, cxAffId, hostname) => {
    const now = Date.now();
    const expiry = new Date(now + 30 * 24 * 60 * 60 * 1000);
    const cellxpert = { cxd, cxAffId, expiry };
    try {
      // Set a cookie in case local storage is weird
      const secure = window.location.protocol === 'https:';
      const finalCookie = `cellxpert=${JSON.stringify(
        cellxpert
      )}; expires=${expiry.toUTCString()}; path=/; domain=.${hostname}; SameSite=None; ${secure ? 'Secure' : ''}`;
      document.cookie = finalCookie;
      // Set the local storage item
      localStorage.setItem('cellxpert', JSON.stringify(cellxpert));
    } catch (err) {
      console.log('Cellxpert: Failed to set local storage', err);
    }
  };

  if (searchDict && searchDict['cxd'] && searchDict['affid'] && !searchDict['roobet-framed']) {
    await runOrDefer(async () => {
      const iframe = document.createElement('iframe');
      iframe.src = `//${searchDict['roobetHost']}/cx/p.html?cxd=${searchDict['cxd']}&affId=${searchDict['affid']}`;
      iframe.width = 0;
      iframe.height = 0;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    });
  } else if (searchDict && searchDict['cxd'] && searchDict['affid']) {
    await runOrDefer(async () => {
      setCellxpertLocalStorage(searchDict['cxd'], searchDict['affid'], searchDict['roobetHost']);
    });
  }
})();
