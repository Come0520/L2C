#!/bin/bash
set -e

BASE_REF=$1
if [ -z "$BASE_REF" ]; then
  BASE_REF="origin/main"
fi

echo "Detailed lint check against $BASE_REF"

# Ensure we have the base ref
git fetch origin $(echo $BASE_REF | sed 's/origin\///') --depth=1 || echo "Fetch failed, continuing..."

# Find changed files (ts, tsx, js, jsx)
# We use relative paths from the current directory (slideboard-frontend)
# However, git diff returns paths relative to repo root.
# We are likely running this script FROM slideboard-frontend directory.
# So we need to handle paths carefully.

# If we are in slideboard-frontend, git root is ..
GIT_ROOT=$(git rev-parse --show-toplevel)
CURRENT_DIR=$(pwd)
REL_DIR=${CURRENT_DIR#$GIT_ROOT/}

echo "Git Root: $GIT_ROOT"
echo "Current Dir: $CURRENT_DIR"
echo "Relative Dir: $REL_DIR"

# Get files changed relative to git root
CHANGED_FILES_ROOT=$(git diff --name-only --diff-filter=ACMR $BASE_REF HEAD | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$CHANGED_FILES_ROOT" ]; then
  echo "No relevant files changed."
  exit 0
fi

# Filter files that are inside slideboard-frontend (or current dir)
TARGET_FILES=""
for file in $CHANGED_FILES_ROOT; do
  if [[ "$file" == "$REL_DIR"* ]]; then
    # Convert repo-root path to current-dir relative path
    # e.g. slideboard-frontend/src/foo.ts -> src/foo.ts
    LOCAL_PATH=${file#$REL_DIR/}
    TARGET_FILES="$TARGET_FILES $LOCAL_PATH"
  fi
done

if [ -z "$TARGET_FILES" ]; then
  echo "No changes in this project ($REL_DIR)."
  exit 0
fi

echo "Linting changed files..."
echo "$TARGET_FILES"

# Run eslint
npx eslint $TARGET_FILES --max-warnings=0
