#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="public/videos"
OUT_DIR="public/videos/reencoded"
mkdir -p "$OUT_DIR"

echo "Re-encoding MP4 videos from $SRC_DIR to baseline H.264 (libx264) + AAC with orientation correction..."

for f in "$SRC_DIR"/*.mp4; do
  [ -e "$f" ] || continue
  base=$(basename "$f")
  out="$OUT_DIR/$base"
  codec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$f") || codec="unknown"
  rotate=$(ffprobe -v error -select_streams v:0 -show_entries stream_tags=rotate -of csv=p=0 "$f" 2>/dev/null || true)
  vf="scale=iw:ih" # identity (placeholder)
  # Apply transpose only if rotation metadata indicates portrait orientation
  case "$rotate" in
    90|-270) vf="transpose=1" ;; # rotate 90 deg clockwise
    -90|270) vf="transpose=2" ;; # rotate 90 deg counter-clockwise
    180|-180) vf="transpose=2,transpose=2" ;; # rotate 180
  esac
  if [ "$codec" = "h264" ] && [ "$vf" = "scale=iw:ih" ]; then
    echo "Skipping $base (already H.264 and orientation OK)"
    cp -n "$f" "$out" || true
    continue
  fi
  echo "Re-encoding $base (codec=$codec rotate=${rotate:-none} vf=$vf) -> $out"
  ffmpeg -y -i "$f" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -vf "$vf" -c:a aac -movflags +faststart -metadata:s:v rotate=0 "$out" >/dev/null 2>&1 || {
    echo "Failed to re-encode $base" >&2
  }
done

echo "Done. Review files in $OUT_DIR then replace originals as needed:"
echo "  mv $OUT_DIR/*.mp4 $SRC_DIR/"
