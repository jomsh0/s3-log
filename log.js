// Don't log under testing/development conditions
if (location.protocol != 'file:'     &&
    location.hostname != 'localhost' &&
    location.search   != '?test')    // Fallback convention
{
    const url = new URL(`https://${bucket}.s3.${region}.amazonaws.com/${pixel}.gif`)
    if (document.referrer) { url.searchParams.set('r', document.referrer) }

    fetch(url, {                     // Opaque response is fine; prevent
        mode: 'no-cors'              //  console errors related to CORS
      , referrerPolicy: 'unsafe-url' // Track precise URL
      , cache: 'no-store'            // Never use cache
    }).catch(e => e)
}

