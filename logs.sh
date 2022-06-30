#!/usr/bin/env sh

set -o pipefail

PUB_IP=$(curl -fs https://ip.seeip.org/) ||
    { echo "[log error]: couldn't resolve public ip." >&2; exit 1; }

filter() {
    jq -c 'select(.ua | startswith("S3Console") | not) |
           select(.user_id // "" | endswith("user/api-util") | not) |
           select(.ip != "'"$PUB_IP"'")'
}

split() {
    while read json; do
        local key=$(echo "$json" | jq -r '.log')
        local pfx=${key%%/*}
        case "$pfx" in
            j-kqz) ;;
                *) >&2 echo 'ERROR unknown prefix'
                   return 1 ;;
        esac
        local log=${outdir%/}/$pfx.json
        echo "$json" >> "$log"
    done
}

while getopts 'o:' opt; do
    case "$opt" in
        o) outdir=$OPTARG ;;
        *) ;;
    esac
done

shift $(($OPTIND-1))

if [ -z "${outdir:-}" ]; then
    filter
elif ! [ -d "${outdir}" -a -w "${outdir}" ]; then
    echo 'Bad out directory'
    exit 1
else
    filter | split
fi
