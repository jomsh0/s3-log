if (location.protocol != 'file:' && location.hostname != 'localhost' && location.search != '?test') {

    const url = new URL('https://jomshcc.s3.us-east-2.amazonaws.com/c.gif')
    if (document.referrer) { url.searchParams.set('r', document.referrer) }

    fetch(url, {
        mode: 'no-cors'   // prevent preflight shenanigans
      , referrerPolicy: 'unsafe-url' // track precise URL
      , cache: 'no-store' // never use cache
    }).catch(e => e)

}

