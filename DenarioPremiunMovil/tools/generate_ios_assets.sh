#!/usr/bin/env bash
set -euo pipefail

# Usage: ./tools/generate_ios_assets.sh /path/to/source.png
# Requires: macOS (sips) - no external dependencies.

SRC="$1"
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Usage: $0 /path/to/source.png"
  echo "Place your source image (square PNG recommended) and pass its path."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/ios/App/App/Assets.xcassets"
APPICON_DIR="$ASSETS_DIR/AppIcon.appiconset"
LAUNCH_DIR="$ASSETS_DIR/LaunchImage.launchimage"

mkdir -p "$APPICON_DIR" "$LAUNCH_DIR"

echo "Generating iOS app icons into: $APPICON_DIR"

# App icon sizes (filename, width, height)
icons=(
  "Icon-20@2x.png 40 40"
  "Icon-20@3x.png 60 60"
  "Icon-29@2x.png 58 58"
  "Icon-29@3x.png 87 87"
  "Icon-40@2x.png 80 80"
  "Icon-40@3x.png 120 120"
  "Icon-60@2x.png 120 120"
  "Icon-60@3x.png 180 180"
  "Icon-76@1x.png 76 76"
  "Icon-76@2x.png 152 152"
  "Icon-83.5@2x.png 167 167"
  "Icon-1024.png 1024 1024"
  "AppIcon-512.png 512 512"
  "AppIcon-512@2x.png 1024 1024"
)

for entry in "${icons[@]}"; do
  read -r fname w h <<<"$entry"
  out="$APPICON_DIR/$fname"
  echo " - $fname -> ${w}x${h}"
  sips -z "$h" "$w" "$SRC" --out "$out" >/dev/null
done

echo "Generating launch/splash images into: $LAUNCH_DIR"

# A small set of common launch sizes (portrait). Add more if you need specific devices.
launchs=(
  # iPhone
  "Launch-320x568@2x.png 640 1136"            # iPhone 5/SE (320x568 @2x)
  "Launch-375x667@2x.png 750 1334"            # iPhone 6/7/8
  "Launch-414x736@3x.png 1242 2208"           # iPhone 6/7/8 Plus
  "Launch-375x812@3x.png 1125 2436"           # iPhone X/XS/11 Pro
  "Launch-414x896@3x.png 1242 2688"           # iPhone XR/11
  "Launch-390x844@3x.png 1170 2532"           # iPhone 12/13/14
  "Launch-428x926@3x.png 1284 2778"           # iPhone 12/13/14 Pro Max

  # iPad (portrait)
  "Launch-iPad-768x1024@1x.png 768 1024"
  "Launch-iPad-1536x2048@2x.png 1536 2048"
  "Launch-iPadPro-1668x2388@2x.png 1668 2388"
  "Launch-iPadPro-2048x2732@2x.png 2048 2732"
)

for entry in "${launchs[@]}"; do
  read -r fname w h <<<"$entry"
  out="$LAUNCH_DIR/$fname"
  echo " - $fname -> ${w}x${h}"
  sips -z "$h" "$w" "$SRC" --out "$out" >/dev/null || true
done

echo "Writing Contents.json files (AppIcon + LaunchImage)"

cat > "$APPICON_DIR/Contents.json" <<'JSON'
{
  "images" : [
    { "size" : "20x20", "idiom" : "iphone", "filename" : "Icon-20@2x.png", "scale" : "2x" },
    { "size" : "20x20", "idiom" : "iphone", "filename" : "Icon-20@3x.png", "scale" : "3x" },
    { "size" : "29x29", "idiom" : "iphone", "filename" : "Icon-29@2x.png", "scale" : "2x" },
    { "size" : "29x29", "idiom" : "iphone", "filename" : "Icon-29@3x.png", "scale" : "3x" },
    { "size" : "40x40", "idiom" : "iphone", "filename" : "Icon-40@2x.png", "scale" : "2x" },
    { "size" : "40x40", "idiom" : "iphone", "filename" : "Icon-40@3x.png", "scale" : "3x" },
    { "size" : "60x60", "idiom" : "iphone", "filename" : "Icon-60@2x.png", "scale" : "2x" },
    { "size" : "60x60", "idiom" : "iphone", "filename" : "Icon-60@3x.png", "scale" : "3x" },
    { "size" : "76x76", "idiom" : "ipad", "filename" : "Icon-76@1x.png", "scale" : "1x" },
    { "size" : "76x76", "idiom" : "ipad", "filename" : "Icon-76@2x.png", "scale" : "2x" },
    { "size" : "83.5x83.5", "idiom" : "ipad", "filename" : "Icon-83.5@2x.png", "scale" : "2x" },
    { "idiom" : "ios-marketing", "size" : "512x512", "filename" : "AppIcon-512.png", "scale" : "1x" },
    { "idiom" : "ios-marketing", "size" : "512x512", "filename" : "AppIcon-512@2x.png", "scale" : "2x" },
    { "idiom" : "ios-marketing", "size" : "1024x1024", "filename" : "Icon-1024.png", "scale" : "1x" }
  ],
  "info" : { "version" : 1, "author" : "xcode" }
}
JSON

cat > "$LAUNCH_DIR/Contents.json" <<'JSON'
{
  "images" : [
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-320x568@2x.png", "scale" : "2x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-375x667@2x.png", "scale" : "2x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-414x736@3x.png", "scale" : "3x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-375x812@3x.png", "scale" : "3x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-414x896@3x.png", "scale" : "3x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-390x844@3x.png", "scale" : "3x" },
    { "extent" : "full-screen", "idiom" : "iphone", "filename" : "Launch-428x926@3x.png", "scale" : "3x" },

    { "extent" : "full-screen", "idiom" : "ipad", "filename" : "Launch-iPad-768x1024@1x.png", "scale" : "1x" },
    { "extent" : "full-screen", "idiom" : "ipad", "filename" : "Launch-iPad-1536x2048@2x.png", "scale" : "2x" },
    { "extent" : "full-screen", "idiom" : "ipad", "filename" : "Launch-iPadPro-1668x2388@2x.png", "scale" : "2x" },
    { "extent" : "full-screen", "idiom" : "ipad", "filename" : "Launch-iPadPro-2048x2732@2x.png", "scale" : "2x" }
  ],
  "info" : { "version" : 1, "author" : "xcode" }
}
JSON

echo "Done. App icons and launch images generated."
echo "Add the AppIcon asset to Xcode asset catalog if not present, then run: npx cap sync ios"

exit 0
