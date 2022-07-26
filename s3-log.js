////
///   PARAMETERS
//
const BUCKET = ''
    , REGION = '' // e.g. us-east-2
    , PIXEL  = 'c.gif'

// Don't log under testing/development conditions
if (location.protocol != 'file:'     &&
    location.hostname != 'localhost' &&
    !location.hostname.endsWith('.local') &&
    location.search   != '?test')    // Fallback convention
{
    const url = new URL(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${PIXEL}`)
    if (document.referrer) {
        url.searchParams.set('R', document.referrer)
    }
    url.searchParams.set('L', window.location)

    fetch(url, {                     // Opaque response is fine; prevent
        mode: 'no-cors'              //   console errors related to CORS
      , referrerPolicy: 'unsafe-url' // Track precise URL
      , cache: 'no-store'            // Never use cache
    }).catch(e => e)
}
