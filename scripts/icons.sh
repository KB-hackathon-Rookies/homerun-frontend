#!/usr/bin/env bash
# 앱 아이콘을 원본 한 장에서 뽑는다.
#
# 원본(`app/assets/brand/icon-source.jpg`)은 모서리가 이미 둥글고 그 바깥이
# 흰색이다. 그대로 쓰면 iOS 가 한 번 더 둥글려 모서리에 흰 삼각형이 끼고,
# Android maskable 은 더 크게 잘라내서 흰 조각이 드러난다.
#
# 그래서 둥근 모서리 **안쪽**을 정사각으로 잘라 낸다. 잘라 낸 뒤에는 네 귀퉁이가
# 전부 파랑이라 어떤 모양으로 잘려도 흰색이 나오지 않는다.
#
# 자르는 크기 970 은 원본을 브라우저 캔버스로 읽어 네 귀퉁이가 모두 파랑인
# 가장 큰 정사각을 찾아 구한 값이다. 원본이 바뀌면 다시 재야 한다.
#
# 도구는 macOS 기본 `sips` 만 쓴다. 아이콘 몇 장 만들자고 의존성을 늘리지 않는다.
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="app/assets/brand/icon-source.jpg"
OUT="public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 둥근 모서리 안쪽. 이 값이 파랑으로만 이뤄진 정사각의 한 변이다.
SAFE=960
# maskable 안전영역은 지름 80% 다. 가장자리가 잘려도 캐릭터가 남게 줄여 둔다.
INNER=410
# 줄인 자리를 채울 색. 원본 배경의 파랑이다.
BLUE=5090FC

sips -s format png -c "$SAFE" "$SAFE" "$SRC" --out "$TMP/full.png" >/dev/null

sips -z 512 512 "$TMP/full.png" --out "$OUT/icon-512.png" >/dev/null
sips -z 192 192 "$TMP/full.png" --out "$OUT/icon-192.png" >/dev/null
sips -z 180 180 "$TMP/full.png" --out "$OUT/apple-touch-icon.png" >/dev/null

sips -z "$INNER" "$INNER" "$TMP/full.png" --out "$TMP/inner.png" >/dev/null
sips -p 512 512 --padColor "$BLUE" "$TMP/inner.png" --out "$OUT/icon-maskable-512.png" >/dev/null

echo "만든 것:"
for f in icon-512 icon-192 apple-touch-icon icon-maskable-512; do
  printf '  %-24s %s\n' "$f.png" "$(sips -g pixelWidth -g pixelHeight "$OUT/$f.png" | tail -2 | tr -d ' \n')"
done
