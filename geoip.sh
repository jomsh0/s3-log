#!/usr/bin/env sh

geoip() {
    curl -fsL https://ip.seeip.org/geoip/$1
}

while read ip; do geoip $ip; done
