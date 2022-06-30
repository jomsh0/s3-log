#!/usr/bin/env -S deno run --check --allow-env --allow-read=${HOME}/.aws --allow-net

import { ApiFactory } from 'https://deno.land/x/aws_api/client/mod.ts';
import { S3, Delete, type ListObjectsV2Output } from 'https://deno.land/x/aws_api/services/s3/mod.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { writeAllSync, readAll } from 'https://deno.land/std/streams/conversion.ts'
import { parse } from 'https://deno.land/std/flags/mod.ts'

const $ = parse(Deno.args, {
    default: { delete: false, list: false, bucket: 'jomshcc-log', region: 'us-east-2' },
    string: [ 'bucket', 'prefix', 'region' ],
    alias: { list: 'l', delete: 'd', bucket: 'b', prefix: 'p', region: 'r' }
})

const factory = new ApiFactory({ region: $.region })
    , s3 = new S3(factory)
    , te = new TextEncoder

// type Log = ReturnType<typeof structLogs> extends AsyncGenerator<infer T> ? T : never
// type LogEntry = { date: Date, ip: string, source: string, referrer: string | null, ua: string }

await factory.ensureCredentialsAvailable();

// if ($.delete && Deno.isatty(Deno.stdin.rid)) {
//     const text = new TextDecoder().decode(await readAll(Deno.stdin))
//         , keys = text.trim()
//             .split(/\r?\n/)
//             .map<LogEntry>(s => JSON.parse(s))
//             .map<string>( ({ log }) => log )
//             .reduce<string[]>(
//                 (p, key, _i, _a) => {
//                     if (!p.includes(key)) { p.push(key) }
//                     return p
//                 }
//                 , [] )

//     //const Objects = keys.map( Key => ({ Key }) )
//     //    , resp = await s3.deleteObjects({ Bucket: $.bucket, Delete: { Objects } })

//     for (const Key of keys) { await s3.deleteObject({ Bucket: $.bucket, Key }) }
//     Deno.exit()
// }

const list = await s3.listObjectsV2({ Bucket: $.bucket, Prefix: $.prefix })
if ($.list) {
    jsonOut(list)
    Deno.exit()
}

const my_ip = await fetch('https://ip.seeip.org/').then(r => r.text())

for await (const [ Key, entries ] of structLogs(list)) {
    for (const entry of entries) {
        const { url, date, ip, ua, referrer: source }  = entry
            , path = decodeURIComponent(url.pathname)
            , referrer = url.searchParams.get('r')
        
        if (path !== '/c.gif' || ip === my_ip) { continue }

        jsonOut({ date, ip, source, referrer, ua })
    }
    if ($.delete) { await s3.deleteObject({ Bucket: $.bucket, Key}) }
}

function jsonOut(obj: any, newline = true) {
    let buf = te.encode(JSON.stringify(obj) + '\n')
    if (!newline) { buf = buf.subarray(buf.byteOffset, buf.byteLength - 1) }
    writeAllSync(Deno.stdout, buf)
}

async function *structLogs(list: ListObjectsV2Output) {
    for await (const [ Key, entries ] of textLogs(list)) {
        yield [ Key, entries.map(parseEntry) ] as const
    }
}

async function *textLogs(list: ListObjectsV2Output) {
    const td = new TextDecoder
        , { Name: Bucket, Contents } = list

    assert( Bucket )
    for (const { Key } of Contents) {
        if (!Key) { continue }
        const { Body } = await s3.getObject({ Bucket, Key })
        if (!Body) { continue }
        
        const entries = td.decode(Body).trim().split(/\r?\n/)

        yield [ Key, entries ] as const
    }
}

function parseEntry(entry: string) {
    function *parts(entry: string) {
        while (entry.trim().length > 0) {
            let next: string
            switch(entry.at(0)) {
                case '"':
                    [ , next, entry ] = entry.match(/"([^"]+)"(?:$|[ ])(.*)/)!
                    break
                case '[':
                    [ , next, entry ] = entry.match(/\[([^\]]+)\](?:$|[ ])(.*)/)!
                    break
                default : 
                    [ , next, entry ] = entry.match(/(\S+)(?:$|[ ])(.*)/)!
            }
            yield next
        }
    }
    
    const [ _owner, _bucket, stamp, ip, _user_id, _rid, _op, _key,
            req, status, _err, _sent, _size, _ms_total, _ms_s3, referrer,
            ua, _ver, _host, _sig, _ciph, _auth, host, _tlsv, _access_pt ]
          = [ ...parts(entry) ]

    const date = new Date(stamp.replace(':', ' '))
        , path = req.split(' ')[1] ?? req

    assert(!host.endsWith('/') && path.startsWith('/'))
    return { date, ip, url: new URL('http://' + host.trim() + path.trim()), status, referrer, ua }
}