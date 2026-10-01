#!/usr/bin/env bash
# Effect-demo voice track for the Voice Changer promo.
# A synthetic voice (espeak-ng + MBROLA us2) is run through one ffmpeg filter per
# effect and placed on the composition's beats, then muxed into the rendered MP4.
#
#   sudo apt-get install -y espeak-ng mbrola mbrola-us2
#   bash video/voice-changer-promo/audio.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SILENT="$HERE/output/voice-changer-promo.silent.mp4"
FINAL="$HERE/output/voice-changer-promo.mp4"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
SR=44100
VOICE=mb-us2

# Keep the silent render as the source so re-running never stacks audio.
[ -f "$SILENT" ] || cp "$FINAL" "$SILENT"

say() { # say NAME SPEED "text"
  espeak-ng -v "$VOICE" -s "$2" -w "$WORK/$1.raw.wav" "$3"
  ffmpeg -loglevel error -y -i "$WORK/$1.raw.wav" -af "aresample=$SR,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" -ac 1 "$WORK/$1.wav"
}
fx() { # fx IN OUT EFFECT
  local f
  case "$3" in
    natural)  f="anull" ;;
    Robot)    f="afftfilt=real='hypot(re,im)':imag='0':win_size=512:overlap=0.75,aecho=0.8:0.6:12:0.5,volume=1.4" ;;
    Chipmunk) f="asetrate=$SR*1.55,aresample=$SR" ;;
    Monster)  f="asetrate=$SR*0.68,aresample=$SR,atempo=1.25,aecho=0.8:0.5:40:0.3,volume=1.3" ;;
    Alien)    f="rubberband=pitch=1.3,vibrato=f=9:d=0.7,flanger=delay=3:depth=4:speed=2" ;;
    Echo)     f="apad=pad_dur=0.6,aecho=0.8:0.85:180|360|540:0.55|0.35|0.2" ;;
    tuned)    f="afftfilt=real='hypot(re,im)':imag='0':win_size=512:overlap=0.75,aecho=0.8:0.6:12:0.5,rubberband=pitch=1.26:tempo=0.9,volume=1.4" ;;
  esac
  ffmpeg -loglevel error -y -i "$WORK/$1.wav" -af "$f,aresample=$SR" -ac 1 "$WORK/$2.wav"
}

# Lines (timings match content.json / build.mjs beats)
say rec    165 "Hey! It's me."
say hello  190 "Hello!"
say robot  160 "Hey! It's me. The robot version."
say tuned  170 "Higher, and a little slower."
say sent   170 "Sent!"
say outro  150 "Sound like anyone."

fx rec   c_rec   natural      # 1 · recording   0.85 s
fx hello c_fx1   Robot        # 2 · effect sweep 2.55 s, one per 0.46 s
fx hello c_fx2   Chipmunk
fx hello c_fx3   Monster
fx hello c_fx4   Alien
fx hello c_fx5   Echo
fx robot c_prev  Robot        # 3 · live playback 5.85 s
fx tuned c_tune  tuned        # 4 · fine-tune 9.10 s
fx sent  c_sent  Chipmunk     # 5 · share 12.05 s
fx outro c_outro Echo         # end card 14.30 s

# name:start-seconds:max-seconds (clips longer than their window are sped up to fit)
CLIPS="c_rec:0.85:1.3 c_fx1:2.55:0.46 c_fx2:3.01:0.46 c_fx3:3.47:0.46 c_fx4:3.93:0.46 c_fx5:4.39:1.2 c_prev:5.85:1.85 c_tune:9.10:1.05 c_sent:12.05:0.9 c_outro:14.30:2.6"
inputs=(); filters=""; mix=""; i=0
for spec in $CLIPS; do
  IFS=: read -r name start max <<<"$spec"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/$name.wav")
  tempo=$(awk -v d="$dur" -v m="$max" 'BEGIN{t=d/m; if(t<1)t=1; if(t>2)t=2; printf "%.3f", t}')
  ms=$(awk -v s="$start" 'BEGIN{printf "%d", s*1000}')
  inputs+=(-i "$WORK/$name.wav")
  filters+="[$i:a]atempo=$tempo,atrim=0:$max,afade=t=out:st=$(awk -v m="$max" 'BEGIN{printf "%.2f", m-0.05}'):d=0.05,adelay=$ms|$ms[a$i];"
  mix+="[a$i]"; i=$((i+1))
done
ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "${filters}${mix}amix=inputs=$i:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad,atrim=0:17.5[out]" -map "[out]" -ac 2 "$WORK/voice.wav"

ffmpeg -loglevel error -y -i "$SILENT" -i "$WORK/voice.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 17.5 -movflags +faststart "$FINAL"
echo "Wrote $FINAL"
