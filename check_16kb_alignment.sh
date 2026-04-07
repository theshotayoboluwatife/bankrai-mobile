#!/bin/bash
APK_FILE="$1"
TEMP_DIR=$(mktemp -d)

unzip -q "$APK_FILE" -d "$TEMP_DIR"

unaligned=0

for arch_dir in "$TEMP_DIR/lib"/*/; do
  arch=$(basename "$arch_dFir")

  if [ "$arch" != "arm64-v8a" ] && [ "$arch" != "x86_64" ]; then
    echo "Skipping $arch"
    continue
  fi

  echo "Architecture: $arch"

  for so in "$arch_dir"*.so; do
    [ -f "$so" ] || continue

    res=$(objdump -p "$so" 2>/dev/null | grep LOAD | awk '{print $NF}' | head -1)
    name=$(basename "$so")

    if echo "$res" | grep -qE '2\*\*(1[0-3]|[0-9]$)'; then
      echo "  UNALIGNED $name ($res)"
      unaligned=$((unaligned + 1))
    else
      echo "  ALIGNED   $name ($res)"
    fi
  done
done

rm -rf "$TEMP_DIR"

[ $unaligned -gt 0 ] \
  && echo "FAILED: $unaligned unaligned libs found." \
  || echo "PASSED: All libs are aligned."