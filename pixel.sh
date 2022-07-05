#!/usr/bin/env sh

# Usage: pixel.sh [name.gif]
#
# Creates a 1x1 gif consisting of a single white pixel.
# If no output name given, `pixel.gif` is used.
#
magick xc:\#FFF ${1:-pixel.gif}
