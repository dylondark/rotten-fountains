#!/usr/bin/env bash
set -euo pipefail

# Force-rotate all MP4 videos under public/videos by 90 degrees clockwise
# Re-encodes to baseline H.264 + AAC for broad browser support.

SRC_DIR="public/videos"
OUT_DIR="public/videos/rotated"
mkdir -p "$OUT_DIR"

echo "Rotating all MP4 videos in $SRC_DIR by 90° clockwise..."

shopt -s nullglob
for f in "$SRC_DIR"/*.mp4; do
  base=$(basename "$f")
  out="$OUT_DIR/$base"
  echo "Processing $base -> $out"
  ffmpeg -y -i "$f" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -vf transpose=1 -c:a aac -movflags +faststart -metadata:s:v rotate=0 "$out" >/dev/null 2>&1 || {
    echo "[WARN] Failed to rotate $base" >&2
  }
done

echo "Rotation step complete. Review files in $OUT_DIR then replace originals:"
echo "  mv $OUT_DIR/*.mp4 $SRC_DIR/ && rmdir $OUT_DIR"
