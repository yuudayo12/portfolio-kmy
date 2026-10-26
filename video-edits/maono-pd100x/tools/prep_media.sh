#!/usr/bin/env bash
# Rebuild assets/ from the original Drive files (raw.mov, broll1-3.mov in $1).
set -euo pipefail
SRC=${1:?folder with raw.mov broll1.mov broll2.mov broll3.mov}
OUT=${2:-assets}
mkdir -p "$OUT"
enc=(-an -c:v libx264 -preset slow -crf 14 -g 15 -movflags +faststart)
ffmpeg -y -i "$SRC/raw.mov"    -vf "fps=30,format=yuv420p" "${enc[@]}" "$OUT/aroll.mp4"
ffmpeg -y -i "$SRC/broll1.mov" -vf "scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" "${enc[@]}" "$OUT/broll-mic.mp4"
ffmpeg -y -i "$SRC/broll2.mov" -vf "scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" "${enc[@]}" "$OUT/broll-cable.mp4"
ffmpeg -y -i "$SRC/broll3.mov" -vf "crop=1215:2160:1230:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" "${enc[@]}" "$OUT/broll-ports.mp4"
# Voice: clean-up EQ/denoise/compression, then static gain + limiter (keeps the volume-knob demo quieter)
ffmpeg -y -i "$SRC/raw.mov" -vn -ac 2 -ar 48000 -af "highpass=f=75,afftdn=nf=-30:tn=1,equalizer=f=220:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1:g=2,equalizer=f=9000:t=h:w=0.7:g=1.5,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=1,volume=13dB,alimiter=limit=0.82:attack=3:release=60:level=false" -c:a pcm_s16le "$OUT/voice.wav"
